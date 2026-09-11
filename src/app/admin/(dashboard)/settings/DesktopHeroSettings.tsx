"use client";

import React, { useState } from "react";
import { saveDesktopHeroSettingsAction, type DesktopHeroSettingsPayload } from "./actions";
import { TemplarLogo } from "@/components/os/TemplarLogo";
import { Icon } from "@/components/os/Icon";

export interface DesktopHeroSettingsProps {
  initialSettings: Record<string, string>;
  defaultName?: string;
  defaultTitle?: string;
  dynamicProjectsCount: number;
  dynamicAppsCount: number;
  dynamicWorkspacesCount: number;
}

export function DesktopHeroSettings({
  initialSettings,
  defaultName = "ASENSO OWUSU ANSAH",
  defaultTitle = "Software Engineer | Problem Solver | Builder",
  dynamicProjectsCount,
  dynamicAppsCount,
  dynamicWorkspacesCount,
}: DesktopHeroSettingsProps) {
  const [enabled, setEnabled] = useState<boolean>(
    initialSettings["hero.enabled"] !== "false"
  );
  const [showOnAllWorkspaces, setShowOnAllWorkspaces] = useState<boolean>(
    initialSettings["hero.showOnAllWorkspaces"] === "true"
  );
  const [greeting, setGreeting] = useState<string>(
    initialSettings["hero.greeting"] || "WELCOME TO"
  );
  const [systemName, setSystemName] = useState<string>(
    initialSettings["hero.systemName"] || "Templar OS"
  );
  const [name, setName] = useState<string>(
    initialSettings["hero.name"] || defaultName
  );
  const [subtitle, setSubtitle] = useState<string>(
    initialSettings["hero.subtitle"] || defaultTitle
  );
  const [prompt, setPrompt] = useState<string>(
    initialSettings["hero.prompt"] || "Select an application to get started."
  );
  const [missionCount, setMissionCount] = useState<string>(
    initialSettings["hero.missionCount"] || "1"
  );
  const [missionLabel, setMissionLabel] = useState<string>(
    initialSettings["hero.missionLabel"] || "Mission"
  );
  const [workspacesOverride, setWorkspacesOverride] = useState<string>(
    initialSettings["hero.workspacesCount"] || ""
  );
  const [appsOverride, setAppsOverride] = useState<string>(
    initialSettings["hero.appsCount"] || ""
  );
  const [projectsOverride, setProjectsOverride] = useState<string>(
    initialSettings["hero.projectsCount"] || ""
  );

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    const payload: DesktopHeroSettingsPayload = {
      enabled,
      showOnAllWorkspaces,
      greeting,
      systemName,
      name,
      subtitle,
      prompt,
      missionCount,
      missionLabel,
      workspacesCount: workspacesOverride,
      appsCount: appsOverride,
      projectsCount: projectsOverride,
    };

    try {
      const res = await saveDesktopHeroSettingsAction(payload);
      if (res.ok) {
        setMsg({ type: "ok", text: "Desktop hero HUD settings saved successfully!" });
      } else {
        setMsg({ type: "err", text: res.error || "Failed to save settings." });
      }
    } catch (err: unknown) {
      setMsg({
        type: "err",
        text: err instanceof Error ? err.message : "An unexpected error occurred.",
      });
    } finally {
      setSaving(false);
    }
  }

  // Split system title for preview
  const titleParts = systemName.split(" ");
  const mainTitle = titleParts.length > 1 ? titleParts.slice(0, -1).join(" ") : systemName;
  const suffix = titleParts.length > 1 ? titleParts[titleParts.length - 1] : "";

  const effectiveWorkspaces = workspacesOverride.trim() || dynamicWorkspacesCount;
  const effectiveApps = appsOverride.trim() || dynamicAppsCount;
  const effectiveProjects = projectsOverride.trim() || dynamicProjectsCount;

  return (
    <div className="rounded-[var(--os-r-panel)] border border-[var(--os-line)] bg-[var(--os-surface-1)] p-5">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-medium text-[var(--os-fg)]">
            Desktop Hero &amp; Branding Watermark
          </h2>
          <p className="mt-0.5 text-xs text-[var(--os-fg-muted)]">
            Configure the ambient HUD watermark, logo, identity headers, and dynamic system counters displayed on the OS desktop.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--os-fg)]">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="accent-[var(--os-accent)]"
            />
            <span>Enable Desktop Hero</span>
          </label>
        </div>
      </div>

      {msg && (
        <div
          className={`mb-5 rounded-[var(--os-r-chip)] border p-3 font-mono text-xs ${
            msg.type === "ok"
              ? "border-[var(--os-ok)]/30 bg-[var(--os-ok-wash)] text-[var(--os-ok)]"
              : "border-[var(--os-crit)]/30 bg-[var(--os-crit-wash)] text-[var(--os-crit)]"
          }`}
        >
          {msg.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* ── Live Preview Box ── */}
        <div className="rounded-[var(--os-r-panel)] border border-[var(--os-line)] bg-[#070d19] p-6 text-center shadow-inner relative overflow-hidden">
          <div className="os-grid pointer-events-none absolute inset-0 opacity-40" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(56,189,248,0.12),transparent_70%)]" />

          <div className="relative z-10 mx-auto max-w-[520px] py-4">
            {/* Upper Framed Area with Corner brackets */}
            <div className="relative flex flex-col items-center">
              <span className="pointer-events-none absolute left-0 top-[18px] h-3.5 w-3.5 border-l border-t border-[#38bdf8]/35" />
              <span className="pointer-events-none absolute right-0 top-[18px] h-3.5 w-3.5 border-r border-t border-[#38bdf8]/35" />
              <span className="pointer-events-none absolute bottom-0 left-0 h-3.5 w-3.5 border-b border-l border-[#38bdf8]/35" />
              <span className="pointer-events-none absolute bottom-0 right-0 h-3.5 w-3.5 border-b border-r border-[#38bdf8]/35" />

              <div className="mb-[24px] flex h-[48px] w-[48px] items-center justify-center">
                <TemplarLogo size={42} glow />
              </div>

              <p
                className="mb-[8px] text-[10px] font-medium uppercase text-slate-400"
                style={{ letterSpacing: "5px" }}
              >
                {greeting || "WELCOME TO"}
              </p>

              <h3 className="mb-[12px] text-[34px] font-bold leading-none tracking-tight sm:text-[38px]">
                <span className="text-slate-100">{mainTitle}</span>
                {suffix && (
                  <span className="ml-2.5 text-[#38bdf8] drop-shadow-[0_0_12px_rgba(56,189,248,0.45)]">
                    {suffix}
                  </span>
                )}
              </h3>

              <p
                className="mb-[8px] text-[11px] font-semibold uppercase text-slate-200"
                style={{ letterSpacing: "4px" }}
              >
                {name || defaultName}
              </p>

              <p className="mb-[20px] text-[10px] text-slate-400">
                {subtitle || defaultTitle}
              </p>

              <div className="mb-[24px] h-[1px] w-[68px] bg-gradient-to-r from-transparent via-[#38bdf8] to-transparent shadow-[0_0_8px_rgba(56,189,248,0.6)]" />

              <p
                className="text-[10px] text-slate-400"
                style={{ letterSpacing: "1px" }}
              >
                {prompt}
              </p>
            </div>

            {/* Statistics row */}
            <div className="mt-[36px] flex w-full items-center justify-between px-2">
              <div className="flex flex-1 flex-col items-center">
                <Icon name="monitor" size={15} className="text-slate-400" />
                <span className="mt-1 font-mono text-sm font-semibold text-slate-200">{effectiveWorkspaces}</span>
                <span className="mt-0.5 text-[8.5px] font-medium uppercase tracking-[1px] text-slate-500">Workspaces</span>
              </div>
              <div className="h-[22px] w-[1px] bg-slate-700/40" />
              <div className="flex flex-1 flex-col items-center">
                <Icon name="grid" size={15} className="text-slate-400" />
                <span className="mt-1 font-mono text-sm font-semibold text-slate-200">{effectiveApps}</span>
                <span className="mt-0.5 text-[8.5px] font-medium uppercase tracking-[1px] text-slate-500">Applications</span>
              </div>
              <div className="h-[22px] w-[1px] bg-slate-700/40" />
              <div className="flex flex-1 flex-col items-center">
                <Icon name="folder" size={15} className="text-slate-400" />
                <span className="mt-1 font-mono text-sm font-semibold text-slate-200">{effectiveProjects}</span>
                <span className="mt-0.5 text-[8.5px] font-medium uppercase tracking-[1px] text-slate-500">Projects</span>
              </div>
              <div className="h-[22px] w-[1px] bg-slate-700/40" />
              <div className="flex flex-1 flex-col items-center">
                <Icon name="code" size={15} className="text-slate-400" />
                <span className="mt-1 font-mono text-sm font-semibold text-slate-200">{missionCount}</span>
                <span className="mt-0.5 text-[8.5px] font-medium uppercase tracking-[1px] text-slate-500">{missionLabel}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Text Fields ── */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label mb-1 block text-xs">Welcome Greeting</label>
            <input
              type="text"
              value={greeting}
              onChange={(e) => setGreeting(e.target.value)}
              placeholder="WELCOME TO"
              className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-3 py-2 text-xs text-[var(--os-fg)] focus:border-[var(--os-accent)] focus:outline-none"
            />
            <p className="mt-1 text-[0.65rem] text-[var(--os-fg-faint)]">
              Small letterspaced uppercase line directly above the system title.
            </p>
          </div>

          <div>
            <label className="label mb-1 block text-xs">System Title</label>
            <input
              type="text"
              value={systemName}
              onChange={(e) => setSystemName(e.target.value)}
              placeholder="Templar OS"
              className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-3 py-2 text-xs text-[var(--os-fg)] focus:border-[var(--os-accent)] focus:outline-none"
            />
            <p className="mt-1 text-[0.65rem] text-[var(--os-fg-faint)]">
              The last word (e.g. &quot;OS&quot;) automatically receives electric cyan accent glow.
            </p>
          </div>

          <div>
            <label className="label mb-1 block text-xs">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ASENSO OWUSU ANSAH"
              className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-3 py-2 text-xs text-[var(--os-fg)] focus:border-[var(--os-accent)] focus:outline-none"
            />
          </div>

          <div>
            <label className="label mb-1 block text-xs">Roles &amp; Subtitle</label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Software Engineer | Problem Solver | Builder"
              className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-3 py-2 text-xs text-[var(--os-fg)] focus:border-[var(--os-accent)] focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="label mb-1 block text-xs">Helper Prompt</label>
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Select an application to get started."
              className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-3 py-2 text-xs text-[var(--os-fg)] focus:border-[var(--os-accent)] focus:outline-none"
            />
          </div>
        </div>

        {/* ── Metric Labels & Overrides ── */}
        <div className="border-t border-[var(--os-line)] pt-4">
          <h3 className="label mb-3 text-xs uppercase tracking-wider text-[var(--os-fg)]">
            Metrics &amp; Dynamic Counters
          </h3>
          <p className="mb-4 text-xs text-[var(--os-fg-muted)]">
            Counts are dynamically calculated from real database records. You can also specify manual overrides if desired.
          </p>

          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <label className="label mb-1 block text-xs">
                Workspaces Override <span className="text-[var(--os-fg-faint)]">(Live: {dynamicWorkspacesCount})</span>
              </label>
              <input
                type="text"
                value={workspacesOverride}
                onChange={(e) => setWorkspacesOverride(e.target.value)}
                placeholder={`Auto (${dynamicWorkspacesCount})`}
                className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-3 py-1.5 font-mono text-xs text-[var(--os-fg)] focus:border-[var(--os-accent)] focus:outline-none"
              />
            </div>

            <div>
              <label className="label mb-1 block text-xs">
                Applications Override <span className="text-[var(--os-fg-faint)]">(Live: {dynamicAppsCount})</span>
              </label>
              <input
                type="text"
                value={appsOverride}
                onChange={(e) => setAppsOverride(e.target.value)}
                placeholder={`Auto (${dynamicAppsCount})`}
                className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-3 py-1.5 font-mono text-xs text-[var(--os-fg)] focus:border-[var(--os-accent)] focus:outline-none"
              />
            </div>

            <div>
              <label className="label mb-1 block text-xs">
                Projects Override <span className="text-[var(--os-fg-faint)]">(Live: {dynamicProjectsCount})</span>
              </label>
              <input
                type="text"
                value={projectsOverride}
                onChange={(e) => setProjectsOverride(e.target.value)}
                placeholder={`Auto (${dynamicProjectsCount})`}
                className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-3 py-1.5 font-mono text-xs text-[var(--os-fg)] focus:border-[var(--os-accent)] focus:outline-none"
              />
            </div>

            <div>
              <label className="label mb-1 block text-xs">Mission Count &amp; Label</label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={missionCount}
                  onChange={(e) => setMissionCount(e.target.value)}
                  placeholder="1"
                  className="w-14 rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-2.5 py-1.5 font-mono text-xs text-[var(--os-fg)] focus:border-[var(--os-accent)] focus:outline-none"
                />
                <input
                  type="text"
                  value={missionLabel}
                  onChange={(e) => setMissionLabel(e.target.value)}
                  placeholder="Mission"
                  className="flex-1 rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-2.5 py-1.5 text-xs text-[var(--os-fg)] focus:border-[var(--os-accent)] focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Display Options ── */}
        <div className="border-t border-[var(--os-line)] pt-4">
          <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--os-fg-muted)] hover:text-[var(--os-fg)]">
            <input
              type="checkbox"
              checked={showOnAllWorkspaces}
              onChange={(e) => setShowOnAllWorkspaces(e.target.checked)}
              className="accent-[var(--os-accent)]"
            />
            <span>Show on all workspaces (default: Workspace 0 &quot;Home&quot; only)</span>
          </label>
        </div>

        {/* ── Save Action ── */}
        <div className="flex items-center justify-end border-t border-[var(--os-line)] pt-4">
          <button
            type="submit"
            disabled={saving}
            className="pressable rounded-[var(--os-r-chip)] bg-[var(--os-accent)] px-4 py-2 text-xs font-medium text-[var(--os-accent-fg)] hover:opacity-95 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Hero Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
