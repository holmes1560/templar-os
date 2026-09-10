import type { AppDef } from "./types";

/**
 * Workspaces (§8). Each one groups the apps that belong to a part of the
 * story, so switching desktops is narrative rather than decorative.
 */
export const WORKSPACES = [
  { id: 0, name: "Home", hint: "start here" },
  { id: 1, name: "Projects", hint: "the actual work" },
  { id: 2, name: "Cyber Lab", hint: "packets and terminals" },
  { id: 3, name: "Experiments", hint: "odds and ends" },
] as const;

export const APPS: AppDef[] = [
  // ── Home ─────────────────────────────────────────────
  { id: "about", title: "About Me", icon: "user", workspace: 0, size: { w: 720, h: 560 } },
  { id: "skills", title: "Skills", icon: "chart", workspace: 0, size: { w: 820, h: 580 } },
  { id: "resume", title: "Résumé", icon: "doc", workspace: 0, size: { w: 700, h: 620 } },
  { id: "contact", title: "Contact", icon: "mail", workspace: 0, size: { w: 560, h: 420 } },
  // not a window — it dismisses the OS and reveals the document underneath
  { id: "webview", title: "Web View", icon: "globe", workspace: 0, size: { w: 0, h: 0 }, action: "webview" },

  // ── Projects ─────────────────────────────────────────
  { id: "projects", title: "Projects", icon: "folder", workspace: 1, size: { w: 940, h: 620 } },
  { id: "timeline", title: "Timeline", icon: "timeline", workspace: 1, size: { w: 900, h: 580 } },
  { id: "files", title: "Files", icon: "files", workspace: 1, size: { w: 820, h: 560 } },
  { id: "github", title: "GitHub", icon: "github", workspace: 1, size: { w: 0, h: 0 }, externalUrl: "https://github.com/holmes1560" },

  // ── Cyber Lab ────────────────────────────────────────
  { id: "terminal", title: "Terminal", icon: "terminal", workspace: 2, size: { w: 760, h: 480 } },
  { id: "netmon", title: "Net Monitor", icon: "pulse", workspace: 2, size: { w: 720, h: 520 } },

  // ── Experiments ──────────────────────────────────────
  { id: "settings", title: "Settings", icon: "cog", workspace: 3, size: { w: 680, h: 520 } },
  { id: "notes", title: "Notes", icon: "note", workspace: 3, size: { w: 700, h: 520 } },
];

export function appById(id: string) {
  return APPS.find((a) => a.id === id);
}

export function appsForWorkspace(n: number) {
  return APPS.filter((a) => a.workspace === n);
}
