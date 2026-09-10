import { db } from "@/lib/db";
import { authenticateRequest, authorizeScope } from "@/server/api-auth";
import { recordRevision } from "@/server/revisions";
import { z } from "zod";

export const dynamic = "force-dynamic";

const ProfileUpdateSchema = z.object({
  fullName: z.string().trim().min(1).optional(),
  shortName: z.string().trim().min(1).optional(),
  title: z.string().trim().min(1).optional(),
  tagline: z.string().trim().min(1).optional(),
  bio: z.string().trim().optional(),
  aboutMe: z.string().trim().optional(),
  location: z.string().trim().optional(),
  availabilityStatus: z.string().trim().optional(),
  careerInterests: z.array(z.string()).optional(),
  whatImDrawnTo: z.array(z.string()).optional(),
  howIWorkWithAi: z.string().trim().optional(),
  avatarUrl: z.string().trim().url().or(z.literal("")).optional(),
  email: z.string().trim().email().or(z.literal("")).optional(),
  phone: z.string().trim().optional(),
  websiteUrl: z.string().trim().optional(),
  githubUrl: z.string().trim().optional(),
  linkedinUrl: z.string().trim().optional(),
  twitterUrl: z.string().trim().optional(),
});

export async function GET(req: Request) {
  const auth = await authenticateRequest(req);
  const authError = authorizeScope(auth, "profile:read");
  if (authError) return authError;

  const profile = await db.profile.findFirst();
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
  const authError = authorizeScope(auth, "profile:write");
  if (authError) return authError;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = ProfileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Validation failed", details: parsed.error.format() },
      { status: 400 }
    );
  }

  const existing = await db.profile.findFirst();
  let updated;

  if (existing) {
    updated = await db.profile.update({
      where: { id: existing.id },
      data: parsed.data,
    });
    await recordRevision({
      entityType: "profile",
      entityId: existing.id,
      changeType: "UPDATE",
      summary: "Updated Profile details",
      previousValue: existing,
      newValue: updated,
      apiKeyId: auth.apiKey?.id,
      isAiGenerated: !auth.isSessionAdmin,
    });
  } else {
    updated = await db.profile.create({
      data: {
        fullName: parsed.data.fullName || "Asenso",
        shortName: parsed.data.shortName || "Asenso",
        title: parsed.data.title || "Software Engineer",
        tagline: parsed.data.tagline || "",
        bio: parsed.data.bio || "",
        aboutMe: parsed.data.aboutMe || "",
        location: parsed.data.location || "",
        ...parsed.data,
      },
    });
    await recordRevision({
      entityType: "profile",
      entityId: updated.id,
      changeType: "CREATE",
      summary: "Created initial Profile",
      newValue: updated,
      apiKeyId: auth.apiKey?.id,
      isAiGenerated: !auth.isSessionAdmin,
    });
  }

  return Response.json({ ok: true, data: updated });
}
