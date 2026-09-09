import Link from "next/link";
import { requireAdmin } from "@/server/auth";
import { ProjectForm } from "../ProjectForm";

export const dynamic = "force-dynamic";

export default async function NewProject() {
  await requireAdmin();

  return (
    <>
      <Link href="/admin/projects" className="label mb-4 inline-block hover:text-[var(--os-accent)]">
        ← Projects
      </Link>
      <h1 className="mb-1 text-lg font-semibold tracking-tight text-[var(--os-fg)]">New project</h1>
      <p className="mb-6 text-sm text-[var(--os-fg-muted)]">
        Created as a draft. Nothing reaches the portfolio until you set it to published.
      </p>

      <ProjectForm
        values={{
          id: null,
          name: "", slug: "",
          shortDescription: "", longDescription: "",
          category: "WEB", period: "", team: "",
          githubUrl: "", liveUrl: "", docsUrl: "",
          repoVisibility: "PUBLIC",
          hosted: false, featured: false, clientWork: false,
          status: "DRAFT", caveat: "",
          technologies: "", features: "", challenges: "", learned: "", skills: "",
        }}
      />
    </>
  );
}
