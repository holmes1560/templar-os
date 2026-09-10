import { db } from "@/lib/db";
import { authenticateRequest, authorizeScope } from "@/server/api-auth";
import { recordRevision } from "@/server/revisions";
import { z } from "zod";

export const dynamic = "force-dynamic";

const UpdateSocialSchema = z.object({
  platform: z.string().trim().min(1).optional(),
  label: z.string().trim().min(1).optional(),
  url: z.string().trim().min(1).optional(),
  username: z.string().trim().nullable().optional(),
  icon: z.string().trim().optional(),
  order: z.number().int().optional(),
  visible: z.boolean().optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(req);
  const authError = authorizeScope(auth, "socials:read");
  if (authError) return authError;

  const { id } = await params;
  const link = await db.socialLink.findUnique({ where: { id } });
  if (!link) {
    return Response.json({ ok: false, error: "Social link not found" }, { status: 404 });
  }

  return Response.json({ ok: true, data: link });
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
  const authError = authorizeScope(auth, "socials:write");
  if (authError) return authError;

  const { id } = await params;
  const existing = await db.socialLink.findUnique({ where: { id } });
  if (!existing) {
    return Response.json({ ok: false, error: "Social link not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = UpdateSocialSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Validation failed", details: parsed.error.format() },
      { status: 400 }
    );
  }

  const updated = await db.socialLink.update({
    where: { id },
    data: parsed.data,
  });

  await recordRevision({
    entityType: "social_link",
    entityId: id,
    changeType: "UPDATE",
    summary: `Updated social link: ${updated.platform}`,
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
  const authError = authorizeScope(auth, "socials:write");
  if (authError) return authError;

  const { id } = await params;
  const existing = await db.socialLink.findUnique({ where: { id } });
  if (!existing) {
    return Response.json({ ok: false, error: "Social link not found" }, { status: 404 });
  }

  await db.socialLink.delete({ where: { id } });

  await recordRevision({
    entityType: "social_link",
    entityId: id,
    changeType: "DELETE",
    summary: `Deleted social link: ${existing.platform}`,
    previousValue: existing,
    apiKeyId: auth.apiKey?.id,
    isAiGenerated: !auth.isSessionAdmin,
  });

  return Response.json({ ok: true, deleted: true });
}
