import { db } from "@/lib/db";
import { authenticateRequest, authorizeScope } from "@/server/api-auth";
import { recordRevision } from "@/server/revisions";
import { z } from "zod";

export const dynamic = "force-dynamic";

const UpdateSkillSchema = z.object({
  categoryId: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1).optional(),
  description: z.string().trim().optional(),
  proficiency: z.number().int().min(0).max(100).optional(),
  technologies: z.array(z.string()).optional(),
  order: z.number().int().optional(),
  featured: z.boolean().optional(),
  visible: z.boolean().optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(req);
  const authError = authorizeScope(auth, "skills:read");
  if (authError) return authError;

  const { id } = await params;
  const skill = await db.skill.findUnique({
    where: { id },
    include: { category: true },
  });

  if (!skill) {
    return Response.json({ ok: false, error: "Skill not found" }, { status: 404 });
  }

  return Response.json({ ok: true, data: skill });
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
  const authError = authorizeScope(auth, "skills:write");
  if (authError) return authError;

  const { id } = await params;
  const existing = await db.skill.findUnique({ where: { id } });
  if (!existing) {
    return Response.json({ ok: false, error: "Skill not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = UpdateSkillSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Validation failed", details: parsed.error.format() },
      { status: 400 }
    );
  }

  const updated = await db.skill.update({
    where: { id },
    data: parsed.data,
  });

  await recordRevision({
    entityType: "skill",
    entityId: id,
    changeType: "UPDATE",
    summary: `Updated skill ${updated.name}`,
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
  const authError = authorizeScope(auth, "skills:write");
  if (authError) return authError;

  const { id } = await params;
  const existing = await db.skill.findUnique({ where: { id } });
  if (!existing) {
    return Response.json({ ok: false, error: "Skill not found" }, { status: 404 });
  }

  await db.skill.delete({ where: { id } });

  await recordRevision({
    entityType: "skill",
    entityId: id,
    changeType: "DELETE",
    summary: `Deleted skill ${existing.name}`,
    previousValue: existing,
    apiKeyId: auth.apiKey?.id,
    isAiGenerated: !auth.isSessionAdmin,
  });

  return Response.json({ ok: true, deleted: true });
}
