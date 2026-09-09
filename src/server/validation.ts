import { z } from "zod";

/**
 * Shared input validation. Nothing reaches the database without passing
 * through here (§21).
 */

/** Blocks anything that isn't a plain public http(s) URL. */
export const safeUrl = z
  .string()
  .trim()
  .max(2048)
  .refine((v) => {
    if (v === "") return true;
    let u: URL;
    try { u = new URL(v); } catch { return false; }

    // only http(s): rules out javascript:, data:, file:, gopher: …
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;

    // SSRF: the server will later fetch these for health checks, so refuse
    // anything pointing back at our own network before it is ever stored.
    const h = u.hostname.toLowerCase();
    if (
      h === "localhost" || h === "0.0.0.0" || h.endsWith(".localhost") ||
      h.endsWith(".internal") || h.endsWith(".local") ||
      /^127\./.test(h) ||
      /^10\./.test(h) ||
      /^192\.168\./.test(h) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(h) ||
      /^169\.254\./.test(h) ||          // link-local, incl. cloud metadata
      h === "[::1]" || h.startsWith("[fd") || h.startsWith("[fe80")
    ) return false;

    return true;
  }, "Must be a public http(s) URL")
  .transform((v) => (v === "" ? null : v));

export const slug = z
  .string().trim().min(1).max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers and hyphens only");

/** textarea → trimmed lines, blank lines dropped */
export const lines = z
  .string().max(20_000)
  .transform((v) => v.split("\n").map((s) => s.trim()).filter(Boolean));

/** comma-separated → trimmed list, duplicates removed, order preserved */
export const csv = z
  .string().max(4000)
  .transform((v) => [...new Set(v.split(",").map((s) => s.trim()).filter(Boolean))]);

export const CATEGORIES = ["WEB", "MOBILE", "CYBERSECURITY", "AI", "HARDWARE", "EXPERIMENTS"] as const;
export const STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export const VISIBILITIES = ["PUBLIC", "PRIVATE", "LOCAL"] as const;
export const LAUNCH_MODES = ["IFRAME", "EXTERNAL", "INTERNAL", "DEMO"] as const;

export const ProjectInput = z.object({
  name: z.string().trim().min(1).max(200),
  slug,
  shortDescription: z.string().trim().min(1).max(400),
  longDescription: z.string().trim().min(1).max(8000),
  category: z.enum(CATEGORIES),
  period: z.string().trim().max(100).optional().default(""),
  team: z.string().trim().max(200).optional().default(""),

  githubUrl: safeUrl.optional(),
  liveUrl: safeUrl.optional(),
  docsUrl: safeUrl.optional(),
  repoVisibility: z.enum(VISIBILITIES),

  hosted: z.coerce.boolean().default(false),
  featured: z.coerce.boolean().default(false),
  clientWork: z.coerce.boolean().default(false),
  status: z.enum(STATUSES),

  caveat: z.string().trim().max(1000).optional().default(""),
  technologies: csv,
  features: lines,
  challenges: lines,
  learned: lines,
  skills: csv,
});

export const ApplicationInput = z.object({
  appKey: z.string().trim().min(1).max(80).regex(/^[a-z0-9][a-z0-9-]*$/i, "Letters, numbers and hyphens"),
  name: z.string().trim().min(1).max(120),
  icon: z.string().trim().min(1).max(40),
  launchMode: z.enum(LAUNCH_MODES),
  url: safeUrl.optional(),
  projectId: z.string().trim().max(60).optional(),

  enabled: z.coerce.boolean().default(true),
  desktopVisible: z.coerce.boolean().default(true),
  workspace: z.coerce.number().int().min(0).max(9),
  cell: z.coerce.number().int().min(0).max(200),

  windowWidth: z.coerce.number().int().min(320).max(3000),
  windowHeight: z.coerce.number().int().min(200).max(2000),
  resizable: z.coerce.boolean().default(true),
  maximizable: z.coerce.boolean().default(true),
  minimizable: z.coerce.boolean().default(true),
});

/** HTML form checkboxes send "on" or nothing — normalise before parsing */
export function formBool(fd: FormData, key: string) {
  return fd.get(key) !== null;
}
