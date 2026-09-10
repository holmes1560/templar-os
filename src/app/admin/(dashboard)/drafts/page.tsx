import { db } from "@/lib/db";
import { requireAdmin } from "@/server/auth";
import { DraftsManager } from "./DraftsManager";

export const dynamic = "force-dynamic";

export default async function AdminDraftsPage() {
  await requireAdmin();

  const drafts = await db.draft.findMany({
    orderBy: { createdAt: "desc" },
  });

  const serialized = drafts.map((d) => ({
    id: d.id,
    entityType: d.entityType,
    action: d.action,
    status: d.status,
    author: d.aiOrigin,
    summary: d.summary || d.title,
    proposedData: d.data,
    createdAt: d.createdAt.toISOString(),
    reviewFeedback: d.reviewNotes,
  }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-lg font-semibold tracking-tight text-[var(--os-fg)]">
          Review Queue & Draft Proposals
        </h1>
        <p className="text-sm text-[var(--os-fg-muted)]">
          Audit, inspect, approve, or publish proposals submitted by AI agents, GitHub sync jobs, and REST API clients.
        </p>
      </div>

      <DraftsManager items={serialized} />
    </div>
  );
}
