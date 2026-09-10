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
      <p className="mb-4 text-sm text-[var(--os-fg-muted)]">
        Created as a draft. Nothing reaches the portfolio until you set it to published.
      </p>

      <div className="mb-6 flex items-center justify-between rounded-[var(--os-r-chip)] border border-[var(--os-accent)]/30 bg-[var(--os-accent)]/[0.06] p-3.5 text-xs text-[var(--os-fg)]">
        <div>
          <span className="font-semibold text-[var(--os-accent)]">Have a GitHub repository?</span>
          <p className="text-[var(--os-fg-muted)]">You can automatically import metadata, README, and tech stack via AI.</p>
        </div>
        <Link
          href="/admin/projects/import"
          className="pressable shrink-0 rounded-[var(--os-r-chip)] bg-[var(--os-accent)] px-3 py-1.5 font-medium text-[var(--os-accent-fg)]"
        >
          Import from GitHub →
        </Link>
      </div>

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
