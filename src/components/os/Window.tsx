"use client";

import { useCallback, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { useOS, type WinState } from "@/lib/store";
import { Icon } from "./Icon";

const TASKBAR = 48;

export function Window({
  win,
  children,
}: {
  win: WinState;
  children: React.ReactNode;
}) {
  const { focus, close, minimize, toggleMax, move, resize, topZ } = useOS();
  const active = win.z === topZ;
  const ref = useRef<HTMLDivElement>(null);

  /* ── dragging by the titlebar ──
     Pointer capture keeps the drag alive even when the cursor outruns the
     window, and we write transform-adjacent state only — never layout. */
  const drag = useRef<{ dx: number; dy: number } | null>(null);

  const onTitlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (win.maximized) return;
      if ((e.target as HTMLElement).closest("[data-nodrag]")) return;
      focus(win.id);
      drag.current = { dx: e.clientX - win.x, dy: e.clientY - win.y };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      document.body.classList.add("dragging");
    },
    [focus, win.id, win.maximized, win.x, win.y]
  );

  const onTitlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!drag.current) return;
      const maxX = window.innerWidth - 80;
      const maxY = window.innerHeight - TASKBAR - 34;
      move(
        win.id,
        Math.min(maxX, Math.max(-win.w + 120, e.clientX - drag.current.dx)),
        Math.min(maxY, Math.max(0, e.clientY - drag.current.dy))
      );
    },
    [move, win.id, win.w]
  );

  const endDrag = useCallback((e: React.PointerEvent) => {
    drag.current = null;
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
    document.body.classList.remove("dragging");
  }, []);

  /* ── resize from the bottom-right corner ── */
  const rz = useRef<{ x: number; y: number; w: number; h: number } | null>(null);

  const onResizeDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    focus(win.id);
    rz.current = { x: e.clientX, y: e.clientY, w: win.w, h: win.h };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    document.body.classList.add("dragging");
  };
  const onResizeMove = (e: React.PointerEvent) => {
    if (!rz.current) return;
    resize(win.id, rz.current.w + (e.clientX - rz.current.x), rz.current.h + (e.clientY - rz.current.y));
  };

  /* ── keyboard: Escape closes the focused window (§20) ── */
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !(e.target as HTMLElement)?.closest("input,textarea")) {
        close(win.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, close, win.id]);

  const bounds = () => ({
    w: window.innerWidth,
    h: window.innerHeight - TASKBAR,
  });

  return (
    <motion.div
      ref={ref}
      role="dialog"
      aria-label={win.title}
      aria-modal={false}
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{
        // exit faster than enter — the system should feel eager to get out of the way
        duration: 0.22,
        ease: [0.23, 1, 0.32, 1],
      }}
      onPointerDown={() => focus(win.id)}
      style={{
        left: win.x,
        top: win.y,
        width: win.w,
        height: win.h,
        zIndex: win.z,
        display: win.minimized ? "none" : undefined,
      }}
      className="pointer-events-auto absolute flex flex-col overflow-hidden rounded-[var(--os-r-window)] bg-[var(--os-surface-1)] shadow-[var(--os-shadow-window)]"
    >
      {/* titlebar */}
      <div
        onPointerDown={onTitlePointerDown}
        onPointerMove={onTitlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDoubleClick={() => toggleMax(win.id, bounds())}
        className={`flex h-[var(--os-titlebar-h)] shrink-0 items-center gap-2 border-b border-[var(--os-line)] px-3 ${
          win.maximized ? "" : "cursor-grab"
        } ${active ? "bg-[var(--os-surface-2)]" : "bg-[var(--os-surface-1)]"}`}
      >
        {/* active-window indicator — one of the few places the accent appears */}
        <span
          className={`h-1.5 w-1.5 shrink-0 rounded-full transition-colors duration-150 ${
            active ? "bg-[var(--os-accent)]" : "bg-[var(--os-fg-faint)]"
          }`}
        />
        <span
          className={`truncate text-xs font-medium ${
            active ? "text-[var(--os-fg)]" : "text-[var(--os-fg-muted)]"
          }`}
        >
          {win.title}
        </span>

        <div data-nodrag className="ml-auto flex items-center gap-0.5">
          <ChromeBtn label="Minimize" onClick={() => minimize(win.id)} icon="min" />
          <ChromeBtn
            label={win.maximized ? "Restore" : "Maximize"}
            onClick={() => toggleMax(win.id, bounds())}
            icon={win.maximized ? "restore" : "max"}
          />
          <ChromeBtn label="Close" onClick={() => close(win.id)} icon="close" danger />
        </div>
      </div>

      {/* body */}
      <div className="min-h-0 flex-1 overflow-auto">{children}</div>

      {/* resize grip */}
      {!win.maximized && (
        <div
          onPointerDown={onResizeDown}
          onPointerMove={onResizeMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className="absolute bottom-0 right-0 h-4 w-4 cursor-nwse-resize"
          aria-hidden="true"
        >
          <svg viewBox="0 0 16 16" className="h-full w-full text-[var(--os-fg-faint)]">
            <path d="M15 6 6 15M15 11l-4 4" stroke="currentColor" strokeWidth="1.2" fill="none" />
          </svg>
        </div>
      )}
    </motion.div>
  );
}

function ChromeBtn({
  label,
  onClick,
  icon,
  danger,
}: {
  label: string;
  onClick: () => void;
  icon: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`grid h-6 w-6 place-items-center rounded-[3px] text-[var(--os-fg-muted)] transition-colors duration-150 hover:text-[var(--os-fg)] ${
        danger ? "hover:bg-[var(--os-crit)] hover:text-white" : "hover:bg-[var(--os-surface-4)]"
      }`}
    >
      <Icon name={icon} size={13} strokeWidth={1.6} />
    </button>
  );
}
