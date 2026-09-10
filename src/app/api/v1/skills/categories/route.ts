import { db } from "@/lib/db";
import { authenticateRequest, authorizeScope } from "@/server/api-auth";
import { recordRevision } from "@/server/revisions";
import { z } from "zod";

export const dynamic = "force-dynamic";

const CreateCategorySchema = z.object({
  name: z.string().trim().min(1),
  slug: z.string().trim().min(1).regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and hyphens only"),
  order: z.number().int().optional().default(0),
});

export async function GET(req: Request) {
  const auth = await authenticateRequest(req);
  const authError = authorizeScope(auth, "skills:read");
  if (authError) return authError;

  const categories = await db.skillCategory.findMany({
    orderBy: { order: "asc" },
  });

  return Response.json({ ok: true, data: categories });
}

export async function POST(req: Request) {
  const auth = await authenticateRequest(req);
  const authError = authorizeScope(auth, "skills:write");
  if (authError) return authError;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = CreateCategorySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Validation failed", details: parsed.error.format() },
      { status: 400 }
    );
  }

  const existing = await db.skillCategory.findUnique({
    where: { slug: parsed.data.slug },
  });
  if (existing) {
    return Response.json({ ok: false, error: "Category slug already exists" }, { status: 409 });
  }

  const category = await db.skillCategory.create({
    data: parsed.data,
  });

  await recordRevision({
    entityType: "skill_category",
    entityId: category.id,
    changeType: "CREATE",
    summary: `Created skill category ${category.name}`,
    newValue: category,
    apiKeyId: auth.apiKey?.id,
    isAiGenerated: !auth.isSessionAdmin,
  });

  return Response.json({ ok: true, data: category }, { status: 201 });
}
