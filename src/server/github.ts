import "server-only";

import { db } from "@/lib/db";
import { encryptSecret, decryptSecret } from "./crypto";

/**
 * GitHub App integration.
 *
 * Every secret stays here, on the server. Nothing in this module may be
 * imported by a client component — the token would end up in the browser
 * bundle, which is exactly the failure §3 exists to prevent.
 *
 * The integration is entirely optional: with no app configured, the admin
 * panel reports "not configured" and every other feature keeps working (§22).
 */

const API = "https://api.github.com";
const UA = "templar-os-portfolio";

export interface GitHubConfig {
  appId: string;
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
}

/** null when the app hasn't been registered yet — never throws */
export function githubConfig(): GitHubConfig | null {
  const appId = process.env.GITHUB_APP_ID;
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const callbackUrl = process.env.GITHUB_CALLBACK_URL;

  if (!appId || !clientId || !clientSecret || !callbackUrl) return null;
  return { appId, clientId, clientSecret, callbackUrl };
}

export function isConfigured() {
  return githubConfig() !== null;
}

/* ───────────────────────── authorization ───────────────────────── */

export function authorizeUrl(state: string): string | null {
  const cfg = githubConfig();
  if (!cfg) return null;

  const u = new URL("https://github.com/login/oauth/authorize");
  u.searchParams.set("client_id", cfg.clientId);
  u.searchParams.set("redirect_uri", cfg.callbackUrl);
  // The App's installation decides which repositories are visible, so no
  // scope list is requested here — permissions were fixed at registration.
  u.searchParams.set("state", state);
  return u.toString();
}

interface TokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

export async function exchangeCode(code: string): Promise<
  { ok: true; token: string; refresh?: string; expiresAt?: Date } | { ok: false; error: string }
> {
  const cfg = githubConfig();
  if (!cfg) return { ok: false, error: "GitHub is not configured." };

  let res: Response;
  try {
    res = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", "User-Agent": UA },
      body: JSON.stringify({
        client_id: cfg.clientId,
        client_secret: cfg.clientSecret,
        code,
        redirect_uri: cfg.callbackUrl,
      }),
      cache: "no-store",
    });
  } catch {
    return { ok: false, error: "Could not reach GitHub." };
  }

  if (!res.ok) return { ok: false, error: `GitHub returned ${res.status}.` };

  const data = (await res.json()) as TokenResponse;
  if (data.error || !data.access_token) {
    return { ok: false, error: data.error_description ?? data.error ?? "No token returned." };
  }

  return {
    ok: true,
    token: data.access_token,
    refresh: data.refresh_token,
    expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined,
  };
}

/* ───────────────────────── connection state ────────────────────── */

export async function getConnection() {
  return db.gitHubConnection.findFirst({ orderBy: { createdAt: "desc" } });
}

/** Public-safe view: everything the UI needs, never the token. */
export async function connectionStatus() {
  if (!isConfigured()) return { state: "unconfigured" as const };

  const c = await getConnection();
  if (!c) return { state: "disconnected" as const };
  if (c.invalidatedAt) {
    return { state: "invalid" as const, login: c.accountLogin, avatarUrl: c.avatarUrl };
  }
  return {
    state: "connected" as const,
    login: c.accountLogin,
    avatarUrl: c.avatarUrl,
    connectedAt: c.createdAt,
  };
}

export async function saveConnection(input: {
  token: string; refresh?: string; expiresAt?: Date;
  accountLogin: string; accountId: bigint; avatarUrl?: string;
}) {
  // one connection at a time — reconnecting replaces rather than accumulates
  await db.gitHubConnection.deleteMany({});
  return db.gitHubConnection.create({
    data: {
      accountLogin: input.accountLogin,
      accountId: input.accountId,
      avatarUrl: input.avatarUrl ?? null,
      accessTokenEnc: encryptSecret(input.token),
      refreshTokenEnc: input.refresh ? encryptSecret(input.refresh) : null,
      expiresAt: input.expiresAt ?? null,
      scopes: [],
    },
  });
}

export async function disconnect() {
  // Deletes the credential only. Projects, applications and their GitHub
  // metadata all survive — disconnecting removes the ability to import and
  // sync, nothing else (§21).
  await db.gitHubConnection.deleteMany({});
}

async function markInvalid() {
  const c = await getConnection();
  if (c && !c.invalidatedAt) {
    await db.gitHubConnection.update({ where: { id: c.id }, data: { invalidatedAt: new Date() } });
  }
}

/* ──────────────────────────── API calls ────────────────────────── */

export type GhResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; needsReauth?: boolean };

async function call<T>(path: string, init?: RequestInit): Promise<GhResult<T>> {
  const conn = await getConnection();
  if (!conn) return { ok: false, error: "GitHub is not connected.", needsReauth: true };

  const token = decryptSecret(conn.accessTokenEnc);
  if (!token) {
    // key rotated or row corrupted — ask for reauthorization, don't crash
    await markInvalid();
    return { ok: false, error: "Stored GitHub credential could not be read.", needsReauth: true };
  }

  let res: Response;
  try {
    res = await fetch(`${API}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": UA,
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
    });
  } catch {
    return { ok: false, error: "Could not reach GitHub." };
  }

  if (res.status === 401) {
    await markInvalid();
    return { ok: false, error: "GitHub authorization has expired.", needsReauth: true };
  }
  if (res.status === 403 && res.headers.get("x-ratelimit-remaining") === "0") {
    const reset = Number(res.headers.get("x-ratelimit-reset") ?? 0) * 1000;
    const mins = Math.max(1, Math.ceil((reset - Date.now()) / 60000));
    return { ok: false, error: `GitHub rate limit reached. Try again in ~${mins} min.` };
  }
  if (res.status === 404) return { ok: false, error: "Not found, or this app has no access to it." };
  if (!res.ok) return { ok: false, error: `GitHub returned ${res.status}.` };

  return { ok: true, data: (await res.json()) as T };
}

export interface GhUser { login: string; id: number; avatar_url: string }

/** Identify the account behind a freshly exchanged token. */
export async function fetchViewer(token: string): Promise<GhResult<GhUser>> {
  try {
    const res = await fetch(`${API}/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": UA,
      },
      cache: "no-store",
    });
    if (!res.ok) return { ok: false, error: `GitHub returned ${res.status}.` };
    return { ok: true, data: (await res.json()) as GhUser };
  } catch {
    return { ok: false, error: "Could not reach GitHub." };
  }
}

export interface GhRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  private: boolean;
  language: string | null;
  default_branch: string;
  updated_at: string;
  owner: { login: string };
}

/**
 * Metadata only — never repository contents (§5). Browsing the picker must
 * stay cheap, both in API budget and in what leaves GitHub.
 */
export async function listRepos(page = 1, perPage = 30) {
  return call<GhRepo[]>(
    `/user/repos?per_page=${perPage}&page=${page}&sort=updated&affiliation=owner,collaborator`
  );
}

export async function getRepo(owner: string, repo: string) {
  return call<GhRepo>(`/repos/${owner}/${repo}`);
}
