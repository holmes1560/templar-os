/**
 * Chooses which repository files are worth sending to the analyzer.
 *
 * §8: a repository must never be shipped wholesale. Most of a repo is noise —
 * dependencies, build output, lockfiles, binaries — and sending it would be
 * slow, expensive, and would crowd out the handful of files that actually
 * describe the project.
 *
 * Pure functions with no I/O, so the selection rules can be tested directly.
 */

export interface RepoEntry {
  path: string;
  /** GitHub tree API: "blob" for files, "tree" for directories */
  type: string;
  size?: number;
}

export interface SelectedFile {
  path: string;
  priority: number;
  reason: string;
}

/** Never fetched, whatever else matches. */
const DENY_DIRS = [
  "node_modules", ".git", ".next", "dist", "build", "out", "target",
  "vendor", "coverage", ".venv", "venv", "__pycache__", ".turbo",
  ".cache", "site-packages", ".pnpm-store", "bower_components",
];

const DENY_EXT = [
  // binaries and media: no textual signal, large
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".svg", ".pdf",
  ".zip", ".tar", ".gz", ".rar", ".7z", ".mp4", ".mov", ".mp3", ".wav",
  ".woff", ".woff2", ".ttf", ".eot", ".otf",
  ".stl", ".gcode", ".pcap", ".exe", ".dll", ".so", ".dylib", ".bin",
  ".pyc", ".class", ".jar", ".wasm", ".db", ".sqlite",
];

/** Lockfiles: huge, and they say nothing package.json doesn't say better. */
const DENY_EXACT = [
  "package-lock.json", "pnpm-lock.yaml", "yarn.lock", "bun.lockb",
  "poetry.lock", "Cargo.lock", "composer.lock", "Gemfile.lock",
];

/** Highest-signal files first — the budget is spent in this order. */
const PRIORITY: { test: RegExp; priority: number; reason: string }[] = [
  { test: /^readme(\.md|\.rst|\.txt)?$/i,        priority: 100, reason: "primary description" },
  { test: /^package\.json$/,                      priority: 95,  reason: "dependencies and scripts" },
  { test: /^(pyproject\.toml|requirements\.txt)$/i, priority: 95, reason: "python dependencies" },
  { test: /^(cargo\.toml|go\.mod|pom\.xml|build\.gradle)$/i, priority: 95, reason: "dependencies" },
  { test: /^dockerfile$/i,                        priority: 85,  reason: "deployment" },
  { test: /^docker-compose(\.\w+)?\.ya?ml$/i,     priority: 85,  reason: "services" },
  { test: /^\.env\.example$/i,                    priority: 80,  reason: "configuration surface" },
  { test: /^(next|vite|nuxt|astro|svelte)\.config\.\w+$/i, priority: 75, reason: "framework config" },
  { test: /^(tsconfig|angular|nest-cli)\.json$/i, priority: 70,  reason: "project config" },
  { test: /^prisma\/schema\.prisma$/i,            priority: 75,  reason: "data model" },
  { test: /^(architecture|design|contributing)\.md$/i, priority: 65, reason: "documentation" },
  { test: /^docs\/.+\.mdx?$/i,                    priority: 55,  reason: "documentation" },
  { test: /\.ino$/i,                              priority: 60,  reason: "firmware source" },
  { test: /^(src|app|lib)\/[^/]+\.(ts|tsx|js|jsx|py|go|rs|java)$/i, priority: 40, reason: "top-level source" },
];

const MAX_FILE_BYTES = 64 * 1024;   // a 64KB README is already generous
const MAX_TOTAL_BYTES = 256 * 1024; // total budget across all selected files
const MAX_FILES = 18;

function isDenied(path: string): boolean {
  const lower = path.toLowerCase();
  const segments = lower.split("/");

  if (segments.some((s) => DENY_DIRS.includes(s))) return true;
  if (DENY_EXACT.includes(segments[segments.length - 1])) return true;
  if (DENY_EXT.some((e) => lower.endsWith(e))) return true;
  // anything buried deep is unlikely to be a project-level descriptor
  if (segments.length > 4) return true;

  return false;
}

/**
 * Ranks and truncates a repository tree to a curated set.
 * Returns files in the order they should be fetched.
 */
export function selectFiles(tree: RepoEntry[]): SelectedFile[] {
  const scored: (SelectedFile & { size: number })[] = [];

  for (const entry of tree) {
    if (entry.type !== "blob") continue;
    if (isDenied(entry.path)) continue;
    if ((entry.size ?? 0) > MAX_FILE_BYTES) continue;

    const lower = entry.path.toLowerCase();
    const match = PRIORITY.find((p) => p.test.test(lower));
    if (!match) continue;

    scored.push({
      path: entry.path,
      priority: match.priority,
      reason: match.reason,
      size: entry.size ?? 0,
    });
  }

  scored.sort((a, b) => b.priority - a.priority || a.path.length - b.path.length);

  const picked: SelectedFile[] = [];
  let budget = 0;

  for (const f of scored) {
    if (picked.length >= MAX_FILES) break;
    if (budget + f.size > MAX_TOTAL_BYTES) continue; // skip, don't stop — a
    budget += f.size;                                // big file shouldn't
    picked.push({ path: f.path, priority: f.priority, reason: f.reason });
  }                                                  // block smaller ones

  return picked;
}

export const LIMITS = { MAX_FILE_BYTES, MAX_TOTAL_BYTES, MAX_FILES };
