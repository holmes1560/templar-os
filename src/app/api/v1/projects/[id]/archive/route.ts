import { db } from "@/lib/db";
import { authenticateRequest, authorizeScope } from "@/server/api-auth";
import { recordRevision } from "@/server/revisions";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(req);
  const authError = authorizeScope(auth, "projects:update");
  if (authError) return authError;

  const { id } = await params;
  const existing = await db.project.findFirst({
    where: { OR: [{ id }, { slug: id }] },
  });

  if (!existing) {
    return Response.json({ ok: false, error: "Project not found" }, { status: 404 });
  }

  const updated = await db.project.update({
    where: { id: existing.id },
    data: { status: "ARCHIVED" },
  });

  await recordRevision({
    entityType: "project",
    entityId: existing.id,
    changeType: "ARCHIVE",
    summary: `Archived project ${updated.name}`,
    previousValue: { status: existing.status },
    newValue: { status: updated.status },
    apiKeyId: auth.apiKey?.id,
    isAiGenerated: !auth.isSessionAdmin,
  });

  return Response.json({ ok: true, data: updated });
}
