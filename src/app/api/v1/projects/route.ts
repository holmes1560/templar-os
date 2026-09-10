import { db } from "@/lib/db";
import { authenticateRequest, authorizeScope, hasScope } from "@/server/api-auth";
import { recordRevision } from "@/server/revisions";
import { ProjectStatus, RepoVisibility, Category } from "@prisma/client";
import { z } from "zod";

export const dynamic = "force-dynamic";

const CreateProjectSchema = z.object({
  name: z.string().trim().min(1).max(200),
  slug: z.string().trim().min(1).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  shortDescription: z.string().trim().min(1).max(400),
  longDescription: z.string().trim().min(1).max(8000),
  category: z.enum(["WEB", "MOBILE", "CYBERSECURITY", "AI", "HARDWARE", "EXPERIMENTS"]),
  period: z.string().trim().max(100).optional().default(""),
  team: z.string().trim().max(200).optional().default(""),
  githubUrl: z.string().trim().url().or(z.literal("")).optional(),
  liveUrl: z.string().trim().url().or(z.literal("")).optional(),
  docsUrl: z.string().trim().url().or(z.literal("")).optional(),
  repoVisibility: z.enum(["PUBLIC", "PRIVATE", "LOCAL"]).default("LOCAL"),
  hosted: z.boolean().default(false),
  featured: z.boolean().default(false),
  clientWork: z.boolean().default(false),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  caveat: z.string().trim().optional(),
  technologies: z.array(z.string()).default([]),
  features: z.array(z.string()).default([]),
  challenges: z.array(z.string()).default([]),
  learned: z.array(z.string()).default([]),
  skills: z.array(z.string()).default([]),
  // Engineering experience fields
  role: z.string().trim().optional(),
  architecture: z.string().trim().optional(),
  failedApproaches: z.array(z.string()).default([]),
  problemSolutions: z.array(z.string()).default([]),
  outcome: z.string().trim().optional(),
  order: z.number().int().default(0),
  visible: z.boolean().default(true),
  isAiGenerated: z.boolean().default(false),
  aiOrigin: z.string().optional(),
});

export async function GET(req: Request) {
  const auth = await authenticateRequest(req);
  const authError = authorizeScope(auth, "projects:read");
  if (authError) return authError;

  const url = new URL(req.url);
  const statusParam = url.searchParams.get("status")?.toUpperCase();
  const categoryParam = url.searchParams.get("category")?.toUpperCase();
  const featuredParam = url.searchParams.get("featured");

  const where: any = {};
  if (statusParam && ["DRAFT", "PUBLISHED", "ARCHIVED"].includes(statusParam)) {
    where.status = statusParam as ProjectStatus;
  }
  if (categoryParam && ["WEB", "MOBILE", "CYBERSECURITY", "AI", "HARDWARE", "EXPERIMENTS"].includes(categoryParam)) {
    where.category = categoryParam as Category;
  }
  if (featuredParam !== null && featuredParam !== undefined) {
    where.featured = featuredParam === "true";
  }

  const projects = await db.project.findMany({
    where,
    include: {
      technologies: { include: { technology: true }, orderBy: { order: "asc" } },
      applications: true,
      assets: true,
    },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });

  return Response.json({ ok: true, data: projects });
}

export async function POST(req: Request) {
  const auth = await authenticateRequest(req);

  // Can create project either if key has 'projects:create' or 'drafts:create'
  const canCreateDirectly = hasScope(auth.scopes, "projects:create");
  const canCreateDraft = hasScope(auth.scopes, "drafts:create");

  if (!canCreateDirectly && !canCreateDraft) {
    return Response.json(
      { ok: false, error: "Forbidden: requires 'projects:create' or 'drafts:create' permission." },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = CreateProjectSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Validation failed", details: parsed.error.format() },
      { status: 400 }
    );
  }

  const input = parsed.data;

  // Enforce publisher scope: cannot directly publish without 'projects:publish'
  let targetStatus = input.status;
  if (targetStatus === "PUBLISHED" && !hasScope(auth.scopes, "projects:publish")) {
    targetStatus = "DRAFT";
  }

  // Check duplicate slug
  const existing = await db.project.findUnique({ where: { slug: input.slug } });
  if (existing) {
    return Response.json(
      {
        ok: false,
        error: `Project with slug '${input.slug}' already exists. Use PUT /api/v1/projects/${existing.id} to update it.`,
        existingProjectId: existing.id,
      },
      { status: 409 }
    );
  }

  // If client requested draft only or cannot create directly, save as a Draft in the review queue
  if (!canCreateDirectly && canCreateDraft) {
    const draft = await db.draft.create({
      data: {
        entityType: "project",
        action: "CREATE",
        title: input.name,
        summary: input.shortDescription,
        data: input,
        status: "PENDING",
        isAiGenerated: input.isAiGenerated || !auth.isSessionAdmin,
        aiOrigin: input.aiOrigin || (auth.apiKey ? `API Key: ${auth.apiKey.name}` : undefined),
        createdByApiKeyId: auth.apiKey?.id,
      },
    });
    return Response.json(
      {
        ok: true,
        isDraft: true,
        message: "Project submitted to Review Queue as a draft.",
        data: draft,
      },
      { status: 202 }
    );
  }

  // Create project in database
  const project = await db.project.create({
    data: {
      name: input.name,
      slug: input.slug,
      shortDescription: input.shortDescription,
      longDescription: input.longDescription,
      category: input.category as Category,
      period: input.period,
      team: input.team,
      githubUrl: input.githubUrl || null,
      liveUrl: input.liveUrl || null,
      docsUrl: input.docsUrl || null,
      repoVisibility: input.repoVisibility as RepoVisibility,
      hosted: input.hosted,
      featured: input.featured,
      clientWork: input.clientWork,
      status: targetStatus as ProjectStatus,
      caveat: input.caveat || null,
      features: input.features,
      challenges: input.challenges,
      learned: input.learned,
      skills: input.skills,
      role: input.role,
      architecture: input.architecture,
      failedApproaches: input.failedApproaches,
      problemSolutions: input.problemSolutions,
      outcome: input.outcome,
      order: input.order,
      visible: input.visible,
      isAiGenerated: input.isAiGenerated || !auth.isSessionAdmin,
      aiOrigin: input.aiOrigin || (auth.apiKey ? `API Key: ${auth.apiKey.name}` : undefined),
    },
  });

  // Link technologies
  if (input.technologies.length > 0) {
    for (const [order, techName] of input.technologies.entries()) {
      const tech = await db.technology.upsert({
        where: { name: techName },
        update: {},
        create: {
          name: techName,
          slug: techName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        },
      });
      await db.projectTechnology.create({
        data: { projectId: project.id, technologyId: tech.id, order },
      });
    }
  }

  await recordRevision({
    entityType: "project",
    entityId: project.id,
    changeType: "CREATE",
    summary: `Created project ${project.name} (${project.status})`,
    newValue: project,
    apiKeyId: auth.apiKey?.id,
    isAiGenerated: project.isAiGenerated,
  });

  return Response.json({ ok: true, data: project }, { status: 201 });
}
