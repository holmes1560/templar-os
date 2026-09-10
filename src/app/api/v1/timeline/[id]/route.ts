import { db } from "@/lib/db";
import { authenticateRequest, authorizeScope } from "@/server/api-auth";
import { recordRevision } from "@/server/revisions";
import { TimelineType } from "@prisma/client";
import { z } from "zod";

export const dynamic = "force-dynamic";

const UpdateTimelineSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  type: z.enum([
    "UNIVERSITY",
    "INTERNSHIP",
    "EMPLOYMENT",
    "PROJECT",
    "CERTIFICATION",
    "MILESTONE",
    "LEARNING",
  ]).optional(),
  organization: z.string().trim().nullable().optional(),
  startDate: z.string().trim().min(1).optional(),
  endDate: z.string().trim().nullable().optional(),
  isCurrent: z.boolean().optional(),
  shortDescription: z.string().trim().min(1).max(500).optional(),
  detailedDescription: z.string().trim().max(4000).nullable().optional(),
  technologies: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  relatedProjectIds: z.array(z.string()).optional(),
  icon: z.string().trim().optional(),
  color: z.string().trim().nullable().optional(),
  order: z.number().int().optional(),
  visible: z.boolean().optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(req);
  const authError = authorizeScope(auth, "timeline:read");
  if (authError) return authError;

  const { id } = await params;
  const entry = await db.timelineEntry.findUnique({ where: { id } });
  if (!entry) {
    return Response.json({ ok: false, error: "Timeline entry not found" }, { status: 404 });
  }

  return Response.json({ ok: true, data: entry });
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
  const authError = authorizeScope(auth, "timeline:write");
  if (authError) return authError;

  const { id } = await params;
  const existing = await db.timelineEntry.findUnique({ where: { id } });
  if (!existing) {
    return Response.json({ ok: false, error: "Timeline entry not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = UpdateTimelineSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Validation failed", details: parsed.error.format() },
      { status: 400 }
    );
  }

  const updateData: any = { ...parsed.data };
  if (updateData.type) {
    updateData.type = updateData.type as TimelineType;
  }

  const updated = await db.timelineEntry.update({
    where: { id },
    data: updateData,
  });

  await recordRevision({
    entityType: "timeline",
    entityId: id,
    changeType: "UPDATE",
    summary: `Updated timeline entry ${updated.title}`,
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
  const authError = authorizeScope(auth, "timeline:write");
  if (authError) return authError;

  const { id } = await params;
  const existing = await db.timelineEntry.findUnique({ where: { id } });
  if (!existing) {
    return Response.json({ ok: false, error: "Timeline entry not found" }, { status: 404 });
  }

  await db.timelineEntry.delete({ where: { id } });

  await recordRevision({
    entityType: "timeline",
    entityId: id,
    changeType: "DELETE",
    summary: `Deleted timeline entry ${existing.title}`,
    previousValue: existing,
    apiKeyId: auth.apiKey?.id,
    isAiGenerated: !auth.isSessionAdmin,
  });

  return Response.json({ ok: true, deleted: true });
}
