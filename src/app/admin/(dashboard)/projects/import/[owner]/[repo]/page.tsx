import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/auth";
import { getRepo, fetchAnalyzableFiles } from "@/server/github";
import {
  analyzeRepository,
  getAiConfigStatus,
  type Analysis,
} from "@/server/analyzer";
import { ImportReviewForm } from "./ImportReviewForm";

export const dynamic = "force-dynamic";

export default async function ImportReviewPage({
  params,
}: {
  params: Promise<{ owner: string; repo: string }>;
}) {
  await requireAdmin();
  const { owner, repo: repoName } = await params;

  const repoRes = await getRepo(owner, repoName);
  if (!repoRes.ok) {
    return (
      <div className="p-6">
        <Link href="/admin/projects/import" className="label mb-4 inline-block hover:text-[var(--os-accent)]">
          ← Back to repository list
        </Link>
        <div className="rounded-[var(--os-r-panel)] border border-[var(--os-crit)]/30 bg-[var(--os-crit)]/[0.06] p-6 text-center">
          <h1 className="text-sm font-semibold text-[var(--os-fg)]">Repository Not Accessible</h1>
          <p className="mt-1 text-xs text-[var(--os-fg-muted)]">{repoRes.error}</p>
        </div>
      </div>
    );
  }

  const repo = repoRes.data;
  const aiStatus = await getAiConfigStatus();

  // Fetch analyzable files (README, package.json, Dockerfile, etc.)
  const filesRes = await fetchAnalyzableFiles(owner, repoName, repo.default_branch);
  const files = filesRes.ok ? filesRes.data.files : [];
  const headSha = filesRes.ok ? filesRes.data.headSha : undefined;

  let analysis: Analysis | null = null;
  let aiSuccess = false;
  let errorMessage: string | undefined = undefined;

  if (aiStatus.isReady && files.length > 0) {
    const aiRes = await analyzeRepository(
      { owner, name: repoName, description: repo.description },
      files,
      aiStatus.activeProvider
    );

    if (aiRes.ok) {
      analysis = aiRes.analysis;
      aiSuccess = true;
    } else {
      errorMessage = aiRes.error;
    }
  } else if (!aiStatus.isReady) {
    errorMessage = `AI analysis skipped: ${aiStatus.activeProvider === "gemini" ? "Google Gemini" : "Anthropic"} API key is not configured. Falling back to basic repository metadata.`;
  } else if (files.length === 0) {
    errorMessage = "No recognizable configuration or description files found in repository. Basic metadata applied.";
  }

  return (
    <>
      <Link href="/admin/projects/import" className="label mb-4 inline-block hover:text-[var(--os-accent)]">
        ← Repositories
      </Link>

      <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-[var(--os-fg)]">
            Review & Import Project
          </h1>
          <p className="text-sm text-[var(--os-fg-muted)]">
            Review the extracted metadata for <span className="font-mono text-[var(--os-fg)]">{repo.full_name}</span> before adding it to your portfolio OS.
          </p>
        </div>

        <span className="font-mono text-xs text-[var(--os-fg-faint)]">
          {files.length} file{files.length === 1 ? "" : "s"} inspected
        </span>
      </div>

      <ImportReviewForm
        repo={repo}
        analysis={analysis}
        provider={aiStatus.activeProvider}
        aiSuccess={aiSuccess}
        errorMessage={errorMessage}
        headSha={headSha}
      />
    </>
  );
}
