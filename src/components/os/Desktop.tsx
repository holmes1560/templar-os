"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useOS } from "@/lib/store";
import { WORKSPACES } from "@/lib/apps";
import { useDesktopApps } from "./PortfolioProvider";
import type { PublicApp } from "@/lib/portfolio-types";
import { Icon } from "./Icon";

/* ── grid geometry ────────────────────────────────────────────────
   Icons occupy cells, not pixels — the way Windows and most Linux
   desktops behave. Positions are stored as a cell index, so a layout
   survives a resize and can later be persisted as a plain integer
   rather than coordinates that only make sense at one viewport size. */

const CELL_W = 100;
const CELL_H = 96;
const PAD_X = 16;
const PAD_Y = 16;
const TASKBAR = 48;

function rowsPerColumn(viewportH: number) {
  return Math.max(1, Math.floor((viewportH - TASKBAR - PAD_Y * 2) / CELL_H));
}

/** cell index → pixel position, filling top-to-bottom then left-to-right */
function cellToXY(cell: number, rows: number) {
  return {
    x: PAD_X + Math.floor(cell / rows) * CELL_W,
    y: PAD_Y + (cell % rows) * CELL_H,
  };
}

/** nearest cell to a dropped pixel position */
function xyToCell(x: number, y: number, rows: number) {
  const col = Math.max(0, Math.round((x - PAD_X) / CELL_W));
  const row = Math.min(rows - 1, Math.max(0, Math.round((y - PAD_Y) / CELL_H)));
  return col * rows + row;
}

export function Desktop() {
  const workspace = useOS((s) => s.workspace);
  const openApp = useOS((s) => s.openApp);
  const notify = useOS((s) => s.notify);
  const setLauncher = useOS((s) => s.setLauncher);
  const setPhase = useOS((s) => s.setPhase);

  // §8/§24: the desktop knows nothing project-specific — only generic
  // application metadata, whatever the database happens to contain.
  const apps = useDesktopApps(workspace);

  const [rows, setRows] = useState(6);
  const [cells, setCells] = useState<Record<string, number>>({});
  const [sel, setSel] = useState<string | null>(null);

  useEffect(() => {
    const measure = () => setRows(rowsPerColumn(window.innerHeight));
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // lay each workspace out in reading order the first time it's shown
  useEffect(() => {
    setCells((prev) => {
      const next = { ...prev };
      apps.forEach((a) => { if (next[a.appKey] === undefined) next[a.appKey] = a.cell; });
      return next;
    });
  }, [apps]);

  /** drop an icon on a cell, pushing to the next free one if taken */
  const place = useCallback((id: string, wanted: number) => {
    setCells((prev) => {
      const taken = new Set(
        Object.entries(prev).filter(([k]) => k !== id).map(([, v]) => v)
      );
      let cell = Math.max(0, wanted);
      while (taken.has(cell)) cell++;
      return { ...prev, [id]: cell };
    });
  }, []);

  const launch = useCallback(
    (app: PublicApp) => {
      // launch behaviour is configuration, not code (§5)
      if (app.appKey === "webview") { setPhase("web"); return; }

      if (app.launchMode === "external" && app.url) {
        window.open(app.url, "_blank", "noopener,noreferrer");
        notify({ title: "Opened externally", body: app.name });
        return;
      }

      openApp(app.appKey, {
        title: app.name,
        w: app.width,
        h: app.height,
        props: { url: app.url, name: app.name, projectSlug: app.projectSlug, launchMode: app.launchMode },
      });
    },
    [openApp, notify, setPhase]
  );

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) { setSel(null); setLauncher(false); }
      }}
    >
      <div className="os-grid pointer-events-none absolute inset-0 opacity-60" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_0%,var(--os-accent-wash),transparent_55%)]" />

      <div className="pointer-events-none absolute bottom-16 right-8 select-none text-right">
        <div className="font-mono text-[3.5rem] font-semibold leading-none text-[var(--os-fg)] opacity-[0.045]">
          {String(workspace + 1).padStart(2, "0")}
        </div>
        <div className="label mt-1 opacity-50">{WORKSPACES[workspace]?.name}</div>
      </div>

      {apps.map((app) => (
        <DesktopIcon
          key={app.appKey}
          app={app}
          xy={cellToXY(cells[app.appKey] ?? app.cell, rows)}
          selected={sel === app.appKey}
          onSelect={() => setSel(app.appKey)}
          onDrop={(x, y) => place(app.appKey, xyToCell(x, y, rows))}
          onOpen={() => launch(app)}
        />
      ))}
    </div>
  );
}

function DesktopIcon({
  app, xy, selected, onSelect, onDrop, onOpen,
}: {
  app: PublicApp;
  xy: { x: number; y: number };
  selected: boolean;
  onSelect: () => void;
  onDrop: (x: number, y: number) => void;
  onOpen: () => void;
}) {
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  const moved = useRef(false);
  // while dragging the icon follows the pointer freely; on release it snaps
  const [ghost, setGhost] = useState<{ x: number; y: number } | null>(null);
  // a double-click fires two clicks — the second must not re-trigger a launch
  const lastOpen = useRef(0);

  const open = () => {
    const now = Date.now();
    if (now - lastOpen.current < 400) return;  // swallow the second click
    lastOpen.current = now;
    onOpen();
  };

  const at = ghost ?? xy;

  return (
    <button
      type="button"
      style={{ left: at.x, top: at.y, width: CELL_W - 4, height: CELL_H - 4 }}
      className={`absolute flex flex-col items-center justify-center gap-2 rounded-[var(--os-r-panel)] border p-2 text-center ${
        ghost ? "z-10" : "transition-[left,top] duration-150 ease-[var(--os-ease-out)]"
      } ${
        selected
          ? "border-[var(--os-accent)] bg-[var(--os-accent-wash)]"
          : "border-transparent hover:bg-[var(--os-surface-2)]/70"
      }`}
      onPointerDown={(e) => {
        onSelect();
        moved.current = false;
        drag.current = { dx: e.clientX - xy.x, dy: e.clientY - xy.y };
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!drag.current) return;
        const nx = e.clientX - drag.current.dx;
        const ny = e.clientY - drag.current.dy;
        if (!moved.current && Math.abs(nx - xy.x) < 5 && Math.abs(ny - xy.y) < 5) return;
        moved.current = true;
        setGhost({ x: Math.max(0, nx), y: Math.max(0, ny) });
      }}
      onPointerUp={(e) => {
        try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
        drag.current = null;
        if (moved.current && ghost) onDrop(ghost.x, ghost.y);
        setGhost(null);
      }}
      // single click and double click do the same thing: open it once
      onClick={() => { if (!moved.current) open(); }}
      onDoubleClick={(e) => { e.preventDefault(); }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
      }}
      aria-label={`${app.name}${app.launchMode === "external" ? " (opens in a new tab)" : ""}`}
    >
      <span className="text-[var(--os-fg-muted)] pointer-events-none">
        <Icon name={app.icon} size={26} strokeWidth={1.4} />
      </span>
      <span className="pointer-events-none line-clamp-2 text-[0.7rem] leading-tight text-[var(--os-fg)]">
        {app.name}
      </span>
    </button>
  );
}
