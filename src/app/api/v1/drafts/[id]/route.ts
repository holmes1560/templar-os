import { db } from "@/lib/db";
import { authenticateRequest, authorizeScope } from "@/server/api-auth";
import { recordRevision } from "@/server/revisions";
import { z } from "zod";

export const dynamic = "force-dynamic";

const UpdateDraftSchema = z.object({
  title: z.string().trim().min(1).optional(),
  summary: z.string().trim().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
  reviewNotes: z.string().trim().optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(req);
  const authError = authorizeScope(auth, "drafts:read");
  if (authError) return authError;

  const { id } = await params;
  const draft = await db.draft.findUnique({
    where: { id },
    include: {
      apiKey: { select: { id: true, name: true, keyPrefix: true } },
    },
  });

  if (!draft) {
    return Response.json({ ok: false, error: "Draft not found" }, { status: 404 });
  }

  return Response.json({ ok: true, data: draft });
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
  const authError = authorizeScope(auth, "drafts:update");
  if (authError) return authError;

  const { id } = await params;
  const existing = await db.draft.findUnique({ where: { id } });
  if (!existing) {
    return Response.json({ ok: false, error: "Draft not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = UpdateDraftSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Validation failed", details: parsed.error.format() },
      { status: 400 }
    );
  }

  const updated = await db.draft.update({
    where: { id },
    data: {
      ...parsed.data,
      data: parsed.data.data ? (parsed.data.data as any) : undefined,
    },
  });

  await recordRevision({
    entityType: "draft",
    entityId: id,
    changeType: "UPDATE",
    summary: `Updated draft ${updated.title}`,
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
  const authError = authorizeScope(auth, "drafts:update");
  if (authError) return authError;

  const { id } = await params;
  const existing = await db.draft.findUnique({ where: { id } });
  if (!existing) {
    return Response.json({ ok: false, error: "Draft not found" }, { status: 404 });
  }

  await db.draft.delete({ where: { id } });

  await recordRevision({
    entityType: "draft",
    entityId: id,
    changeType: "DELETE",
    summary: `Deleted draft ${existing.title}`,
    previousValue: existing,
    apiKeyId: auth.apiKey?.id,
    isAiGenerated: !auth.isSessionAdmin,
  });

  return Response.json({ ok: true, deleted: true });
}
