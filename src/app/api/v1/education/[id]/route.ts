import { db } from "@/lib/db";
import { authenticateRequest, authorizeScope } from "@/server/api-auth";
import { recordRevision } from "@/server/revisions";
import { z } from "zod";

export const dynamic = "force-dynamic";

const UpdateEducationSchema = z.object({
  institution: z.string().trim().min(1).optional(),
  degree: z.string().trim().min(1).optional(),
  fieldOfStudy: z.string().trim().nullable().optional(),
  startDate: z.string().trim().min(1).optional(),
  endDate: z.string().trim().nullable().optional(),
  isCurrent: z.boolean().optional(),
  description: z.string().trim().nullable().optional(),
  achievements: z.array(z.string()).optional(),
  order: z.number().int().optional(),
  visible: z.boolean().optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(req);
  const authError = authorizeScope(auth, "education:read");
  if (authError) return authError;

  const { id } = await params;
  const item = await db.education.findUnique({ where: { id } });
  if (!item) {
    return Response.json({ ok: false, error: "Education record not found" }, { status: 404 });
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
  const authError = authorizeScope(auth, "education:write");
  if (authError) return authError;

  const { id } = await params;
  const existing = await db.education.findUnique({ where: { id } });
  if (!existing) {
    return Response.json({ ok: false, error: "Education record not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = UpdateEducationSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Validation failed", details: parsed.error.format() },
      { status: 400 }
    );
  }

  const updated = await db.education.update({
    where: { id },
    data: parsed.data,
  });

  await recordRevision({
    entityType: "education",
    entityId: id,
    changeType: "UPDATE",
    summary: `Updated education: ${updated.degree} at ${updated.institution}`,
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
  const authError = authorizeScope(auth, "education:write");
  if (authError) return authError;

  const { id } = await params;
  const existing = await db.education.findUnique({ where: { id } });
  if (!existing) {
    return Response.json({ ok: false, error: "Education record not found" }, { status: 404 });
  }

  await db.education.delete({ where: { id } });

  await recordRevision({
    entityType: "education",
    entityId: id,
    changeType: "DELETE",
    summary: `Deleted education: ${existing.degree} at ${existing.institution}`,
    previousValue: existing,
    apiKeyId: auth.apiKey?.id,
    isAiGenerated: !auth.isSessionAdmin,
  });

  return Response.json({ ok: true, deleted: true });
}
