import { db } from "@/lib/db";
import { authenticateRequest, authorizeScope } from "@/server/api-auth";
import { recordRevision } from "@/server/revisions";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(req);
  const authError = authorizeScope(auth, "drafts:approve");
  if (authError) return authError;

  const { id } = await params;
  const existing = await db.draft.findUnique({ where: { id } });
  if (!existing) {
    return Response.json({ ok: false, error: "Draft not found" }, { status: 404 });
  }

  const updated = await db.draft.update({
    where: { id },
    data: {
      status: "APPROVED",
      reviewedAt: new Date(),
    },
  });

  await recordRevision({
    entityType: "draft",
    entityId: id,
    changeType: "UPDATE",
    summary: `Approved draft: ${existing.title}`,
    previousValue: { status: existing.status },
    newValue: { status: updated.status },
    apiKeyId: auth.apiKey?.id,
    isAiGenerated: !auth.isSessionAdmin,
  });

  return Response.json({ ok: true, data: updated });
}
