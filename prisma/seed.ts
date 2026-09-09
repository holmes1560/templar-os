/**
 * Migrates the previously-hardcoded portfolio into the database.
 *
 * §23: migrate, don't delete. This reads the existing source-of-truth files
 * (src/lib/projects.ts, src/lib/apps.ts, src/lib/site.ts) and writes their
 * contents into Postgres. Those files stay on disk until the desktop is
 * reading from the database and the migration has been verified.
 *
 * Idempotent: every write is an upsert keyed on slug / appKey / name, so
 * re-running it neither duplicates rows nor clobbers admin edits to columns
 * it doesn't own.
 */
import { PrismaClient, Category, RepoVisibility, ProjectStatus, LaunchMode } from "@prisma/client";
import { projects } from "../src/lib/projects";
import { APPS } from "../src/lib/apps";
import { site } from "../src/lib/site";
import type { Project as SrcProject } from "../src/lib/types";

const db = new PrismaClient();

const CATEGORY: Record<SrcProject["category"], Category> = {
  web: Category.WEB,
  mobile: Category.MOBILE,
  cybersecurity: Category.CYBERSECURITY,
  ai: Category.AI,
  hardware: Category.HARDWARE,
  experiments: Category.EXPERIMENTS,
};

const VISIBILITY: Record<SrcProject["visibility"], RepoVisibility> = {
  public: RepoVisibility.PUBLIC,
  private: RepoVisibility.PRIVATE,
  local: RepoVisibility.LOCAL,
};

const slugify = (s: string) =>
  s.toLowerCase().trim()
    .replace(/[+]/g, "-plus")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** owner/repo out of a github URL, without trusting the string blindly */
function parseRepo(url?: string) {
  if (!url) return { owner: null, repo: null };
  try {
    const u = new URL(url);
    if (u.hostname !== "github.com") return { owner: null, repo: null };
    const [owner, repo] = u.pathname.replace(/^\/|\.git$/g, "").split("/");
    return { owner: owner ?? null, repo: repo ?? null };
  } catch {
    return { owner: null, repo: null };
  }
}

async function main() {
  console.log("→ migrating hardcoded portfolio into the database\n");

  /* ── settings ─────────────────────────────────────────────── */
  const settings: Record<string, string> = {
    "site.name": site.name,
    "site.shortName": site.shortName,
    "site.system": site.system,
    "site.systemVersion": site.systemVersion,
    "site.role": site.role,
    "site.tagline": site.tagline,
    "site.location": site.location,
    "site.github": site.github,
    "site.githubUser": site.githubUser,
    "site.email": site.email,
    "site.linkedin": site.linkedin,
    "site.resumePath": site.resumePath,
  };
  for (const [key, value] of Object.entries(settings)) {
    await db.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
  }
  console.log(`  settings      ${Object.keys(settings).length}`);

  /* ── technologies ─────────────────────────────────────────── */
  const techNames = [...new Set(projects.flatMap((p) => p.technologies))].sort();
  for (const name of techNames) {
    await db.technology.upsert({
      where: { name },
      update: {},
      create: { name, slug: slugify(name) },
    });
  }
  console.log(`  technologies  ${techNames.length}`);

  /* ── projects ─────────────────────────────────────────────── */
  for (const p of projects) {
    const { owner, repo } = parseRepo(p.githubUrl);

    const data = {
      name: p.title,
      shortDescription: p.summary,
      longDescription: p.description,
      category: CATEGORY[p.category],
      period: p.period,
      team: p.team ?? null,
      githubUrl: p.githubUrl ?? null,
      repositoryOwner: owner,
      repositoryName: repo,
      repoVisibility: VISIBILITY[p.visibility],
      hosted: Boolean(p.demoUrl),
      liveUrl: p.demoUrl ?? null,
      docsUrl: p.docsUrl ?? null,
      featured: p.featured,
      // everything migrated is real, reviewed work — publish it
      status: ProjectStatus.PUBLISHED,
      clientWork: p.clientWork ?? false,
      caveat: p.caveat ?? null,
      features: p.features,
      challenges: p.challenges,
      learned: p.learned,
      skills: p.skills,
    };

    const saved = await db.project.upsert({
      where: { slug: p.slug },
      update: data,
      create: { slug: p.slug, ...data },
    });

    // technology links, ordered as authored
    await db.projectTechnology.deleteMany({ where: { projectId: saved.id } });
    for (const [order, techName] of p.technologies.entries()) {
      const tech = await db.technology.findUnique({ where: { name: techName } });
      if (!tech) continue;
      await db.projectTechnology.create({
        data: { projectId: saved.id, technologyId: tech.id, order },
      });
    }

    // an embeddable deployment becomes a launchable application
    if (p.demoUrl) {
      const appKey = `live-${p.slug}`;
      const appData = {
        projectId: saved.id,
        name: p.title,
        icon: "globe",
        launchMode: p.embeddable ? LaunchMode.IFRAME : LaunchMode.EXTERNAL,
        url: p.demoUrl,
        enabled: true,
        desktopVisible: false, // reachable from Projects; admin can surface it
        workspace: 1,
        windowWidth: 1024,
        windowHeight: 680,
      };
      await db.application.upsert({
        where: { appKey },
        update: appData,
        create: { appKey, ...appData },
      });
    }
  }
  console.log(`  projects      ${projects.length}`);

  /* ── applications (the OS's own apps) ─────────────────────── */
  for (const [i, a] of APPS.entries()) {
    const launchMode = a.externalUrl
      ? LaunchMode.EXTERNAL
      : LaunchMode.INTERNAL;

    const appData = {
      name: a.title,
      icon: a.icon,
      launchMode,
      url: a.externalUrl ?? null,
      enabled: true,
      desktopVisible: true,
      workspace: a.workspace,
      // preserve current reading-order placement within each workspace
      cell: APPS.filter((x) => x.workspace === a.workspace).findIndex((x) => x.id === a.id),
      windowWidth: a.size.w || 760,
      windowHeight: a.size.h || 520,
    };

    await db.application.upsert({
      where: { appKey: a.id },
      update: appData,
      create: { appKey: a.id, ...appData },
    });
    void i;
  }
  console.log(`  applications  ${APPS.length}`);

  /* ── admin user ───────────────────────────────────────────── */
  // Never invent credentials. Only seeded when both are supplied.
  // Credentials are never invented here. The admin user is created by the
  // auth setup script, which owns the password hashing, so this migration
  // can't leave a guessable account behind if it's run somewhere public.
  const adminCount = await db.adminUser.count();
  console.log(`  admin users   ${adminCount} (created via the auth setup step)`);

  console.log("\n✓ migration complete");
}

main()
  .catch((e) => {
    console.error("✗ seed failed:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
