import { db } from "@/lib/db";
import { authenticateRequest, authorizeScope } from "@/server/api-auth";
import { recordRevision } from "@/server/revisions";
import { z } from "zod";

export const dynamic = "force-dynamic";

const CreateEducationSchema = z.object({
  institution: z.string().trim().min(1),
  degree: z.string().trim().min(1),
  fieldOfStudy: z.string().trim().optional(),
  startDate: z.string().trim().min(1),
  endDate: z.string().trim().optional(),
  isCurrent: z.boolean().default(false),
  description: z.string().trim().optional(),
  achievements: z.array(z.string()).default([]),
  order: z.number().int().default(0),
  visible: z.boolean().default(true),
});

export async function GET(req: Request) {
  const auth = await authenticateRequest(req);
  const authError = authorizeScope(auth, "education:read");
  if (authError) return authError;

  const items = await db.education.findMany({
    orderBy: { order: "asc" },
  });

  return Response.json({ ok: true, data: items });
}

export async function POST(req: Request) {
  const auth = await authenticateRequest(req);
  const authError = authorizeScope(auth, "education:write");
  if (authError) return authError;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = CreateEducationSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Validation failed", details: parsed.error.format() },
      { status: 400 }
    );
  }

  const item = await db.education.create({ data: parsed.data });

  await recordRevision({
    entityType: "education",
    entityId: item.id,
    changeType: "CREATE",
    summary: `Created education: ${item.degree} at ${item.institution}`,
    newValue: item,
    apiKeyId: auth.apiKey?.id,
    isAiGenerated: !auth.isSessionAdmin,
  });

  return Response.json({ ok: true, data: item }, { status: 201 });
}
