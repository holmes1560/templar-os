import { db } from "@/lib/db";
import { requireAdmin } from "@/server/auth";
import { TimelineManager } from "./TimelineManager";

export const dynamic = "force-dynamic";

export default async function AdminTimelinePage() {
  await requireAdmin();

  const entries = await db.timelineEntry.findMany({
    orderBy: { order: "asc" },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-lg font-semibold tracking-tight text-[var(--os-fg)]">
          Career Timeline & Milestones
        </h1>
        <p className="text-sm text-[var(--os-fg-muted)]">
          Manage career transitions, academic milestones, internships, projects, and active focus areas.
        </p>
      </div>

      <TimelineManager items={entries} />
    </div>
  );
}
