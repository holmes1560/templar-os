/**
 * Raw database read. Deliberately free of the `server-only` guard so the
 * snapshot script can run it under plain Node — `server-only` throws outside
 * a Next.js server context by design.
 *
 * Nothing here has a fallback: callers decide what a failure means.
 */
import { db } from "@/lib/db";
import type {
  PortfolioData, PublicProject, PublicApp,
  CategoryKey, RepoVisibilityKey, LaunchModeKey,
} from "@/lib/portfolio-types";

const toCategory = (c: string) => c.toLowerCase() as CategoryKey;
const toVisibility = (v: string) => v.toLowerCase() as RepoVisibilityKey;
const toLaunchMode = (m: string) => m.toLowerCase() as LaunchModeKey;

export async function queryDatabase(): Promise<PortfolioData> {
  const [projectRows, appRows, settingRows] = await Promise.all([
    db.project.findMany({
      where: { status: "PUBLISHED" },
      include: {
        technologies: { include: { technology: true }, orderBy: { order: "asc" } },
        applications: { where: { enabled: true } },
      },
      orderBy: [{ featured: "desc" }, { createdAt: "asc" }],
    }),
    db.application.findMany({
      where: { enabled: true },
      orderBy: [{ workspace: "asc" }, { cell: "asc" }],
    }),
    db.setting.findMany(),
  ]);

  const projects: PublicProject[] = projectRows.map((p) => ({
    slug: p.slug,
    title: p.name,
    summary: p.shortDescription,
    description: p.longDescription,
    category: toCategory(p.category),
    period: p.period ?? "",
    team: p.team ?? undefined,
    technologies: p.technologies.map((t) => t.technology.name),
    skills: p.skills,
    features: p.features,
    challenges: p.challenges,
    learned: p.learned,
    visibility: toVisibility(p.repoVisibility),
    githubUrl: p.githubUrl ?? undefined,
    // hosting is explicit: a URL that exists but is switched off must not leak
    demoUrl: p.hosted && p.liveUrl ? p.liveUrl : undefined,
    docsUrl: p.docsUrl ?? undefined,
    embeddable: p.applications.some((a) => a.launchMode === "IFRAME"),
    featured: p.featured,
    clientWork: p.clientWork,
    caveat: p.caveat ?? undefined,
  }));

  const bySlug = new Map(projectRows.map((p) => [p.id, p.slug]));

  const apps: PublicApp[] = appRows.map((a) => ({
    appKey: a.appKey,
    name: a.name,
    icon: a.icon,
    launchMode: toLaunchMode(a.launchMode),
    url: a.url ?? undefined,
    workspace: a.workspace,
    cell: a.cell,
    width: a.windowWidth,
    height: a.windowHeight,
    resizable: a.resizable,
    maximizable: a.maximizable,
    minimizable: a.minimizable,
    projectSlug: a.projectId ? bySlug.get(a.projectId) : undefined,
  }));

  const settings = Object.fromEntries(settingRows.map((s) => [s.key, s.value]));

  return { projects, apps, settings, generatedAt: new Date().toISOString() };
}

