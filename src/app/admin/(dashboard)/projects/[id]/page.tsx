import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/server/auth";
import { ProjectForm } from "../ProjectForm";

export const dynamic = "force-dynamic";

export default async function EditProject({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const p = await db.project.findUnique({
    where: { id },
    include: { technologies: { include: { technology: true }, orderBy: { order: "asc" } } },
  });
  if (!p) notFound();

  return (
    <>
      <Link href="/admin/projects" className="label mb-4 inline-block hover:text-[var(--os-accent)]">
        ← Projects
      </Link>
      <h1 className="mb-6 text-lg font-semibold tracking-tight text-[var(--os-fg)]">{p.name}</h1>

      <ProjectForm
        values={{
          id: p.id,
          name: p.name,
          slug: p.slug,
          shortDescription: p.shortDescription,
          longDescription: p.longDescription,
          category: p.category,
          period: p.period ?? "",
          team: p.team ?? "",
          githubUrl: p.githubUrl ?? "",
          liveUrl: p.liveUrl ?? "",
          docsUrl: p.docsUrl ?? "",
          repoVisibility: p.repoVisibility,
          hosted: p.hosted,
          featured: p.featured,
          clientWork: p.clientWork,
          status: p.status,
          caveat: p.caveat ?? "",
          technologies: p.technologies.map((t) => t.technology.name).join(", "),
          features: p.features.join("\n"),
          challenges: p.challenges.join("\n"),
          learned: p.learned.join("\n"),
          skills: p.skills.join(", "),
          aiShortDescription: p.aiShortDescription,
          aiLongDescription: p.aiLongDescription,
        }}
      />
    </>
  );
}
