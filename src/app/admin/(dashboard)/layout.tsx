import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getSession, destroySession } from "@/server/auth";

/**
 * The authorization boundary for the admin dashboard.
 *
 * This runs on the server, on the Node runtime, with database access — so
 * unlike the middleware it can actually verify the session signature and
 * confirm the account still exists. Every admin page renders inside it, and
 * every mutation additionally calls requireAdmin() (§2, §21).
 *
 * It lives in the (dashboard) route group rather than at /admin so that
 * /admin/login sits *outside* the guard. A guard that wraps its own login
 * page redirects it to itself, forever.
 */

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

import { getPendingDraftsCount } from "@/server/drafts";
import { AdminNav } from "./AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, pendingDrafts] = await Promise.all([
    getSession(),
    getPendingDraftsCount(),
  ]);
  if (!user) redirect("/admin/login");

  async function signOut() {
    "use server";
    await destroySession();
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-[var(--os-ground)]">
      <header className="border-b border-[var(--os-line)] bg-[var(--os-surface-1)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-2.5">
          <div className="flex items-center gap-2">
            <span className="label font-mono font-semibold tracking-wider text-[var(--os-fg)]">
              TEMPLAR OS
            </span>
            <span className="rounded-[var(--os-r-chip)] bg-[var(--os-surface-3)] px-1.5 py-0.5 font-mono text-[0.6rem] text-[var(--os-accent)]">
              CMS
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="text-xs text-[var(--os-fg-faint)] transition-colors hover:text-[var(--os-fg)]"
            >
              View site ↗
            </Link>
            <span className="hidden font-mono text-[0.68rem] text-[var(--os-fg-faint)] sm:inline">
              {user.email}
            </span>
            <form action={signOut}>
              <button className="pressable rounded-[var(--os-r-chip)] border border-[var(--os-line)] px-2.5 py-1 text-xs text-[var(--os-fg-muted)] transition-colors hover:bg-[var(--os-surface-3)]">
                Sign out
              </button>
            </form>
          </div>
        </div>

        {/* Client sub-nav bar with pre-warming and instant tab highlighting */}
        <AdminNav pendingDrafts={pendingDrafts} />
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
    </div>
  );
}
