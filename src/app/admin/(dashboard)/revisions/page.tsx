import { db } from "@/lib/db";
import { requireAdmin } from "@/server/auth";
import { RevisionsManager } from "./RevisionsManager";

export const dynamic = "force-dynamic";

export default async function AdminRevisionsPage() {
  await requireAdmin();

  const revisions = await db.revision.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const serialized = revisions.map((r) => ({
    id: r.id,
    entityType: r.entityType,
    entityId: r.entityId,
    action: r.changeType,
    changeSummary: r.summary || "",
    author: r.actorId,
    createdAt: r.createdAt.toISOString(),
    snapshotBefore: r.previousValue,
    snapshotAfter: r.newValue,
  }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-lg font-semibold tracking-tight text-[var(--os-fg)]">
          Audit Log & Revisions
        </h1>
        <p className="text-sm text-[var(--os-fg-muted)]">
          Complete, tamper-evident record of all changes made across the portfolio by humans, AI agents, and sync jobs with one-click rollback.
        </p>
      </div>

      <RevisionsManager revisions={serialized} />
    </div>
  );
}
