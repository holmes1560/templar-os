import { db } from "@/lib/db";
import { authenticateRequest, authorizeScope } from "@/server/api-auth";
import { recordRevision } from "@/server/revisions";
import { z } from "zod";

export const dynamic = "force-dynamic";

const CreateSkillSchema = z.object({
  categoryId: z.string().trim().min(1),
  name: z.string().trim().min(1),
  description: z.string().trim().optional(),
  proficiency: z.number().int().min(0).max(100).optional(),
  technologies: z.array(z.string()).default([]),
  order: z.number().int().optional().default(0),
  featured: z.boolean().optional().default(false),
  visible: z.boolean().optional().default(true),
});

export async function GET(req: Request) {
  const auth = await authenticateRequest(req);
  const authError = authorizeScope(auth, "skills:read");
  if (authError) return authError;

  const url = new URL(req.url);
  const categorySlug = url.searchParams.get("category");
  const featuredOnly = url.searchParams.get("featured") === "true";

  const categories = await db.skillCategory.findMany({
    where: categorySlug ? { slug: categorySlug } : undefined,
    include: {
      skills: {
        where: featuredOnly ? { featured: true } : undefined,
        orderBy: { order: "asc" },
      },
    },
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

  const parsed = CreateSkillSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Validation failed", details: parsed.error.format() },
      { status: 400 }
    );
  }

  const skill = await db.skill.create({
    data: parsed.data,
  });

  await recordRevision({
    entityType: "skill",
    entityId: skill.id,
    changeType: "CREATE",
    summary: `Created skill ${skill.name}`,
    newValue: skill,
    apiKeyId: auth.apiKey?.id,
    isAiGenerated: !auth.isSessionAdmin,
  });

  return Response.json({ ok: true, data: skill }, { status: 201 });
}
