import { db } from "@/lib/db";
import { authenticateRequest, authorizeScope } from "@/server/api-auth";
import { recordRevision } from "@/server/revisions";
import { z } from "zod";

export const dynamic = "force-dynamic";

const CreateAchievementSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  date: z.string().trim().optional(),
  organization: z.string().trim().optional(),
  linkUrl: z.string().trim().url().or(z.literal("")).optional(),
  order: z.number().int().default(0),
  visible: z.boolean().default(true),
});

export async function GET(req: Request) {
  const auth = await authenticateRequest(req);
  const authError = authorizeScope(auth, "achievements:read");
  if (authError) return authError;

  const items = await db.achievement.findMany({
    orderBy: { order: "asc" },
  });

  return Response.json({ ok: true, data: items });
}

export async function POST(req: Request) {
  const auth = await authenticateRequest(req);
  const authError = authorizeScope(auth, "achievements:write");
  if (authError) return authError;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = CreateAchievementSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Validation failed", details: parsed.error.format() },
      { status: 400 }
    );
  }

  const item = await db.achievement.create({ data: parsed.data });

  await recordRevision({
    entityType: "achievement",
    entityId: item.id,
    changeType: "CREATE",
    summary: `Created achievement: ${item.title}`,
    newValue: item,
    apiKeyId: auth.apiKey?.id,
    isAiGenerated: !auth.isSessionAdmin,
  });

  return Response.json({ ok: true, data: item }, { status: 201 });
}
