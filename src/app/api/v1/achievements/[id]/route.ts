import { db } from "@/lib/db";
import { authenticateRequest, authorizeScope } from "@/server/api-auth";
import { recordRevision } from "@/server/revisions";
import { z } from "zod";

export const dynamic = "force-dynamic";

const UpdateAchievementSchema = z.object({
  title: z.string().trim().min(1).optional(),
  description: z.string().trim().min(1).optional(),
  date: z.string().trim().nullable().optional(),
  organization: z.string().trim().nullable().optional(),
  linkUrl: z.string().trim().url().or(z.literal("")).nullable().optional(),
  order: z.number().int().optional(),
  visible: z.boolean().optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(req);
  const authError = authorizeScope(auth, "achievements:read");
  if (authError) return authError;

  const { id } = await params;
  const item = await db.achievement.findUnique({ where: { id } });
  if (!item) {
    return Response.json({ ok: false, error: "Achievement not found" }, { status: 404 });
  }

  return Response.json({ ok: true, data: item });
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
  const authError = authorizeScope(auth, "achievements:write");
  if (authError) return authError;

  const { id } = await params;
  const existing = await db.achievement.findUnique({ where: { id } });
  if (!existing) {
    return Response.json({ ok: false, error: "Achievement not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = UpdateAchievementSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Validation failed", details: parsed.error.format() },
      { status: 400 }
    );
  }

  const updated = await db.achievement.update({
    where: { id },
    data: parsed.data,
  });

  await recordRevision({
    entityType: "achievement",
    entityId: id,
    changeType: "UPDATE",
    summary: `Updated achievement: ${updated.title}`,
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
  const authError = authorizeScope(auth, "achievements:write");
  if (authError) return authError;

  const { id } = await params;
  const existing = await db.achievement.findUnique({ where: { id } });
  if (!existing) {
    return Response.json({ ok: false, error: "Achievement not found" }, { status: 404 });
  }

  await db.achievement.delete({ where: { id } });

  await recordRevision({
    entityType: "achievement",
    entityId: id,
    changeType: "DELETE",
    summary: `Deleted achievement: ${existing.title}`,
    previousValue: existing,
    apiKeyId: auth.apiKey?.id,
    isAiGenerated: !auth.isSessionAdmin,
  });

  return Response.json({ ok: true, deleted: true });
}
