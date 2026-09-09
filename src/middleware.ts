import { NextResponse, type NextRequest } from "next/server";

/**
 * A cheap first gate, not the authorization boundary.
 *
 * Middleware runs on the edge runtime, so it has no database and no
 * node:crypto — it cannot verify a signature or confirm the account still
 * exists. All it does is bounce requests that carry no session cookie at all,
 * which keeps unauthenticated traffic off the admin routes.
 *
 * The real check is `requireAdmin()`, called by the admin layout and by every
 * server action. A forged cookie gets past this and is rejected there (§2).
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!req.cookies.get("templar_session")) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
