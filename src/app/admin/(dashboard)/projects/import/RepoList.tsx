"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { GhRepo } from "@/server/github";

interface RepoListProps {
  repos: GhRepo[];
  linkedMap: Record<string, { id: string; name: string; slug: string }>;
}

export function RepoList({ repos, linkedMap }: RepoListProps) {
  const [search, setSearch] = useState("");
  const [selectedLang, setSelectedLang] = useState<string>("all");

  const languages = useMemo(() => {
    const set = new Set<string>();
    for (const r of repos) {
      if (r.language) set.add(r.language);
    }
    return Array.from(set).sort();
  }, [repos]);

  const filtered = useMemo(() => {
    return repos.filter((r) => {
      const matchSearch =
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.full_name.toLowerCase().includes(search.toLowerCase()) ||
        (r.description && r.description.toLowerCase().includes(search.toLowerCase()));

      const matchLang = selectedLang === "all" || r.language === selectedLang;
      return matchSearch && matchLang;
    });
  }, [repos, search, selectedLang]);

  return (
    <div>
      {/* Filters Bar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          placeholder="Filter repositories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm rounded-[var(--os-r-chip)] border border-[var(--os-line-strong)] bg-[var(--os-surface-2)] px-3.5 py-1.5 font-mono text-xs text-[var(--os-fg)] placeholder:text-[var(--os-fg-faint)] focus:border-[var(--os-accent)] focus:outline-none"
        />

        {languages.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto text-[0.7rem]">
            <button
              onClick={() => setSelectedLang("all")}
              className={`rounded-[var(--os-r-chip)] border px-2.5 py-1 font-mono transition-colors ${
                selectedLang === "all"
                  ? "border-[var(--os-accent)] bg-[var(--os-accent)] text-[var(--os-accent-fg)]"
                  : "border-[var(--os-line)] bg-[var(--os-surface-2)] text-[var(--os-fg-muted)] hover:text-[var(--os-fg)]"
              }`}
            >
              All ({repos.length})
            </button>
            {languages.map((lang) => (
              <button
                key={lang}
                onClick={() => setSelectedLang(lang)}
                className={`rounded-[var(--os-r-chip)] border px-2.5 py-1 font-mono transition-colors ${
                  selectedLang === lang
                    ? "border-[var(--os-accent)] bg-[var(--os-accent)] text-[var(--os-accent-fg)]"
                    : "border-[var(--os-line)] bg-[var(--os-surface-2)] text-[var(--os-fg-muted)] hover:text-[var(--os-fg)]"
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Repos Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-[var(--os-r-panel)] border border-[var(--os-line)] bg-[var(--os-surface-1)] p-8 text-center">
          <p className="text-sm text-[var(--os-fg-muted)]">No matching repositories found.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((repo) => {
            const linked = linkedMap[String(repo.id)];
            const updatedDate = new Date(repo.updated_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            return (
              <div
                key={repo.id}
                className="flex flex-col justify-between rounded-[var(--os-r-panel)] border border-[var(--os-line)] bg-[var(--os-surface-1)] p-4 transition-colors hover:border-[var(--os-line-strong)]"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-mono text-xs font-semibold text-[var(--os-fg)]">
                      {repo.full_name}
                    </h2>
                    <span
                      className={`shrink-0 rounded-[var(--os-r-chip)] border px-1.5 py-0.5 font-mono text-[0.6rem] ${
                        repo.private
                          ? "border-[var(--os-warn)]/30 bg-[var(--os-warn)]/10 text-[var(--os-warn)]"
                          : "border-[var(--os-line)] bg-[var(--os-surface-2)] text-[var(--os-fg-muted)]"
                      }`}
                    >
                      {repo.private ? "Private" : "Public"}
                    </span>
                  </div>

                  <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[var(--os-fg-muted)]">
                    {repo.description || "No description provided."}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-[var(--os-line)] pt-3 text-[0.7rem] text-[var(--os-fg-faint)]">
                  <div className="flex items-center gap-2">
                    {repo.language && (
                      <span className="flex items-center gap-1 font-mono text-[var(--os-fg-muted)]">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--os-accent)]" />
                        {repo.language}
                      </span>
                    )}
                    <span>{updatedDate}</span>
                  </div>

                  {linked ? (
                    <Link
                      href={`/admin/projects/${linked.id}`}
                      className="pressable rounded-[var(--os-r-chip)] border border-[var(--os-ok)]/30 bg-[var(--os-ok)]/10 px-2.5 py-1 font-mono text-[0.68rem] text-[var(--os-ok)] hover:bg-[var(--os-ok)]/20"
                    >
                      ✓ Linked
                    </Link>
                  ) : (
                    <Link
                      href={`/admin/projects/import/${repo.owner.login}/${repo.name}`}
                      className="pressable rounded-[var(--os-r-chip)] bg-[var(--os-accent)] px-2.5 py-1 font-mono text-[0.68rem] font-medium text-[var(--os-accent-fg)]"
                    >
                      Import →
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
