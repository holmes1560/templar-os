import { db } from "@/lib/db";
import { authenticateRequest, authorizeScope } from "@/server/api-auth";
import { recordRevision } from "@/server/revisions";
import { z } from "zod";

export const dynamic = "force-dynamic";

const AboutUpdateSchema = z.object({
  bio: z.string().trim().optional(),
  aboutMe: z.string().trim().optional(),
  whatImDrawnTo: z.array(z.string()).optional(),
  howIWorkWithAi: z.string().trim().optional(),
});

export async function GET(req: Request) {
  const auth = await authenticateRequest(req);
  const authError = authorizeScope(auth, "about:read");
  if (authError) return authError;

  const profile = await db.profile.findFirst({
    select: {
      id: true,
      fullName: true,
      title: true,
      bio: true,
      aboutMe: true,
      whatImDrawnTo: true,
      howIWorkWithAi: true,
    },
  });

  return Response.json({ ok: true, data: profile });
}

export async function PUT(req: Request) {
  return handleUpdate(req);
}

export async function PATCH(req: Request) {
  return handleUpdate(req);
}

async function handleUpdate(req: Request) {
  const auth = await authenticateRequest(req);
  const authError = authorizeScope(auth, "about:write");
  if (authError) return authError;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = AboutUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Validation failed", details: parsed.error.format() },
      { status: 400 }
    );
  }

  const profile = await db.profile.findFirst();
  if (!profile) {
    return Response.json({ ok: false, error: "Profile not found" }, { status: 404 });
  }

  const updated = await db.profile.update({
    where: { id: profile.id },
    data: parsed.data,
  });

  await recordRevision({
    entityType: "profile",
    entityId: profile.id,
    changeType: "UPDATE",
    summary: "Updated About Me prose",
    previousValue: {
      bio: profile.bio,
      aboutMe: profile.aboutMe,
      whatImDrawnTo: profile.whatImDrawnTo,
      howIWorkWithAi: profile.howIWorkWithAi,
    },
    newValue: parsed.data,
    apiKeyId: auth.apiKey?.id,
    isAiGenerated: !auth.isSessionAdmin,
  });

  return Response.json({ ok: true, data: updated });
}
