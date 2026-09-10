import { db } from "@/lib/db";
import { authenticateRequest, authorizeScope } from "@/server/api-auth";
import { recordRevision } from "@/server/revisions";
import { z } from "zod";

export const dynamic = "force-dynamic";

const UpdateCertificationSchema = z.object({
  name: z.string().trim().min(1).optional(),
  issuer: z.string().trim().min(1).optional(),
  issueDate: z.string().trim().nullable().optional(),
  expiryDate: z.string().trim().nullable().optional(),
  credentialUrl: z.string().trim().url().or(z.literal("")).nullable().optional(),
  credentialId: z.string().trim().nullable().optional(),
  description: z.string().trim().nullable().optional(),
  order: z.number().int().optional(),
  visible: z.boolean().optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(req);
  const authError = authorizeScope(auth, "certifications:read");
  if (authError) return authError;

  const { id } = await params;
  const item = await db.certification.findUnique({ where: { id } });
  if (!item) {
    return Response.json({ ok: false, error: "Certification not found" }, { status: 404 });
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
  const authError = authorizeScope(auth, "certifications:write");
  if (authError) return authError;

  const { id } = await params;
  const existing = await db.certification.findUnique({ where: { id } });
  if (!existing) {
    return Response.json({ ok: false, error: "Certification not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = UpdateCertificationSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Validation failed", details: parsed.error.format() },
      { status: 400 }
    );
  }

  const updated = await db.certification.update({
    where: { id },
    data: parsed.data,
  });

  await recordRevision({
    entityType: "certification",
    entityId: id,
    changeType: "UPDATE",
    summary: `Updated certification: ${updated.name}`,
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
  const authError = authorizeScope(auth, "certifications:write");
  if (authError) return authError;

  const { id } = await params;
  const existing = await db.certification.findUnique({ where: { id } });
  if (!existing) {
    return Response.json({ ok: false, error: "Certification not found" }, { status: 404 });
  }

  await db.certification.delete({ where: { id } });

  await recordRevision({
    entityType: "certification",
    entityId: id,
    changeType: "DELETE",
    summary: `Deleted certification: ${existing.name}`,
    previousValue: existing,
    apiKeyId: auth.apiKey?.id,
    isAiGenerated: !auth.isSessionAdmin,
  });

  return Response.json({ ok: true, deleted: true });
}
