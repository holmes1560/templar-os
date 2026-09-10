import { db } from "@/lib/db";
import { authenticateRequest, authorizeScope } from "@/server/api-auth";
import { listRepos, fetchAnalyzableFiles } from "@/server/github";
import { analyzeRepository } from "@/server/analyzer";
import { recordRevision } from "@/server/revisions";
import { z } from "zod";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/github/discover
 *
 * Compare GitHub account repositories against existing portfolio projects.
 * Returns a list of repositories that do not yet exist in the portfolio.
 */
export async function GET(req: Request) {
  const auth = await authenticateRequest(req);
  const authError = authorizeScope(auth, "projects:read");
  if (authError) return authError;

  const ghRes = await listRepos(1, 100);
  if (!ghRes.ok) {
    return Response.json(
      { ok: false, error: ghRes.error, needsReauth: ghRes.needsReauth },
      { status: 502 }
    );
  }

  const existingProjects = await db.project.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      githubRepoId: true,
      githubUrl: true,
      repositoryName: true,
      repositoryOwner: true,
    },
  });

  const existingRepoIds = new Set(
    existingProjects
      .filter((p) => p.githubRepoId !== null)
      .map((p) => String(p.githubRepoId))
  );
  const existingNames = new Set(
    existingProjects.map((p) => `${p.repositoryOwner || ""}/${p.repositoryName || ""}`.toLowerCase())
  );
  const existingUrls = new Set(
    existingProjects
      .filter((p) => p.githubUrl)
      .map((p) => p.githubUrl!.toLowerCase().replace(/\/$/, ""))
  );

  const missingRepos = ghRes.data.filter((r) => {
    if (existingRepoIds.has(String(r.id))) return false;
    if (existingNames.has(r.full_name.toLowerCase())) return false;
    if (existingUrls.has(r.html_url.toLowerCase())) return false;
    return true;
  });

  return Response.json({
    ok: true,
    totalGitHubRepos: ghRes.data.length,
    portfolioProjectsCount: existingProjects.length,
    missingCount: missingRepos.length,
    missingRepositories: missingRepos.map((r) => ({
      id: r.id,
      name: r.name,
      fullName: r.full_name,
      owner: r.owner.login,
      htmlUrl: r.html_url,
      description: r.description,
      language: r.language,
      isPrivate: r.private,
      updatedAt: r.updated_at,
    })),
  });
}

const ImportRepoSchema = z.object({
  owner: z.string().trim().min(1),
  repo: z.string().trim().min(1),
  createDraft: z.boolean().default(true),
});

/**
 * POST /api/v1/github/discover
 *
 * Discovers and analyzes a specific repository, extracting technologies, features,
 * architecture, and challenges, and creates a DRAFT in the review queue.
 */
export async function POST(req: Request) {
  const auth = await authenticateRequest(req);
  const authError = authorizeScope(auth, "drafts:create");
  if (authError) return authError;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = ImportRepoSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Validation failed", details: parsed.error.format() },
      { status: 400 }
    );
  }

  const { owner, repo } = parsed.data;

  // 1. Fetch analyzable files from GitHub
  const filesRes = await fetchAnalyzableFiles(owner, repo);
  if (!filesRes.ok) {
    return Response.json(
      { ok: false, error: `Failed to fetch files from GitHub: ${filesRes.error}` },
      { status: 502 }
    );
  }

  // 2. Run multi-provider AI analyzer
  const analysisRes = await analyzeRepository(
    { owner, name: repo },
    filesRes.data.files
  );

  if (!analysisRes.ok) {
    return Response.json(
      { ok: false, error: `Repository analysis failed: ${analysisRes.error}` },
      { status: 500 }
    );
  }

  const a = analysisRes.analysis;
  const projectSlug = a.name
    .toLowerCase()
    .trim()
    .replace(/[+]/g, "-plus")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const draftData = {
    name: a.name,
    slug: projectSlug,
    shortDescription: a.shortDescription,
    longDescription: a.longDescription,
    category: a.category.toUpperCase(),
    githubUrl: `https://github.com/${owner}/${repo}`,
    repositoryOwner: owner,
    repositoryName: repo,
    repoVisibility: "PUBLIC",
    technologies: a.technologies,
    features: a.features,
    challenges: a.challenges,
    architecture: a.architecture || undefined,
    role: "Project Author / Contributor",
    status: "DRAFT",
    hosted: Boolean(a.liveUrlFound),
    liveUrl: a.liveUrlFound || undefined,
    isAiGenerated: true,
    aiOrigin: `AI Analyzer (${analysisRes.provider}/${analysisRes.model})`,
  };

  const draft = await db.draft.create({
    data: {
      entityType: "project",
      action: "CREATE",
      title: a.name,
      summary: a.shortDescription,
      data: draftData,
      status: "PENDING",
      isAiGenerated: true,
      aiOrigin: `GitHub Discovery (${analysisRes.provider})`,
      createdByApiKeyId: auth.apiKey?.id,
    },
  });

  await recordRevision({
    entityType: "draft",
    entityId: draft.id,
    changeType: "CREATE",
    summary: `Created project draft for GitHub repo ${owner}/${repo}`,
    newValue: draft,
    apiKeyId: auth.apiKey?.id,
    isAiGenerated: true,
  });

  return Response.json({
    ok: true,
    message: `Analyzed ${owner}/${repo} and generated a project draft.`,
    draft,
    analysis: a,
    provider: analysisRes.provider,
    model: analysisRes.model,
  });
}
