import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSession, audit } from "@/server/auth";
import { authorizeUrl, isConfigured } from "@/server/github";

export const dynamic = "force-dynamic";

const STATE_COOKIE = "gh_oauth_state";

/**
 * Starts the GitHub authorization flow.
 *
 * Admin-only: without this check, anyone could trigger the flow and — with a
 * matching callback — attach *their* GitHub account to this portfolio.
 *
 * The `state` parameter is the CSRF defence. A random value is stored in an
 * httpOnly cookie and echoed back by GitHub; the callback refuses anything
 * that doesn't match, so a forged callback URL can't complete a connection.
 */
export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.redirect(new URL("/admin/login", process.env.GITHUB_CALLBACK_URL ?? "http://localhost:3100"));

  if (!isConfigured()) {
    return NextResponse.redirect(
      new URL("/admin/settings?github=unconfigured", process.env.GITHUB_CALLBACK_URL ?? "http://localhost:3100")
    );
  }

  const state = randomBytes(24).toString("base64url");
  const url = authorizeUrl(state)!;

  (await cookies()).set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax", // must survive the redirect back from github.com
    path: "/",
    maxAge: 600, // ten minutes is ample for an authorization round trip
  });

  await audit(user.id, "github.authorize_start", "GitHubConnection");
  return NextResponse.redirect(url);
}
