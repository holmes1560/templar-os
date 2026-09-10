import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/server/auth";
import { connectionStatus, listRepos } from "@/server/github";
import { getAiConfigStatus } from "@/server/analyzer";
import { RepoList } from "./RepoList";

export const dynamic = "force-dynamic";

export default async function ImportProjectsPage() {
  await requireAdmin();

  const conn = await connectionStatus();
  const aiStatus = await getAiConfigStatus();

  if (conn.state !== "connected") {
    return (
      <>
        <Link href="/admin/projects" className="label mb-4 inline-block hover:text-[var(--os-accent)]">
          ← Projects
        </Link>
        <h1 className="mb-1 text-lg font-semibold tracking-tight text-[var(--os-fg)]">
          Import from GitHub
        </h1>
        <p className="mb-6 text-sm text-[var(--os-fg-muted)]">
          Connect your GitHub account to automatically analyze and import repositories.
        </p>

        <div className="rounded-[var(--os-r-panel)] border border-[var(--os-warn)]/30 bg-[var(--os-warn)]/[0.06] p-6">
          <h2 className="text-sm font-semibold text-[var(--os-fg)]">GitHub is not connected</h2>
          <p className="mt-1 text-xs leading-relaxed text-[var(--os-fg-muted)]">
            Before importing, connect your GitHub account in Settings so TEMPLAR OS has read access to your repositories.
          </p>
          <div className="mt-4">
            <Link
              href="/admin/settings"
              className="pressable inline-block rounded-[var(--os-r-chip)] bg-[var(--os-accent)] px-3.5 py-2 text-xs font-medium text-[var(--os-accent-fg)]"
            >
              Go to Settings →
            </Link>
          </div>
        </div>
      </>
    );
  }

  const reposRes = await listRepos(1, 100);
  const repos = reposRes.ok ? reposRes.data : [];

  const existingProjects = await db.project.findMany({
    where: { githubRepoId: { not: null } },
    select: { id: true, name: true, slug: true, githubRepoId: true },
  });

  const linkedMap: Record<string, { id: string; name: string; slug: string }> = {};
  for (const p of existingProjects) {
    if (p.githubRepoId) {
      linkedMap[p.githubRepoId.toString()] = { id: p.id, name: p.name, slug: p.slug };
    }
  }

  return (
    <>
      <Link href="/admin/projects" className="label mb-4 inline-block hover:text-[var(--os-accent)]">
        ← Projects
      </Link>

      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-[var(--os-fg)]">
            Import from GitHub
          </h1>
          <p className="mt-1 text-sm text-[var(--os-fg-muted)]">
            Select a repository to extract metadata, README, and technologies into your portfolio.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {conn.avatarUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={conn.avatarUrl}
              alt=""
              width={24}
              height={24}
              className="rounded-full border border-[var(--os-line)]"
            />
          )}
          <span className="font-mono text-xs text-[var(--os-fg)]">@{conn.login}</span>
        </div>
      </div>

      {!aiStatus.isReady && (
        <div className="mb-6 rounded-[var(--os-r-chip)] border border-[var(--os-warn)]/30 bg-[var(--os-warn)]/[0.07] p-3 text-xs text-[var(--os-fg-muted)]">
          <span className="font-semibold text-[var(--os-warn)]">Notice:</span> Active AI provider ({aiStatus.activeProvider}) has no API key set. You will be able to review files, but automated AI analysis requires a key in{" "}
          <Link href="/admin/settings" className="underline hover:text-[var(--os-fg)]">
            Settings
          </Link>
          .
        </div>
      )}

      {!reposRes.ok && (
        <div className="mb-6 rounded-[var(--os-r-chip)] border border-[var(--os-crit)]/30 bg-[var(--os-crit)]/[0.08] p-3 text-xs text-[var(--os-crit)]">
          Failed to load repositories from GitHub: {reposRes.error}
        </div>
      )}

      <RepoList repos={repos} linkedMap={linkedMap} />
    </>
  );
}
