"use client";

import { useMemo, useState } from "react";
import { useTimeline, useProjects } from "../os/PortfolioProvider";
import {
  TIMELINE_TYPE_LABEL,
  type TimelineTypeKey,
} from "@/lib/portfolio-types";
import { useOS } from "@/lib/store";
import { Icon } from "../os/Icon";

const FILTER_TYPES: { id: TimelineTypeKey | "all"; label: string }[] = [
  { id: "all", label: "All Events" },
  { id: "milestone", label: "Milestones" },
  { id: "project", label: "Projects" },
  { id: "university", label: "University" },
  { id: "internship", label: "Internships" },
  { id: "employment", label: "Employment" },
  { id: "certification", label: "Certifications" },
  { id: "learning", label: "Learning" },
];

export function TimelineApp() {
  const timeline = useTimeline();
  const projects = useProjects();
  const openApp = useOS((s) => s.openApp);

  const [filterType, setFilterType] = useState<TimelineTypeKey | "all">("all");
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = [...timeline];

    if (filterType !== "all") {
      list = list.filter((item) => item.type === filterType);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.organization?.toLowerCase().includes(q) ||
          item.shortDescription.toLowerCase().includes(q) ||
          item.detailedDescription?.toLowerCase().includes(q) ||
          item.technologies.some((t) => t.toLowerCase().includes(q)) ||
          item.skills.some((s) => s.toLowerCase().includes(q))
      );
    }

    list.sort((a, b) => (sortAsc ? a.order - b.order : b.order - a.order));
    return list;
  }, [timeline, filterType, search, sortAsc]);

  const currentCount = timeline.filter((t) => t.isCurrent).length;

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--os-ground)]">
      {/* ── Toolbar ── */}
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--os-line)] bg-[var(--os-surface-2)] px-4 py-2 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          {FILTER_TYPES.map((f) => {
            const count =
              f.id === "all"
                ? timeline.length
                : timeline.filter((t) => t.type === f.id).length;
            if (count === 0 && f.id !== "all") return null;

            return (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                className={`flex items-center gap-1.5 rounded-[var(--os-r-chip)] px-2.5 py-1 transition-colors ${
                  filterType === f.id
                    ? "bg-[var(--os-accent)] text-[var(--os-accent-fg)] font-medium"
                    : "border border-[var(--os-line)] text-[var(--os-fg-muted)] hover:bg-[var(--os-surface-3)] hover:text-[var(--os-fg)]"
                }`}
              >
                <span>{f.label}</span>
                <span
                  className={`text-[0.65rem] ${
                    filterType === f.id
                      ? "opacity-80"
                      : "text-[var(--os-fg-faint)]"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {/* Search box */}
          <div className="relative flex items-center">
            <span className="pointer-events-none absolute left-2 text-[var(--os-fg-faint)]">
              <Icon name="search" size={12} />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter timeline..."
              className="rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-1)] py-1 pl-6 pr-2 text-xs text-[var(--os-fg)] placeholder:text-[var(--os-fg-faint)] focus:border-[var(--os-accent)] focus:outline-none"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-1.5 text-[var(--os-fg-faint)] hover:text-[var(--os-fg)]"
              >
                ×
              </button>
            )}
          </div>

          {/* Sort direction */}
          <button
            onClick={() => setSortAsc(!sortAsc)}
            title={sortAsc ? "Oldest first" : "Newest first"}
            className="flex items-center gap-1 rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-1)] px-2 py-1 text-[var(--os-fg-muted)] hover:bg-[var(--os-surface-3)]"
          >
            <span className="font-mono text-[0.65rem]">
              {sortAsc ? "ASC ↑" : "DESC ↓"}
            </span>
          </button>
        </div>
      </header>

      {/* ── Timeline Track ── */}
      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
        {filtered.length === 0 ? (
          <div className="grid h-full place-items-center py-12 text-center">
            <p className="text-sm text-[var(--os-fg-faint)]">
              No milestones match your current filter.
            </p>
          </div>
        ) : (
          <div className="relative mx-auto max-w-2xl pl-6 sm:pl-8">
            {/* Vertical timeline spine */}
            <div
              className="absolute bottom-4 left-[11px] top-3 w-px bg-gradient-to-b from-[var(--os-accent)] via-[var(--os-line-strong)] to-transparent sm:left-[15px]"
              aria-hidden="true"
            />

            <div className="space-y-6">
              {filtered.map((item) => {
                const isExpanded = expandedId === item.id;
                const relatedProjects = projects.filter((p) =>
                  item.relatedProjectIds.includes(p.slug)
                );

                return (
                  <article
                    key={item.id}
                    className="relative group rounded-[var(--os-r-panel)] border border-[var(--os-line)] bg-[var(--os-surface-2)] p-4 transition-all hover:border-[var(--os-line-strong)]"
                  >
                    {/* Node Dot / Icon on spine */}
                    <div
                      className={`absolute -left-[29px] top-4.5 flex h-6 w-6 items-center justify-center rounded-full border sm:-left-[39px] ${
                        item.isCurrent
                          ? "border-[var(--os-accent)] bg-[var(--os-surface-1)] text-[var(--os-accent)] shadow-[0_0_8px_var(--os-accent)]"
                          : "border-[var(--os-line-strong)] bg-[var(--os-surface-1)] text-[var(--os-fg-muted)]"
                      }`}
                    >
                      <Icon name={item.icon || "timeline"} size={12} strokeWidth={1.75} />
                    </div>

                    {/* Header: Date + Badges */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--os-line)] pb-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-[var(--os-fg)]">
                          {item.startDate}
                          {item.endDate
                            ? ` — ${item.endDate}`
                            : item.isCurrent
                            ? " — Present"
                            : ""}
                        </span>
                        <span className="rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-3)] px-1.5 py-0.5 font-mono text-[0.6rem] uppercase tracking-wider text-[var(--os-fg-muted)]">
                          {TIMELINE_TYPE_LABEL[item.type] || item.type}
                        </span>
                        {item.isCurrent && (
                          <span className="flex items-center gap-1 rounded-[var(--os-r-chip)] bg-[var(--os-accent-wash)] px-1.5 py-0.5 font-mono text-[0.6rem] font-medium text-[var(--os-accent)]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[var(--os-accent)] animate-pulse" />
                            ACTIVE
                          </span>
                        )}
                      </div>

                      {item.organization && (
                        <span className="font-mono text-[0.68rem] text-[var(--os-fg-faint)]">
                          {item.organization}
                        </span>
                      )}
                    </div>

                    {/* Title & Short Description */}
                    <div className="mt-3">
                      <h2 className="text-sm font-semibold tracking-tight text-[var(--os-fg)]">
                        {item.title}
                      </h2>
                      <p className="mt-1 text-xs leading-relaxed text-[var(--os-fg-muted)]">
                        {item.shortDescription}
                      </p>
                    </div>

                    {/* Detailed text if expanded */}
                    {isExpanded && item.detailedDescription && (
                      <div className="mt-3 rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-1)] p-3 text-xs leading-relaxed text-[var(--os-fg-muted)]">
                        <p>{item.detailedDescription}</p>
                      </div>
                    )}

                    {/* Tech & Skills chips */}
                    {(item.technologies.length > 0 || item.skills.length > 0) && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {item.technologies.map((t) => (
                          <span
                            key={t}
                            className="rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-1)] px-1.5 py-0.5 font-mono text-[0.62rem] text-[var(--os-fg-muted)]"
                          >
                            {t}
                          </span>
                        ))}
                        {item.skills.map((s) => (
                          <span
                            key={s}
                            className="rounded-[var(--os-r-chip)] bg-[var(--os-surface-3)] px-1.5 py-0.5 font-mono text-[0.62rem] text-[var(--os-accent)]"
                          >
                            #{s}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Related Projects launcher buttons */}
                    {relatedProjects.length > 0 && (
                      <div className="mt-3.5 flex flex-wrap items-center gap-1.5 border-t border-[var(--os-line)] pt-2.5">
                        <span className="text-[0.65rem] font-mono text-[var(--os-fg-faint)] mr-1">
                          Connected Project:
                        </span>
                        {relatedProjects.map((rp) => (
                          <button
                            key={rp.slug}
                            onClick={() =>
                              openApp("projects", {
                                title: "Projects",
                                w: 940,
                                h: 620,
                                props: { slug: rp.slug },
                              })
                            }
                            className="inline-flex items-center gap-1 rounded-[var(--os-r-chip)] border border-[var(--os-accent)]/40 bg-[var(--os-accent-wash)] px-2 py-0.5 text-[0.65rem] font-medium text-[var(--os-accent)] transition-colors hover:border-[var(--os-accent)] hover:bg-[var(--os-accent)] hover:text-[var(--os-accent-fg)]"
                          >
                            <Icon name="folder" size={11} />
                            <span>{rp.title}</span>
                            <Icon name="chevron" size={9} />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Expand/Collapse Toggle if there is more detail */}
                    {item.detailedDescription && (
                      <div className="mt-2.5 flex justify-end">
                        <button
                          onClick={() =>
                            setExpandedId(isExpanded ? null : item.id)
                          }
                          className="font-mono text-[0.65rem] text-[var(--os-fg-faint)] hover:text-[var(--os-fg)]"
                        >
                          {isExpanded ? "Show less ↑" : "More details ↓"}
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Footer HUD ── */}
      <footer className="flex shrink-0 items-center justify-between border-t border-[var(--os-line)] bg-[var(--os-surface-2)] px-4 py-1.5 text-[0.65rem] font-mono text-[var(--os-fg-faint)]">
        <span>
          Showing {filtered.length} of {timeline.length} milestone
          {timeline.length === 1 ? "" : "s"}
        </span>
        <span className="flex items-center gap-2">
          <span>Current Focus: {currentCount} active</span>
          <span>·</span>
          <span>KNUST / TEMPLAR</span>
        </span>
      </footer>
    </div>
  );
}
