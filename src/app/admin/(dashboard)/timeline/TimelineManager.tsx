"use client";

import { useState } from "react";
import { createTimelineEntry, updateTimelineEntry, deleteTimelineEntry } from "./actions";

interface TimelineItem {
  id: string;
  title: string;
  type: string;
  organization: string | null;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  shortDescription: string;
  detailedDescription: string | null;
  technologies: string[];
  skills: string[];
  relatedProjectIds: string[];
  icon: string;
  order: number;
}

const TYPES = [
  "MILESTONE",
  "PROJECT",
  "UNIVERSITY",
  "INTERNSHIP",
  "EMPLOYMENT",
  "CERTIFICATION",
  "LEARNING",
];

export function TimelineManager({ items }: { items: TimelineItem[] }) {
  const [editing, setEditing] = useState<TimelineItem | "new" | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    const formData = new FormData(e.currentTarget);

    try {
      let res;
      if (editing === "new") {
        res = await createTimelineEntry(formData);
      } else if (editing && typeof editing === "object") {
        res = await updateTimelineEntry(editing.id, formData);
      }

      if (res?.error) {
        setMsg({ type: "err", text: res.error });
      } else {
        setMsg({ type: "ok", text: "Milestone saved successfully!" });
        setEditing(null);
      }
    } catch (err: any) {
      setMsg({ type: "err", text: err.message || "Failed to save milestone." });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    setLoading(true);
    try {
      await deleteTimelineEntry(id);
      setMsg({ type: "ok", text: `Deleted "${title}".` });
    } catch (err: any) {
      setMsg({ type: "err", text: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[var(--os-fg-muted)]">
          {items.length} milestone{items.length === 1 ? "" : "s"} ordered chronologically.
        </p>
        <button
          onClick={() => setEditing("new")}
          className="pressable rounded-[var(--os-r-chip)] bg-[var(--os-accent)] px-3 py-1.5 text-xs font-medium text-[var(--os-accent-fg)]"
        >
          + Add Milestone
        </button>
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

      {/* ── Editor Form Modal / Inline ── */}
      {editing && (
        <div className="rounded-[var(--os-r-panel)] border border-[var(--os-accent)] bg-[var(--os-surface-1)] p-5">
          <div className="mb-4 flex items-center justify-between border-b border-[var(--os-line)] pb-3">
            <h2 className="text-sm font-semibold text-[var(--os-fg)]">
              {editing === "new" ? "Add New Career Milestone" : `Edit "${editing.title}"`}
            </h2>
            <button
              onClick={() => setEditing(null)}
              className="text-xs text-[var(--os-fg-faint)] hover:text-[var(--os-fg)]"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className="label mb-1 block">Title</label>
                <input
                  name="title"
                  defaultValue={typeof editing === "object" ? editing.title : ""}
                  required
                  placeholder="e.g. KNUST Computer Science / Vault Escrow Engine"
                  className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-3 py-1.5 text-xs text-[var(--os-fg)] focus:outline-none"
                />
              </div>

              <div>
                <label className="label mb-1 block">Type</label>
                <select
                  name="type"
                  defaultValue={typeof editing === "object" ? editing.type : "MILESTONE"}
                  className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-3 py-1.5 text-xs text-[var(--os-fg)] focus:outline-none"
                >
                  {TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label mb-1 block">Organization / Entity</label>
                <input
                  name="organization"
                  defaultValue={typeof editing === "object" ? editing.organization || "" : ""}
                  placeholder="e.g. KNUST / Telecel / Freelance"
                  className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-3 py-1.5 text-xs text-[var(--os-fg)] focus:outline-none"
                />
              </div>

              <div>
                <label className="label mb-1 block">Start Date</label>
                <input
                  name="startDate"
                  defaultValue={typeof editing === "object" ? editing.startDate : ""}
                  required
                  placeholder="e.g. Jan 2024 or 2023"
                  className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-3 py-1.5 text-xs text-[var(--os-fg)] focus:outline-none"
                />
              </div>

              <div>
                <label className="label mb-1 block">End Date (or blank)</label>
                <input
                  name="endDate"
                  defaultValue={typeof editing === "object" ? editing.endDate || "" : ""}
                  placeholder="e.g. Aug 2026 or leave blank if current"
                  className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-3 py-1.5 text-xs text-[var(--os-fg)] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isCurrent"
                name="isCurrent"
                defaultChecked={typeof editing === "object" ? editing.isCurrent : false}
                className="rounded border-[var(--os-line)] text-[var(--os-accent)]"
              />
              <label htmlFor="isCurrent" className="text-xs text-[var(--os-fg)]">
                Currently ongoing / active milestone
              </label>
            </div>

            <div>
              <label className="label mb-1 block">Short Description</label>
              <textarea
                name="shortDescription"
                rows={2}
                required
                defaultValue={typeof editing === "object" ? editing.shortDescription : ""}
                placeholder="High-level summary of what was accomplished or studied."
                className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-3 py-1.5 text-xs text-[var(--os-fg)] focus:outline-none"
              />
            </div>

            <div>
              <label className="label mb-1 block">Detailed Description (Optional)</label>
              <textarea
                name="detailedDescription"
                rows={3}
                defaultValue={typeof editing === "object" ? editing.detailedDescription || "" : ""}
                placeholder="In-depth engineering notes, challenges, or architectural context."
                className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-3 py-1.5 text-xs text-[var(--os-fg)] focus:outline-none"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="label mb-1 block">Technologies (comma-separated)</label>
                <input
                  name="technologies"
                  defaultValue={typeof editing === "object" ? editing.technologies.join(", ") : ""}
                  placeholder="React, TypeScript, Prisma"
                  className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-3 py-1.5 text-xs text-[var(--os-fg)] focus:outline-none"
                />
              </div>

              <div>
                <label className="label mb-1 block">Skills (comma-separated)</label>
                <input
                  name="skills"
                  defaultValue={typeof editing === "object" ? editing.skills.join(", ") : ""}
                  placeholder="Distributed Systems, IoT"
                  className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-3 py-1.5 text-xs text-[var(--os-fg)] focus:outline-none"
                />
              </div>

              <div>
                <label className="label mb-1 block">Related Project Slugs</label>
                <input
                  name="relatedProjectIds"
                  defaultValue={typeof editing === "object" ? editing.relatedProjectIds.join(", ") : ""}
                  placeholder="vault, telecel-latency"
                  className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-3 py-1.5 text-xs text-[var(--os-fg)] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label mb-1 block">Icon Key</label>
                <input
                  name="icon"
                  defaultValue={typeof editing === "object" ? editing.icon : "timeline"}
                  placeholder="timeline, pulse, terminal, doc"
                  className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-3 py-1.5 text-xs text-[var(--os-fg)] focus:outline-none"
                />
              </div>

              <div>
                <label className="label mb-1 block">Sort Order</label>
                <input
                  type="number"
                  name="order"
                  defaultValue={typeof editing === "object" ? editing.order : 100}
                  className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-3 py-1.5 text-xs text-[var(--os-fg)] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-[var(--os-r-chip)] border border-[var(--os-line)] px-3 py-1.5 text-xs text-[var(--os-fg-muted)] hover:bg-[var(--os-surface-3)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="pressable rounded-[var(--os-r-chip)] bg-[var(--os-accent)] px-4 py-1.5 text-xs font-medium text-[var(--os-accent-fg)] disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Milestone"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Milestones List ── */}
      <div className="divide-y divide-[var(--os-line)] rounded-[var(--os-r-panel)] border border-[var(--os-line)] bg-[var(--os-surface-1)]">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-wrap items-center justify-between gap-3 p-4 transition-colors hover:bg-[var(--os-surface-2)]/60"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-semibold text-[var(--os-fg)]">
                  {item.startDate} {item.endDate ? `— ${item.endDate}` : item.isCurrent ? "— Present" : ""}
                </span>
                <span className="rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-3)] px-1.5 py-0.2 font-mono text-[0.6rem] text-[var(--os-fg-muted)]">
                  {item.type}
                </span>
                {item.isCurrent && (
                  <span className="rounded-[var(--os-r-chip)] bg-[var(--os-accent-wash)] px-1.5 py-0.2 font-mono text-[0.6rem] font-medium text-[var(--os-accent)]">
                    ACTIVE
                  </span>
                )}
                {item.organization && (
                  <span className="text-xs text-[var(--os-fg-faint)]">· {item.organization}</span>
                )}
              </div>
              <h3 className="mt-1 text-sm font-medium text-[var(--os-fg)]">{item.title}</h3>
              <p className="mt-0.5 line-clamp-2 text-xs text-[var(--os-fg-muted)]">
                {item.shortDescription}
              </p>
              {item.technologies.length > 0 && (
                <p className="mt-1 font-mono text-[0.65rem] text-[var(--os-fg-faint)]">
                  {item.technologies.join(", ")}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditing(item)}
                className="rounded-[var(--os-r-chip)] border border-[var(--os-line)] px-2.5 py-1 text-xs text-[var(--os-fg-muted)] hover:bg-[var(--os-surface-3)] hover:text-[var(--os-fg)]"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(item.id, item.title)}
                className="rounded-[var(--os-r-chip)] border border-[var(--os-crit)]/40 px-2.5 py-1 text-xs text-[var(--os-crit)] hover:bg-[var(--os-crit-wash)]"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
