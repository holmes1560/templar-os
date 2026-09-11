"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useOS } from "@/lib/store";
import { WORKSPACES } from "@/lib/apps";
import { useDesktopApps, useApp } from "./PortfolioProvider";
import { openExternalUrl } from "@/lib/navigation";
import { site } from "@/lib/site";
import { AppHost } from "../apps";
import { Icon } from "./Icon";
import { Notifications } from "./Shell";

/**
 * §18 — a separate shell, sharing the same apps and the same store.
 * Windows become full-screen sheets, the dock becomes bottom navigation,
 * desktop icons become an app grid, and workspaces become swipeable pages.
 */
export function MobileShell() {
  const { workspace, setWorkspace, windows, openApp, close, setPhase, notify } = useOS();
  const [clock, setClock] = useState<Date | null>(null);

  useEffect(() => {
    setClock(new Date());
    const t = setInterval(() => setClock(new Date()), 10_000);
    return () => clearInterval(t);
  }, []);

  // on mobile only one app is ever in front
  const front = windows.filter((w) => !w.minimized).slice(-1)[0];
  const apps = useDesktopApps(workspace);

  return (
    <div className="fixed inset-0 z-[70] flex flex-col overflow-hidden bg-[var(--os-ground)]">
      {/* status bar */}
      <header className="flex shrink-0 items-center justify-between border-b border-[var(--os-line)] px-4 py-2">
        <span className="font-mono text-[0.65rem] tracking-[0.14em] text-[var(--os-fg-muted)]">
          {site.system}
        </span>
        <span className="tnum font-mono text-[0.7rem] text-[var(--os-fg-muted)]" suppressHydrationWarning>
          {clock ? clock.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "--:--"}
        </span>
      </header>

      {/* app grid */}
      <main className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
        <div className="mb-4">
          <h1 className="text-base font-semibold text-[var(--os-fg)]">
            {WORKSPACES[workspace]?.name}
          </h1>
          <p className="label mt-0.5">{WORKSPACES[workspace]?.hint}</p>
        </div>

        <div className="grid grid-cols-3 gap-2 xs:grid-cols-4">
          {apps.map((a) => (
            <button
              key={a.appKey}
              onClick={() => {
                if (a.appKey === "webview") { setPhase("web"); return; }
                if (a.launchMode === "external" && a.url) {
                  openExternalUrl(a.url);
                  notify({ title: "Opened externally", body: a.name });
                  return;
                }
                openApp(a.appKey, {
                  title: a.name, w: a.width, h: a.height,
                  props: { url: a.url, name: a.name, projectSlug: a.projectSlug, launchMode: a.launchMode },
                });
              }}
              className="pressable flex flex-col items-center gap-2 rounded-[var(--os-r-panel)] border border-[var(--os-line)] bg-[var(--os-surface-1)] px-2 py-4"
            >
              <span className="text-[var(--os-fg-muted)]">
                <Icon name={a.icon} size={24} strokeWidth={1.4} />
              </span>
              <span className="text-center text-[0.68rem] leading-tight text-[var(--os-fg)]">
                {a.name}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={() => setPhase("web")}
          className="pressable mt-6 flex w-full items-center justify-center gap-2 rounded-[var(--os-r-panel)] border border-[var(--os-line)] py-3 text-xs text-[var(--os-fg-muted)]"
        >
          <Icon name="globe" size={14} />
          Switch to the plain website
        </button>
      </main>

      {/* bottom nav = workspaces */}
      <nav
        className="flex shrink-0 items-stretch border-t border-[var(--os-line)] bg-[var(--os-surface-1)]"
        role="tablist"
        aria-label="Workspaces"
      >
        {WORKSPACES.map((ws) => {
          const on = ws.id === workspace;
          return (
            <button
              key={ws.id}
              role="tab"
              aria-selected={on}
              onClick={() => setWorkspace(ws.id)}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[0.62rem] transition-colors ${
                on ? "text-[var(--os-accent)]" : "text-[var(--os-fg-faint)]"
              }`}
            >
              <span className={`h-0.5 w-6 rounded-full transition-colors ${on ? "bg-[var(--os-accent)]" : "bg-transparent"}`} />
              {ws.name}
            </button>
          );
        })}
      </nav>

      {/* full-screen app sheet */}
      <AnimatePresence>
        {front && (
          <motion.div
            key={front.id}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            className="absolute inset-0 z-[78] flex flex-col bg-[var(--os-surface-1)]"
          >
            <div className="flex shrink-0 items-center gap-2 border-b border-[var(--os-line)] px-3 py-2.5">
              <button
                onClick={() => close(front.id)}
                className="pressable flex items-center gap-1.5 text-xs text-[var(--os-fg-muted)]"
                aria-label="Close application"
              >
                <span className="rotate-180"><Icon name="chevron" size={14} /></span>
                Back
              </button>
              <span className="mx-auto pr-12 text-xs font-medium text-[var(--os-fg)]">
                {front.title}
              </span>
            </div>
            <div className="min-h-0 flex-1 overflow-auto">
              <AppHost appId={front.appId} props={front.props} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Notifications />
    </div>
  );
}

