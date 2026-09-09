"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { audit, requireAdmin } from "@/server/auth";
import { ProjectInput, formBool } from "@/server/validation";

/**
 * Every mutation calls requireAdmin() itself. The layout guard stops a
 * browser reaching the page, but a Server Action is a POST endpoint — it can
 * be invoked directly, so it must authorize itself (§2, §21).
 *
 * After each write, revalidatePath("/") drops the ISR cache so the public
 * portfolio reflects the change on the next request instead of waiting out
 * the 5-minute window.
 */

export type FormState = { error?: string; ok?: string };

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

function parse(fd: FormData) {
  return ProjectInput.safeParse({
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
}

/** replace a project's technology links, creating any new technologies */
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

export async function saveProject(
  id: string | null,
  _prev: FormState,
  fd: FormData
): Promise<FormState> {
  const user = await requireAdmin();

  const parsed = parse(fd);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: `${first.path.join(".") || "form"}: ${first.message}` };
  }
  const { technologies, ...d } = parsed.data;

  // hosting is explicit: a URL can be stored while hosting is off (§6)
  const data = {
    name: d.name,
    slug: d.slug,
    shortDescription: d.shortDescription,
    longDescription: d.longDescription,
    category: d.category,
    period: d.period || null,
    team: d.team || null,
    githubUrl: d.githubUrl ?? null,
    liveUrl: d.liveUrl ?? null,
    docsUrl: d.docsUrl ?? null,
    repoVisibility: d.repoVisibility,
    hosted: d.hosted,
    featured: d.featured,
    clientWork: d.clientWork,
    status: d.status,
    caveat: d.caveat || null,
    features: d.features,
    challenges: d.challenges,
    learned: d.learned,
    skills: d.skills,
  };

  let projectId = id;
  try {
    if (id) {
      await db.project.update({ where: { id }, data });
    } else {
      const created = await db.project.create({ data });
      projectId = created.id;
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("Unique constraint")) return { error: `The slug "${d.slug}" is already taken.` };
    return { error: "Could not save. Check the fields and try again." };
  }

  await syncTechnologies(projectId!, technologies);
  await audit(user.id, id ? "project.update" : "project.create", "Project", projectId!, { slug: d.slug });

  revalidatePath("/");
  revalidatePath("/admin/projects");

  if (!id) redirect(`/admin/projects/${projectId}`);
  return { ok: "Saved. The portfolio is already showing it." };
}

/** one action for all the quick toggles in the list view */
export async function setProjectFlag(id: string, flag: "featured" | "status", value: string) {
  const user = await requireAdmin();

  const data =
    flag === "featured"
      ? { featured: value === "true" }
      : { status: value as "DRAFT" | "PUBLISHED" | "ARCHIVED" };

  await db.project.update({ where: { id }, data });
  await audit(user.id, `project.${flag}`, "Project", id, { value });

  revalidatePath("/");
  revalidatePath("/admin/projects");
}

export async function deleteProject(id: string) {
  const user = await requireAdmin();

  const p = await db.project.findUnique({ where: { id }, select: { slug: true } });
  // applications and technology links cascade; assets go with them
  await db.project.delete({ where: { id } });
  await audit(user.id, "project.delete", "Project", id, { slug: p?.slug });

  revalidatePath("/");
  revalidatePath("/admin/projects");
  redirect("/admin/projects");
}
