"use client";

import { useState } from "react";
import { approveDraft, publishDraft, rejectDraft } from "./actions";

interface DraftItem {
  id: string;
  entityType: string;
  action: string;
  status: string;
  author: string | null;
  summary: string | null;
  proposedData: any;
  createdAt: string;
  reviewFeedback: string | null;
}

export function DraftsManager({ items }: { items: DraftItem[] }) {
  const [filter, setFilter] = useState<string>("PENDING");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const filtered = filter === "ALL" ? items : items.filter((d) => d.status === filter);

  async function handleApprove(id: string) {
    setLoading(true);
    setMsg(null);
    try {
      const res = await approveDraft(id);
      if (res.error) setMsg({ type: "err", text: res.error });
      else setMsg({ type: "ok", text: "Draft approved!" });
    } catch (err: any) {
      setMsg({ type: "err", text: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function handlePublish(id: string) {
    setLoading(true);
    setMsg(null);
    try {
      const res = await publishDraft(id);
      if (res.error) setMsg({ type: "err", text: res.error });
      else setMsg({ type: "ok", text: "Draft published into production!" });
    } catch (err: any) {
      setMsg({ type: "err", text: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleReject(id: string) {
    const reason = prompt("Enter rejection reason (optional):");
    if (reason === null) return;
    setLoading(true);
    setMsg(null);
    try {
      const res = await rejectDraft(id, reason || undefined);
      if (res.error) setMsg({ type: "err", text: res.error });
      else setMsg({ type: "ok", text: "Draft rejected." });
    } catch (err: any) {
      setMsg({ type: "err", text: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--os-line)] pb-2">
        <div className="flex gap-1.5">
          {["PENDING", "APPROVED", "PUBLISHED", "REJECTED", "ALL"].map((st) => {
            const count = st === "ALL" ? items.length : items.filter((d) => d.status === st).length;
            return (
              <button
                key={st}
                onClick={() => setFilter(st)}
                className={`rounded-[var(--os-r-chip)] px-3 py-1 text-xs font-medium transition-colors ${
                  filter === st
                    ? "bg-[var(--os-accent)] text-[var(--os-accent-fg)]"
                    : "border border-[var(--os-line)] text-[var(--os-fg-muted)] hover:bg-[var(--os-surface-2)]"
                }`}
              >
                {st} ({count})
              </button>
            );
          })}
        </div>
      </div>

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

      {/* Drafts List */}
      {filtered.length === 0 ? (
        <div className="rounded-[var(--os-r-panel)] border border-[var(--os-line)] bg-[var(--os-surface-1)] p-8 text-center">
          <p className="text-xs text-[var(--os-fg-faint)]">No drafts with status {filter}.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((d) => {
            const isExpanded = expandedId === d.id;
            return (
              <div
                key={d.id}
                className="rounded-[var(--os-r-panel)] border border-[var(--os-line)] bg-[var(--os-surface-1)] p-4 transition-all"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--os-line)] pb-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-[var(--os-fg)]">
                      {d.entityType} ({d.action})
                    </span>
                    <span
                      className={`rounded-[var(--os-r-chip)] px-2 py-0.2 font-mono text-[0.6rem] uppercase tracking-wider ${
                        d.status === "PENDING"
                          ? "bg-[var(--os-warn-wash)] text-[var(--os-warn)] border border-[var(--os-warn)]/30"
                          : d.status === "PUBLISHED"
                          ? "bg-[var(--os-ok-wash)] text-[var(--os-ok)] border border-[var(--os-ok)]/30"
                          : "bg-[var(--os-surface-3)] text-[var(--os-fg-muted)]"
                      }`}
                    >
                      {d.status}
                    </span>
                    <span className="font-mono text-[0.65rem] text-[var(--os-fg-faint)]">
                      By {d.author || "Agent"} · {new Date(d.createdAt).toLocaleString()}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {d.status === "PENDING" && (
                      <>
                        <button
                          onClick={() => handlePublish(d.id)}
                          disabled={loading}
                          className="pressable rounded-[var(--os-r-chip)] bg-[var(--os-accent)] px-2.5 py-1 text-xs font-medium text-[var(--os-accent-fg)] hover:opacity-90"
                        >
                          Publish to Prod
                        </button>
                        <button
                          onClick={() => handleApprove(d.id)}
                          disabled={loading}
                          className="rounded-[var(--os-r-chip)] border border-[var(--os-line)] px-2.5 py-1 text-xs text-[var(--os-ok)] hover:bg-[var(--os-ok-wash)]"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(d.id)}
                          disabled={loading}
                          className="rounded-[var(--os-r-chip)] border border-[var(--os-crit)]/30 px-2.5 py-1 text-xs text-[var(--os-crit)] hover:bg-[var(--os-crit-wash)]"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {d.status === "APPROVED" && (
                      <button
                        onClick={() => handlePublish(d.id)}
                        disabled={loading}
                        className="pressable rounded-[var(--os-r-chip)] bg-[var(--os-accent)] px-2.5 py-1 text-xs font-medium text-[var(--os-accent-fg)]"
                      >
                        Publish to Prod
                      </button>
                    )}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : d.id)}
                      className="text-xs text-[var(--os-fg-faint)] hover:text-[var(--os-fg)]"
                    >
                      {isExpanded ? "Hide diff ↑" : "Inspect payload ↓"}
                    </button>
                  </div>
                </div>

                <div className="mt-3">
                  <p className="text-xs font-medium text-[var(--os-fg)]">{d.summary}</p>
                  {d.reviewFeedback && (
                    <p className="mt-1 text-xs italic text-[var(--os-crit)]">
                      Feedback: {d.reviewFeedback}
                    </p>
                  )}
                </div>

                {isExpanded && (
                  <div className="mt-3 overflow-x-auto rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] p-3">
                    <pre className="font-mono text-[0.68rem] text-[var(--os-fg-muted)] whitespace-pre-wrap">
                      {JSON.stringify(d.proposedData, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
