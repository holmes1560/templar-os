"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useOS } from "@/lib/store";
import { WORKSPACES } from "@/lib/apps";
import { Entry } from "./Entry";
import { Desktop } from "./Desktop";
import { Taskbar } from "./Taskbar";
import { Window } from "./Window";
import { MobileShell } from "./MobileShell";
import { AppHost } from "../apps";
import { Icon } from "./Icon";

/** Below this we switch shells entirely rather than shrinking the desktop (§18). */
const MOBILE_BP = 768;

function useIsMobile() {
  const [m, setM] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BP - 1}px)`);
    const on = () => setM(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return m;
}

export function Shell() {
  const phase = useOS((s) => s.phase);
  const setPhase = useOS((s) => s.setPhase);
  const windows = useOS((s) => s.windows);
  const workspace = useOS((s) => s.workspace);
  const setWorkspace = useOS((s) => s.setWorkspace);
  const isMobile = useIsMobile();

  /* The portfolio is a real, scrollable document sitting underneath. While
     the OS covers it, that scroll has to be locked — otherwise a wheel
     gesture over the desktop silently moves a page nobody can see.

     The same flag lifts the curtain: Web View is the one state where the
     document below is meant to be seen. */
  useEffect(() => {
    const showingWeb = phase === "web";
    document.body.style.overflow = showingWeb ? "" : "hidden";
    document.documentElement.dataset.os = showingWeb ? "web" : "shell";
    return () => {
      document.body.style.overflow = "";
      delete document.documentElement.dataset.os;
    };
  }, [phase]);

  /* ── global keyboard shortcuts (§8, §20) ── */
  useEffect(() => {
    if (phase !== "desktop") return;
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.closest("input,textarea");
      if (typing) return;

      // Ctrl/Cmd + 1..4 switches workspace
      if ((e.ctrlKey || e.metaKey) && /^[1-4]$/.test(e.key)) {
        e.preventDefault();
        setWorkspace(Number(e.key) - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, setWorkspace]);

  // web view is rendered by the page underneath — the OS simply gets out of the way
  if (phase === "web") {
    return (
      <button
        onClick={() => setPhase("desktop")}
        className="pressable fixed bottom-4 right-4 z-[80] flex items-center gap-2 rounded-full border border-[var(--os-line-strong)] bg-[var(--os-surface-1)] px-4 py-2.5 text-xs font-medium text-[var(--os-fg)] shadow-[var(--os-shadow-popover)]"
      >
        <Icon name="grid" size={14} />
        Back to {` `}TEMPLAR OS
      </button>
    );
  }

  if (phase !== "desktop") {
    // opaque in its own right, so boot → lock → login never reveals the
    // document underneath while one screen fades out and the next fades in
    return (
      <div className="fixed inset-0 z-[70] bg-[var(--os-ground)]">
        <Entry />
      </div>
    );
  }

  if (isMobile === null) return <div className="fixed inset-0 z-[70] bg-[var(--os-ground)]" />;
  if (isMobile) return <MobileShell />;

  const here = windows.filter((w) => w.workspace === workspace);

  return (
    <div className="fixed inset-0 z-[70] overflow-hidden bg-[var(--os-ground)]">
      {/* workspace transition: the whole desktop slides, so switching reads
          as moving sideways through a space rather than a cut */}
      <AnimatePresence mode="wait">
        <motion.div
          key={workspace}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          className="absolute inset-x-0 bottom-[var(--os-taskbar-h)] top-0"
        >
          <Desktop />
        </motion.div>
      </AnimatePresence>

      {/* Windows sit above the desktop but below the taskbar. The layer spans
          the whole desktop, so it must not accept pointer events itself —
          otherwise it swallows every click meant for a desktop icon, even
          when no windows are open. Each window re-enables them for itself. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[var(--os-taskbar-h)] top-0">
        <AnimatePresence>
          {here.map((w) => (
            <Window key={w.id} win={w}>
              <AppHost appId={w.appId} props={w.props} />
            </Window>
          ))}
        </AnimatePresence>
      </div>

      <Taskbar />
      <Notifications />
    </div>
  );
}

/* ──────────────────────────  notifications  ──────────────────────── */

export function Notifications() {
  const notices = useOS((s) => s.notices);
  const dismiss = useOS((s) => s.dismiss);

  return (
    <div className="pointer-events-none absolute bottom-[calc(var(--os-taskbar-h)+12px)] right-3 z-[75] flex w-[min(20rem,calc(100vw-1.5rem))] flex-col gap-2">
      <AnimatePresence initial={false}>
        {notices.map((n) => (
          <motion.div
            key={n.id}
            layout
            initial={{ opacity: 0, x: 16, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 16, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            className="pointer-events-auto overflow-hidden rounded-[var(--os-r-panel)] border border-[var(--os-line)] bg-[var(--os-surface-2)] shadow-[var(--os-shadow-popover)]"
          >
            <button onClick={() => dismiss(n.id)} className="flex w-full gap-2.5 p-3 text-left">
              <span
                className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                  n.tone === "ok" ? "bg-[var(--os-ok)]"
                  : n.tone === "warn" ? "bg-[var(--os-warn)]"
                  : "bg-[var(--os-accent)]"
                }`}
              />
              <span className="min-w-0">
                <span className="block text-xs font-medium text-[var(--os-fg)]">{n.title}</span>
                {n.body && (
                  <span className="mt-0.5 block text-[0.7rem] leading-relaxed text-[var(--os-fg-muted)]">
                    {n.body}
                  </span>
                )}
              </span>
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export { WORKSPACES };
