import { db } from "@/lib/db";
import { authenticateRequest, authorizeScope } from "@/server/api-auth";
import { recordRevision } from "@/server/revisions";
import { z } from "zod";

export const dynamic = "force-dynamic";

const CreateResumeSchema = z.object({
  version: z.string().trim().min(1),
  fileName: z.string().trim().min(1),
  filePath: z.string().trim().min(1),
  fileSize: z.number().int().optional(),
  mimeType: z.string().trim().default("application/pdf"),
  isActive: z.boolean().default(true),
});

export async function GET(req: Request) {
  const auth = await authenticateRequest(req);
  const authError = authorizeScope(auth, "resume:read");
  if (authError) return authError;

  const active = await db.resumeRecord.findFirst({
    where: { isActive: true },
    orderBy: { uploadedAt: "desc" },
  });

  const all = await db.resumeRecord.findMany({
    orderBy: { uploadedAt: "desc" },
  });

  return Response.json({ ok: true, active, history: all });
}

export async function POST(req: Request) {
  const auth = await authenticateRequest(req);
  const authError = authorizeScope(auth, "resume:write");
  if (authError) return authError;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = CreateResumeSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Validation failed", details: parsed.error.format() },
      { status: 400 }
    );
  }

  // If this new resume is active, mark all previous ones inactive
  if (parsed.data.isActive) {
    await db.resumeRecord.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });
    // Also sync to setting
    await db.setting.upsert({
      where: { key: "site.resumePath" },
      update: { value: parsed.data.filePath },
      create: { key: "site.resumePath", value: parsed.data.filePath },
    });
  }

  const resume = await db.resumeRecord.create({
    data: parsed.data,
  });

  await recordRevision({
    entityType: "resume",
    entityId: resume.id,
    changeType: "CREATE",
    summary: `Uploaded resume version ${resume.version} (${resume.fileName})`,
    newValue: resume,
    apiKeyId: auth.apiKey?.id,
    isAiGenerated: !auth.isSessionAdmin,
  });

  return Response.json({ ok: true, data: resume }, { status: 201 });
}
