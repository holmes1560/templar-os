import { db } from "@/lib/db";
import { authenticateRequest, authorizeScope, hasScope } from "@/server/api-auth";
import { recordRevision } from "@/server/revisions";
import { ProjectStatus, RepoVisibility, Category } from "@prisma/client";
import { z } from "zod";

export const dynamic = "force-dynamic";

const UpdateProjectSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  slug: z.string().trim().min(1).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  shortDescription: z.string().trim().min(1).max(400).optional(),
  longDescription: z.string().trim().min(1).max(8000).optional(),
  category: z.enum(["WEB", "MOBILE", "CYBERSECURITY", "AI", "HARDWARE", "EXPERIMENTS"]).optional(),
  period: z.string().trim().max(100).optional(),
  team: z.string().trim().max(200).optional(),
  githubUrl: z.string().trim().url().or(z.literal("")).nullable().optional(),
  liveUrl: z.string().trim().url().or(z.literal("")).nullable().optional(),
  docsUrl: z.string().trim().url().or(z.literal("")).nullable().optional(),
  repoVisibility: z.enum(["PUBLIC", "PRIVATE", "LOCAL"]).optional(),
  hosted: z.boolean().optional(),
  featured: z.boolean().optional(),
  clientWork: z.boolean().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  caveat: z.string().trim().nullable().optional(),
  technologies: z.array(z.string()).optional(),
  features: z.array(z.string()).optional(),
  challenges: z.array(z.string()).optional(),
  learned: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  role: z.string().trim().nullable().optional(),
  architecture: z.string().trim().nullable().optional(),
  failedApproaches: z.array(z.string()).optional(),
  problemSolutions: z.array(z.string()).optional(),
  outcome: z.string().trim().nullable().optional(),
  order: z.number().int().optional(),
  visible: z.boolean().optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(req);
  const authError = authorizeScope(auth, "projects:read");
  if (authError) return authError;

  const { id } = await params;
  const project = await db.project.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: {
      technologies: { include: { technology: true }, orderBy: { order: "asc" } },
      applications: true,
      assets: true,
    },
  });

  if (!project) {
    return Response.json({ ok: false, error: "Project not found" }, { status: 404 });
  }

  return Response.json({ ok: true, data: project });
}

export async function PUT(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  return handleUpdate(req, props);
}

export async function PATCH(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  return handleUpdate(req, props);
}

async function handleUpdate(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(req);
  const { id } = await params;

  const existing = await db.project.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: { technologies: { include: { technology: true } } },
  });

  if (!existing) {
    return Response.json({ ok: false, error: "Project not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = UpdateProjectSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Validation failed", details: parsed.error.format() },
      { status: 400 }
    );
  }

  const canUpdateDirectly = hasScope(auth.scopes, "projects:update");
  const canCreateDraft = hasScope(auth.scopes, "drafts:create");

  // If cannot update directly, route into draft queue!
  if (!canUpdateDirectly) {
    if (!canCreateDraft) {
      return Response.json(
        { ok: false, error: "Forbidden: requires 'projects:update' or 'drafts:create'." },
        { status: 403 }
      );
    }
    const draft = await db.draft.create({
      data: {
        entityType: "project",
        entityId: existing.id,
        action: "UPDATE",
        title: `Update to ${existing.name}`,
        summary: `Proposed updates to ${existing.name}`,
        data: parsed.data,
        previousData: JSON.parse(JSON.stringify(existing, (_, v) => (typeof v === "bigint" ? v.toString() : v))),
        status: "PENDING",
        isAiGenerated: !auth.isSessionAdmin,
        aiOrigin: auth.apiKey ? `API Key: ${auth.apiKey.name}` : undefined,
        createdByApiKeyId: auth.apiKey?.id,
      },
    });
    return Response.json(
      {
        ok: true,
        isDraft: true,
        message: "Project updates submitted to Review Queue as a draft.",
        data: draft,
      },
      { status: 202 }
    );
  }

  const updateData: any = { ...parsed.data };

  // Status check: publishing requires 'projects:publish'
  if (updateData.status === "PUBLISHED" && existing.status !== "PUBLISHED") {
    if (!hasScope(auth.scopes, "projects:publish")) {
      return Response.json(
        { ok: false, error: "Forbidden: requires 'projects:publish' permission to publish." },
        { status: 403 }
      );
    }
  }

  // Handle technologies update if provided
  if (parsed.data.technologies) {
    delete updateData.technologies;
    await db.projectTechnology.deleteMany({ where: { projectId: existing.id } });
    for (const [order, techName] of parsed.data.technologies.entries()) {
      const tech = await db.technology.upsert({
        where: { name: techName },
        update: {},
        create: {
          name: techName,
          slug: techName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        },
      });
      await db.projectTechnology.create({
        data: { projectId: existing.id, technologyId: tech.id, order },
      });
    }
  }

  const updated = await db.project.update({
    where: { id: existing.id },
    data: updateData,
  });

  await recordRevision({
    entityType: "project",
    entityId: existing.id,
    changeType: "UPDATE",
    summary: `Updated project ${updated.name}`,
    previousValue: existing,
    newValue: updated,
    apiKeyId: auth.apiKey?.id,
    isAiGenerated: !auth.isSessionAdmin,
  });

  return Response.json({ ok: true, data: updated });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(req);
  const authError = authorizeScope(auth, "projects:delete");
  if (authError) return authError;

  const { id } = await params;
  const existing = await db.project.findFirst({
    where: { OR: [{ id }, { slug: id }] },
  });

  if (!existing) {
    return Response.json({ ok: false, error: "Project not found" }, { status: 404 });
  }

  await db.project.delete({ where: { id: existing.id } });

  await recordRevision({
    entityType: "project",
    entityId: existing.id,
    changeType: "DELETE",
    summary: `Deleted project ${existing.name}`,
    previousValue: existing,
    apiKeyId: auth.apiKey?.id,
    isAiGenerated: !auth.isSessionAdmin,
  });

  return Response.json({ ok: true, deleted: true });
}
