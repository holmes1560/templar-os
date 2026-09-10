import { db } from "@/lib/db";
import { authenticateRequest, authorizeScope } from "@/server/api-auth";
import { recordRevision } from "@/server/revisions";
import { z } from "zod";

export const dynamic = "force-dynamic";

const CreateExperienceSchema = z.object({
  organization: z.string().trim().min(1),
  role: z.string().trim().min(1),
  employmentType: z.string().trim().optional(),
  location: z.string().trim().optional(),
  startDate: z.string().trim().min(1),
  endDate: z.string().trim().optional(),
  isCurrent: z.boolean().default(false),
  description: z.string().trim().min(1),
  responsibilities: z.array(z.string()).default([]),
  achievements: z.array(z.string()).default([]),
  technologies: z.array(z.string()).default([]),
  order: z.number().int().default(0),
  visible: z.boolean().default(true),
});

export async function GET(req: Request) {
  const auth = await authenticateRequest(req);
  const authError = authorizeScope(auth, "experience:read");
  if (authError) return authError;

  const items = await db.experience.findMany({
    orderBy: { order: "asc" },
  });

  return Response.json({ ok: true, data: items });
}

export async function POST(req: Request) {
  const auth = await authenticateRequest(req);
  const authError = authorizeScope(auth, "experience:write");
  if (authError) return authError;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = CreateExperienceSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Validation failed", details: parsed.error.format() },
      { status: 400 }
    );
  }

  const item = await db.experience.create({ data: parsed.data });

  await recordRevision({
    entityType: "experience",
    entityId: item.id,
    changeType: "CREATE",
    summary: `Created experience: ${item.role} at ${item.organization}`,
    newValue: item,
    apiKeyId: auth.apiKey?.id,
    isAiGenerated: !auth.isSessionAdmin,
  });

  return Response.json({ ok: true, data: item }, { status: 201 });
}
