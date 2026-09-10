"use client";

import { useState } from "react";
import { rollbackRevision } from "./actions";

interface RevisionItem {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  changeSummary: string;
  author: string | null;
  createdAt: string;
  snapshotBefore: any;
  snapshotAfter: any;
}

export function RevisionsManager({ revisions }: { revisions: RevisionItem[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function handleRollback(id: string, summary: string) {
    if (!confirm(`Are you sure you want to rollback to the state before this revision?\n\n"${summary}"`)) return;
    setLoading(true);
    setMsg(null);
    try {
      const res = await rollbackRevision(id);
      if (res.error) setMsg({ type: "err", text: res.error });
      else setMsg({ type: "ok", text: "Successfully rolled back entity to previous state!" });
    } catch (err: any) {
      setMsg({ type: "err", text: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {msg && (
        <div
          className={`rounded-[var(--os-r-panel)] p-3 text-xs font-mono ${
            msg.type === "ok"
              ? "bg-[var(--os-ok-wash)] text-[var(--os-ok)] border border-[var(--os-ok)]/30"
              : "bg-[var(--os-crit-wash)] text-[var(--os-crit)] border border-[var(--os-crit)]/30"
          }`}
        >
          {msg.text}
        </div>
      )}

      <div className="divide-y divide-[var(--os-line)] rounded-[var(--os-r-panel)] border border-[var(--os-line)] bg-[var(--os-surface-1)]">
        {revisions.length === 0 ? (
          <div className="p-8 text-center text-xs text-[var(--os-fg-faint)]">
            No revisions recorded in the audit log yet.
          </div>
        ) : (
          revisions.map((r) => {
            const isExpanded = expandedId === r.id;
            return (
              <div key={r.id} className="p-4 transition-colors hover:bg-[var(--os-surface-2)]/40">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-[var(--os-fg)]">
                      {r.entityType}
                    </span>
                    <span className="rounded-[var(--os-r-chip)] bg-[var(--os-surface-3)] px-1.5 py-0.2 font-mono text-[0.6rem] text-[var(--os-fg-muted)]">
                      {r.action}
                    </span>
                    <span className="text-xs text-[var(--os-fg-muted)]">{r.changeSummary}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {r.snapshotBefore && (
                      <button
                        onClick={() => handleRollback(r.id, r.changeSummary)}
                        disabled={loading}
                        className="rounded-[var(--os-r-chip)] border border-[var(--os-warn)]/40 px-2 py-0.5 text-xs text-[var(--os-warn)] hover:bg-[var(--os-warn-wash)]"
                      >
                        Rollback
                      </button>
                    )}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : r.id)}
                      className="text-xs text-[var(--os-fg-faint)] hover:text-[var(--os-fg)]"
                    >
                      {isExpanded ? "Hide diff ↑" : "View diff ↓"}
                    </button>
                  </div>
                </div>

                <div className="mt-1 flex items-center gap-3 font-mono text-[0.65rem] text-[var(--os-fg-faint)]">
                  <span>Author: {r.author || "system"}</span>
                  <span>•</span>
                  <span>{new Date(r.createdAt).toLocaleString()}</span>
                  <span>•</span>
                  <span>Entity ID: {r.entityId}</span>
                </div>

                {isExpanded && (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] p-3 text-xs">
                    <div>
                      <h5 className="mb-1 font-mono text-[0.65rem] font-semibold text-[var(--os-crit)]">
                        BEFORE
                      </h5>
                      <pre className="max-h-60 overflow-auto font-mono text-[0.62rem] text-[var(--os-fg-muted)]">
                        {r.snapshotBefore ? JSON.stringify(r.snapshotBefore, null, 2) : "null"}
                      </pre>
                    </div>
                    <div>
                      <h5 className="mb-1 font-mono text-[0.65rem] font-semibold text-[var(--os-ok)]">
                        AFTER
                      </h5>
                      <pre className="max-h-60 overflow-auto font-mono text-[0.62rem] text-[var(--os-fg-muted)]">
                        {r.snapshotAfter ? JSON.stringify(r.snapshotAfter, null, 2) : "null"}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
