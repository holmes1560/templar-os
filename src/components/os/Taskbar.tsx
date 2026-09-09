"use client";

import { useEffect, useState } from "react";
import { useOS } from "@/lib/store";
import { WORKSPACES } from "@/lib/apps";
import { useApps, useApp } from "./PortfolioProvider";
import { site } from "@/lib/site";
import { Icon } from "./Icon";

export function Taskbar() {
  const {
    windows, workspace, setWorkspace, restore, minimize, focus,
    topZ, launcherOpen, setLauncher, setPhase,
  } = useOS();

  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 10_000);
    return () => clearInterval(t);
  }, []);

  const here = windows.filter((w) => w.workspace === workspace);

  return (
    <>
      {launcherOpen && <Launcher />}

      <div className="absolute inset-x-0 bottom-0 z-[60] flex h-[var(--os-taskbar-h)] items-center gap-1 border-t border-[var(--os-line)] bg-[var(--os-surface-1)]/95 px-2 backdrop-blur-xl">
        {/* launcher */}
        <button
          type="button"
          onClick={() => setLauncher(!launcherOpen)}
          aria-label="Open app launcher"
          aria-expanded={launcherOpen}
          className={`pressable grid h-9 w-9 place-items-center rounded-[var(--os-r-chip)] transition-colors ${
            launcherOpen
              ? "bg-[var(--os-accent)] text-[var(--os-accent-fg)]"
              : "text-[var(--os-fg-muted)] hover:bg-[var(--os-surface-3)]"
          }`}
        >
          <Icon name="grid" size={17} />
        </button>

        <div className="mx-1 h-5 w-px bg-[var(--os-line)]" />

        {/* workspaces (§8) */}
        <div className="flex items-center gap-0.5" role="tablist" aria-label="Workspaces">
          {WORKSPACES.map((ws) => {
            const on = ws.id === workspace;
            const count = windows.filter((w) => w.workspace === ws.id).length;
            return (
              <button
                key={ws.id}
                role="tab"
                aria-selected={on}
                onClick={() => setWorkspace(ws.id)}
                title={`${ws.name} — ${ws.hint}`}
                className={`pressable relative h-9 rounded-[var(--os-r-chip)] px-2.5 text-xs transition-colors ${
                  on
                    ? "bg-[var(--os-surface-3)] text-[var(--os-fg)]"
                    : "text-[var(--os-fg-faint)] hover:bg-[var(--os-surface-2)] hover:text-[var(--os-fg-muted)]"
                }`}
              >
                <span className="hidden sm:inline">{ws.name}</span>
                <span className="sm:hidden tnum">{ws.id + 1}</span>
                {count > 0 && (
                  <span className="absolute right-1 top-1.5 h-1 w-1 rounded-full bg-[var(--os-accent)]" />
                )}
              </button>
            );
          })}
        </div>

        <div className="mx-1 h-5 w-px bg-[var(--os-line)]" />

        {/* running windows on this workspace */}
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          {here.map((w) => {
            const active = w.z === topZ && !w.minimized;
            return (
              <button
                key={w.id}
                onClick={() => (w.minimized ? restore(w.id) : active ? minimize(w.id) : focus(w.id))}
                title={w.title}
                className={`pressable flex h-9 shrink-0 items-center gap-1.5 rounded-[var(--os-r-chip)] border px-2.5 text-xs transition-colors ${
                  active
                    ? "border-[var(--os-line-strong)] bg-[var(--os-surface-3)] text-[var(--os-fg)]"
                    : "border-transparent text-[var(--os-fg-muted)] hover:bg-[var(--os-surface-2)]"
                } ${w.minimized ? "opacity-55" : ""}`}
              >
                <TaskbarIcon appKey={w.appId} />
                <span className="hidden max-w-[9rem] truncate md:inline">{w.title}</span>
              </button>
            );
          })}
        </div>

        {/* tray */}
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={() => setPhase("web")}
            className="pressable hidden h-9 items-center gap-1.5 rounded-[var(--os-r-chip)] px-2.5 text-xs text-[var(--os-fg-muted)] transition-colors hover:bg-[var(--os-surface-3)] hover:text-[var(--os-fg)] sm:flex"
            title="Leave the OS for the plain scrollable site"
          >
            <Icon name="globe" size={14} />
            Web View
          </button>

          <div className="mx-1 hidden h-5 w-px bg-[var(--os-line)] sm:block" />

          <div
            className="tnum px-2 text-right font-mono text-[0.7rem] leading-tight text-[var(--os-fg-muted)]"
            suppressHydrationWarning
          >
            <div>{now ? now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "--:--"}</div>
            <div className="text-[0.6rem] text-[var(--os-fg-faint)]">
              {now ? now.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : ""}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────  app launcher  ────────────────────────── */

function TaskbarIcon({ appKey }: { appKey: string }) {
  const app = useApp(appKey);
  return <Icon name={app?.icon ?? "doc"} size={14} />;
}

function Launcher() {
  const { openApp, setLauncher, setWorkspace, notify, setPhase } = useOS();
  const [q, setQ] = useState("");
  const apps = useApps();

  const hits = apps.filter((a) =>
    a.name.toLowerCase().includes(q.trim().toLowerCase())
  );

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setLauncher(false); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [setLauncher]);

  return (
    <>
      <button
        className="absolute inset-0 z-[55] cursor-default"
        onClick={() => setLauncher(false)}
        aria-label="Close launcher"
        tabIndex={-1}
      />
      <div
        className="absolute bottom-[calc(var(--os-taskbar-h)+8px)] left-2 z-[61] w-[min(30rem,calc(100vw-1rem))] origin-bottom-left rounded-[var(--os-r-panel)] border border-[var(--os-line)] bg-[var(--os-surface-1)] p-3 shadow-[var(--os-shadow-popover)]"
        role="dialog"
        aria-label="Application launcher"
      >
        <div className="mb-3 flex items-center gap-2 rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-2.5">
          <span className="text-[var(--os-fg-faint)]"><Icon name="search" size={14} /></span>
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search applications"
            className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-[var(--os-fg-faint)]"
          />
        </div>

        <div className="grid max-h-[19rem] grid-cols-3 gap-1 overflow-auto sm:grid-cols-4">
          {hits.map((a) => (
            <button
              key={a.appKey}
              onClick={() => {
                if (a.appKey === "webview") { setLauncher(false); setPhase("web"); return; }
                if (a.launchMode === "external" && a.url) {
                  window.open(a.url, "_blank", "noopener,noreferrer");
                  notify({ title: "Opened externally", body: a.name });
                  setLauncher(false);
                  return;
                }
                setWorkspace(a.workspace);
                openApp(a.appKey, {
                  title: a.name, w: a.width, h: a.height,
                  props: { url: a.url, name: a.name, projectSlug: a.projectSlug, launchMode: a.launchMode },
                });
              }}
              className="pressable flex flex-col items-center gap-2 rounded-[var(--os-r-chip)] p-3 text-center transition-colors hover:bg-[var(--os-surface-3)]"
            >
              <span className="text-[var(--os-fg-muted)]"><Icon name={a.icon} size={22} strokeWidth={1.4} /></span>
              <span className="text-[0.68rem] leading-tight text-[var(--os-fg)]">{a.name}</span>
            </button>
          ))}
          {hits.length === 0 && (
            <p className="col-span-full px-2 py-6 text-center text-sm text-[var(--os-fg-faint)]">
              Nothing matches “{q}”.
            </p>
          )}
        </div>

        <div className="mt-3 border-t border-[var(--os-line)] pt-2.5 text-[0.65rem] text-[var(--os-fg-faint)]">
          {site.system} {site.systemVersion} · {apps.length} applications
        </div>
      </div>
    </>
  );
}
