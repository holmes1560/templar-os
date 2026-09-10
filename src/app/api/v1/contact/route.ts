import { db } from "@/lib/db";
import { authenticateRequest, authorizeScope } from "@/server/api-auth";
import { recordRevision } from "@/server/revisions";
import { z } from "zod";

export const dynamic = "force-dynamic";

const UpdateContactSchema = z.object({
  email: z.string().trim().email().or(z.literal("")).optional(),
  phone: z.string().trim().optional(),
  location: z.string().trim().optional(),
  contactNote: z.string().trim().optional(),
});

export async function GET(req: Request) {
  const auth = await authenticateRequest(req);
  const authError = authorizeScope(auth, "contact:read");
  if (authError) return authError;

  const profile = await db.profile.findFirst({
    select: {
      email: true,
      phone: true,
      location: true,
    },
  });

  const contactNote = await db.setting.findUnique({ where: { key: "contact.note" } });
  const socials = await db.socialLink.findMany({
    where: { visible: true },
    orderBy: { order: "asc" },
  });

  return Response.json({
    ok: true,
    data: {
      email: profile?.email ?? "",
      phone: profile?.phone ?? "",
      location: profile?.location ?? "",
      contactNote: contactNote?.value ?? "",
      socials,
    },
  });
}

export async function PUT(req: Request) {
  return handleUpdate(req);
}

export async function PATCH(req: Request) {
  return handleUpdate(req);
}

async function handleUpdate(req: Request) {
  const auth = await authenticateRequest(req);
  const authError = authorizeScope(auth, "contact:write");
  if (authError) return authError;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = UpdateContactSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Validation failed", details: parsed.error.format() },
      { status: 400 }
    );
  }

  const profile = await db.profile.findFirst();
  if (profile) {
    const updatePayload: any = {};
    if (parsed.data.email !== undefined) updatePayload.email = parsed.data.email;
    if (parsed.data.phone !== undefined) updatePayload.phone = parsed.data.phone;
    if (parsed.data.location !== undefined) updatePayload.location = parsed.data.location;

    await db.profile.update({
      where: { id: profile.id },
      data: updatePayload,
    });
  }

  if (parsed.data.email) {
    await db.setting.upsert({
      where: { key: "site.email" },
      update: { value: parsed.data.email },
      create: { key: "site.email", value: parsed.data.email },
    });
  }
  if (parsed.data.contactNote !== undefined) {
    await db.setting.upsert({
      where: { key: "contact.note" },
      update: { value: parsed.data.contactNote },
      create: { key: "contact.note", value: parsed.data.contactNote },
    });
  }

  await recordRevision({
    entityType: "contact",
    entityId: "primary",
    changeType: "UPDATE",
    summary: "Updated contact details",
    newValue: parsed.data,
    apiKeyId: auth.apiKey?.id,
    isAiGenerated: !auth.isSessionAdmin,
  });

  return Response.json({ ok: true, data: parsed.data });
}
