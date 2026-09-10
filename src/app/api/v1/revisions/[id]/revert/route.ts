import { db } from "@/lib/db";
import { authenticateRequest, authorizeScope } from "@/server/api-auth";
import { recordRevision } from "@/server/revisions";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(req);
  const authError = authorizeScope(auth, "revisions:revert");
  if (authError) return authError;

  const { id } = await params;
  const revision = await db.revision.findUnique({ where: { id } });
  if (!revision) {
    return Response.json({ ok: false, error: "Revision not found" }, { status: 404 });
  }

  if (!revision.previousValue || typeof revision.previousValue !== "object") {
    return Response.json(
      { ok: false, error: "This revision does not have a previous snapshot to revert to." },
      { status: 400 }
    );
  }

  const prev = revision.previousValue as Record<string, any>;
  const { id: _, createdAt: __, updatedAt: ___, ...dataToRestore } = prev;

  let restored: any = null;
  try {
    switch (revision.entityType.toLowerCase()) {
      case "project":
        restored = await db.project.update({
          where: { id: revision.entityId },
          data: dataToRestore,
        });
        break;
      case "timeline":
        restored = await db.timelineEntry.update({
          where: { id: revision.entityId },
          data: dataToRestore,
        });
        break;
      case "profile":
        restored = await db.profile.update({
          where: { id: revision.entityId },
          data: dataToRestore,
        });
        break;
      case "skill":
        restored = await db.skill.update({
          where: { id: revision.entityId },
          data: dataToRestore,
        });
        break;
      default:
        return Response.json(
          { ok: false, error: `Revert not supported for entityType '${revision.entityType}'` },
          { status: 400 }
        );
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Revert failed";
    return Response.json({ ok: false, error: msg }, { status: 500 });
  }

  await recordRevision({
    entityType: revision.entityType,
    entityId: revision.entityId,
    changeType: "REVERT",
    summary: `Reverted to revision ${revision.id}`,
    previousValue: revision.newValue,
    newValue: restored,
    apiKeyId: auth.apiKey?.id,
    isAiGenerated: !auth.isSessionAdmin,
  });

  return Response.json({ ok: true, reverted: true, data: restored });
}
