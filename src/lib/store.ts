"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type Phase = "boot" | "lock" | "login" | "desktop" | "web";

export interface WinState {
  id: string;
  appId: string;
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  minimized: boolean;
  maximized: boolean;
  workspace: number;
  /** restore geometry, stashed while maximized */
  prev?: { x: number; y: number; w: number; h: number };
  /** free-form payload, e.g. which project the Projects app should open on */
  props?: Record<string, unknown>;
}

export interface Notice {
  id: string;
  title: string;
  body?: string;
  tone?: "info" | "ok" | "warn";
}

export interface Settings {
  theme: "dark" | "light";
  accent: string;
  animations: boolean;
  sound: boolean;
  scale: number;
  wallpaper: string;
}

interface OSState {
  phase: Phase;
  hasBooted: boolean;
  windows: WinState[];
  workspace: number;
  topZ: number;
  notices: Notice[];
  launcherOpen: boolean;
  settings: Settings;

  setPhase: (p: Phase) => void;
  finishBoot: () => void;

  openApp: (appId: string, opts?: { title?: string; w?: number; h?: number; props?: Record<string, unknown> }) => void;
  close: (id: string) => void;
  focus: (id: string) => void;
  minimize: (id: string) => void;
  restore: (id: string) => void;
  toggleMax: (id: string, bounds: { w: number; h: number }) => void;
  move: (id: string, x: number, y: number) => void;
  resize: (id: string, w: number, h: number) => void;

  setWorkspace: (n: number) => void;
  moveToWorkspace: (id: string, n: number) => void;

  setLauncher: (open: boolean) => void;
  notify: (n: Omit<Notice, "id">) => void;
  dismiss: (id: string) => void;

  update: (s: Partial<Settings>) => void;
  reset: () => void;
}

const DEFAULT_SETTINGS: Settings = {
  theme: "dark",
  accent: "#6280ff",
  animations: true,
  sound: false,
  scale: 1,
  wallpaper: "grid",
};

/** Cascade new windows so they never land exactly on top of each other. */
function cascade(count: number, w: number, h: number) {
  const step = 28;
  const n = count % 6;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1440;
  const vh = typeof window !== "undefined" ? window.innerHeight : 900;
  return {
    x: Math.max(16, Math.round((vw - w) / 2) - 60 + n * step),
    y: Math.max(16, Math.round((vh - h) / 2) - 70 + n * step),
  };
}

let noticeSeq = 0;

export const useOS = create<OSState>()(
  persist(
    (set, get) => ({
      phase: "boot",
      hasBooted: false,
      windows: [],
      workspace: 0,
      topZ: 10,
      notices: [],
      launcherOpen: false,
      settings: DEFAULT_SETTINGS,

      setPhase: (phase) => set({ phase }),
      finishBoot: () => set({ hasBooted: true }),

      openApp: (appId, opts = {}) => {
        const { windows, workspace, topZ } = get();

        // already open on any workspace? focus it and go there instead
        const existing = windows.find((w) => w.appId === appId);
        if (existing) {
          set({
            workspace: existing.workspace,
            topZ: topZ + 1,
            windows: windows.map((w) =>
              w.id === existing.id
                ? { ...w, minimized: false, z: topZ + 1, props: opts.props ?? w.props }
                : w
            ),
          });
          return;
        }

        const w = opts.w ?? 760;
        const h = opts.h ?? 520;
        const { x, y } = cascade(windows.length, w, h);

        set({
          topZ: topZ + 1,
          launcherOpen: false,
          windows: [
            ...windows,
            {
              id: `${appId}-${Date.now()}`,
              appId,
              title: opts.title ?? appId,
              x, y, w, h,
              z: topZ + 1,
              minimized: false,
              maximized: false,
              workspace,
              props: opts.props,
            },
          ],
        });
      },

      close: (id) => set({ windows: get().windows.filter((w) => w.id !== id) }),

      focus: (id) => {
        const { topZ, windows } = get();
        const win = windows.find((w) => w.id === id);
        if (!win || win.z === topZ) return; // already on top — don't churn state
        set({
          topZ: topZ + 1,
          windows: windows.map((w) =>
            w.id === id ? { ...w, z: topZ + 1, minimized: false } : w
          ),
        });
      },

      minimize: (id) =>
        set({
          windows: get().windows.map((w) =>
            w.id === id ? { ...w, minimized: true } : w
          ),
        }),

      restore: (id) => {
        const { topZ, windows } = get();
        set({
          topZ: topZ + 1,
          windows: windows.map((w) =>
            w.id === id ? { ...w, minimized: false, z: topZ + 1 } : w
          ),
        });
      },

      toggleMax: (id, bounds) =>
        set({
          windows: get().windows.map((w) => {
            if (w.id !== id) return w;
            if (w.maximized) {
              const p = w.prev ?? { x: 60, y: 60, w: 760, h: 520 };
              return { ...w, ...p, maximized: false, prev: undefined };
            }
            return {
              ...w,
              prev: { x: w.x, y: w.y, w: w.w, h: w.h },
              x: 0,
              y: 0,
              w: bounds.w,
              h: bounds.h,
              maximized: true,
            };
          }),
        }),

      move: (id, x, y) =>
        set({
          windows: get().windows.map((w) => (w.id === id ? { ...w, x, y } : w)),
        }),

      resize: (id, w2, h2) =>
        set({
          windows: get().windows.map((w) =>
            w.id === id ? { ...w, w: Math.max(320, w2), h: Math.max(200, h2) } : w
          ),
        }),

      setWorkspace: (workspace) => set({ workspace, launcherOpen: false }),

      moveToWorkspace: (id, n) =>
        set({
          windows: get().windows.map((w) =>
            w.id === id ? { ...w, workspace: n } : w
          ),
        }),

      setLauncher: (launcherOpen) => set({ launcherOpen }),

      notify: (n) => {
        const id = `n${++noticeSeq}`;
        set({ notices: [...get().notices, { ...n, id }] });
        // auto-dismiss; §15 says subtle and not spammy
        setTimeout(() => {
          set({ notices: get().notices.filter((x) => x.id !== id) });
        }, 4200);
      },

      dismiss: (id) => set({ notices: get().notices.filter((n) => n.id !== id) }),

      update: (s) => {
        const settings = { ...get().settings, ...s };
        set({ settings });
        if (typeof document !== "undefined") {
          const root = document.documentElement;
          root.dataset.theme = settings.theme;
          // mirrored into a cookie so the server renders the right theme on
          // the next request — this is what prevents the flash
          document.cookie = `templar_theme=${settings.theme}; path=/; max-age=31536000; samesite=lax`;
          root.dataset.motion = settings.animations ? "on" : "off";
          root.style.setProperty("--os-accent", settings.accent);
        }
      },

      reset: () => set({ settings: DEFAULT_SETTINGS, windows: [], workspace: 0 }),
    }),
    {
      name: "templar-os",
      storage: createJSONStorage(() => localStorage),
      // only preferences survive a reload — never window geometry, which
      // would restore a desktop full of windows the visitor didn't open.
      partialize: (s) => ({
        settings: s.settings,
        hasBooted: s.hasBooted,
        theme: s.settings.theme,
        accent: s.settings.accent,
        animations: s.settings.animations,
      }),
    }
  )
);
