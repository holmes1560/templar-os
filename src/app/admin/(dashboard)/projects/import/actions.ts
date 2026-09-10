"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { audit, requireAdmin } from "@/server/auth";
import { ProjectInput, formBool } from "@/server/validation";
import type { Category, ProjectStatus, RepoVisibility } from "@prisma/client";

export type FormState = { error?: string; ok?: string };

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

async function syncTechnologies(projectId: string, names: string[]) {
  await db.projectTechnology.deleteMany({ where: { projectId } });
  for (const [order, name] of names.entries()) {
    const tech = await db.technology.upsert({
      where: { name },
      update: {},
      create: { name, slug: slugify(name) },
    });
    await db.projectTechnology.create({
      data: { projectId, technologyId: tech.id, order },
    });
  }
}

export async function importProjectAction(
  _prev: FormState,
  fd: FormData
): Promise<FormState> {
  const user = await requireAdmin();

  const parsedProject = ProjectInput.safeParse({
    name: fd.get("name"),
    slug: fd.get("slug"),
    shortDescription: fd.get("shortDescription"),
    longDescription: fd.get("longDescription"),
    category: fd.get("category"),
    period: fd.get("period") ?? "",
    team: fd.get("team") ?? "",
    githubUrl: fd.get("githubUrl") ?? "",
    liveUrl: fd.get("liveUrl") ?? "",
    docsUrl: fd.get("docsUrl") ?? "",
    repoVisibility: fd.get("repoVisibility"),
    hosted: formBool(fd, "hosted"),
    featured: formBool(fd, "featured"),
    clientWork: formBool(fd, "clientWork"),
    status: fd.get("status"),
    caveat: fd.get("caveat") ?? "",
    technologies: fd.get("technologies") ?? "",
    features: fd.get("features") ?? "",
    challenges: fd.get("challenges") ?? "",
    learned: fd.get("learned") ?? "",
    skills: fd.get("skills") ?? "",
  });

  if (!parsedProject.success) {
    const first = parsedProject.error.issues[0];
    return { error: `${first.path.join(".") || "form"}: ${first.message}` };
  }

  const { technologies, ...d } = parsedProject.data;

  const githubRepoIdRaw = fd.get("githubRepoId") as string | null;
  const githubRepoId = githubRepoIdRaw ? BigInt(githubRepoIdRaw) : null;
  const defaultBranch = (fd.get("defaultBranch") as string) || null;
  const lastAnalyzedSha = (fd.get("lastAnalyzedSha") as string) || null;

  const createApp = formBool(fd, "createApp");
  const appName = (fd.get("appName") as string) || d.name;
  const appIcon = (fd.get("appIcon") as string) || "folder";
  const launchMode = (fd.get("launchMode") as string) || "INTERNAL";
  const desktopVisible = formBool(fd, "desktopVisible");
  const workspace = Number(fd.get("workspace") || 1);

  let projectId: string;

  try {
    const project = await db.$transaction(async (tx) => {
      const createdProject = await tx.project.create({
        data: {
          name: d.name,
          slug: d.slug,
          shortDescription: d.shortDescription,
          longDescription: d.longDescription,
          category: d.category as Category,
          period: d.period || null,
          team: d.team || null,
          githubUrl: d.githubUrl || null,
          liveUrl: d.liveUrl || null,
          docsUrl: d.docsUrl || null,
          repoVisibility: d.repoVisibility as RepoVisibility,
          hosted: d.hosted,
          featured: d.featured,
          clientWork: d.clientWork,
          status: d.status as ProjectStatus,
          caveat: d.caveat || null,
          features: d.features,
          challenges: d.challenges,
          learned: d.learned,
          skills: d.skills,
          githubRepoId,
          defaultBranch,
          lastAnalyzedSha,
          lastSyncedAt: new Date(),
        },
      });

      if (createApp) {
        // Calculate cell position in workspace
        const maxCell = await tx.application.aggregate({
          where: { workspace },
          _max: { cell: true },
        });
        const nextCell = (maxCell._max.cell ?? -1) + 1;

        const appKey = `app-${slugify(d.slug)}`;
        await tx.application.create({
          data: {
            appKey,
            name: appName,
            icon: appIcon,
            launchMode: launchMode as "IFRAME" | "EXTERNAL" | "INTERNAL" | "DEMO",
            url: d.liveUrl || null,
            projectId: createdProject.id,
            enabled: true,
            desktopVisible,
            workspace,
            cell: nextCell,
          },
        });
      }

      return createdProject;
    });

    projectId = project.id;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Unique constraint") || msg.includes("slug")) {
      return { error: `The project slug "${d.slug}" is already taken.` };
    }
    return { error: "Failed to save project. Check fields and try again." };
  }

  await syncTechnologies(projectId, technologies);
  await audit(user.id, "project.import", "Project", projectId, { slug: d.slug, githubRepoId: githubRepoId?.toString() });

  revalidatePath("/");
  revalidatePath("/admin/projects");
  revalidatePath("/admin/applications");

  redirect(`/admin/projects/${projectId}`);
}
