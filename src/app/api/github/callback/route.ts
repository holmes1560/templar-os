import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { getSession, audit } from "@/server/auth";
import { exchangeCode, fetchViewer, saveConnection } from "@/server/github";

export const dynamic = "force-dynamic";

const STATE_COOKIE = "gh_oauth_state";

function settings(req: NextRequest, params: Record<string, string>) {
  const url = new URL("/admin/settings", req.nextUrl.origin);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return NextResponse.redirect(url);
}

/**
 * Completes the GitHub authorization flow.
 *
 * Nothing here trusts the incoming request: the admin session is re-checked,
 * the CSRF state must match the cookie set when the flow started, and the
 * code is exchanged server-side so the token never touches the browser.
 *
 * Every failure lands back on the settings page with a readable message
 * rather than an error page (§22).
 */
export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.redirect(new URL("/admin/login", req.nextUrl.origin));

  const jar = await cookies();
  const expected = jar.get(STATE_COOKIE)?.value;
  jar.delete(STATE_COOKIE); // single use, whatever the outcome

  const url = req.nextUrl;
  const error = url.searchParams.get("error");
  if (error) {
    await audit(user.id, "github.authorize_denied", "GitHubConnection", undefined, { error });
    return settings(req, { github: "denied" });
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state || !expected) return settings(req, { github: "bad_request" });

  // constant-time compare, same as any other secret comparison
  const a = Buffer.from(state);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    await audit(user.id, "github.state_mismatch", "GitHubConnection");
    return settings(req, { github: "state_mismatch" });
  }

  const exchanged = await exchangeCode(code);
  if (!exchanged.ok) {
    await audit(user.id, "github.exchange_failed", "GitHubConnection", undefined, { error: exchanged.error });
    return settings(req, { github: "exchange_failed" });
  }

  const viewer = await fetchViewer(exchanged.token);
  if (!viewer.ok) return settings(req, { github: "identify_failed" });

  await saveConnection({
    token: exchanged.token,
    refresh: exchanged.refresh,
    expiresAt: exchanged.expiresAt,
    accountLogin: viewer.data.login,
    accountId: BigInt(viewer.data.id),
    avatarUrl: viewer.data.avatar_url,
  });

  await audit(user.id, "github.connected", "GitHubConnection", undefined, { login: viewer.data.login });
  return settings(req, { github: "connected" });
}
