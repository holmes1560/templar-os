"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export interface NavItem {
  href: string;
  label: string;
  badge?: boolean;
}

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/profile", label: "Profile" },
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/timeline", label: "Timeline" },
  { href: "/admin/skills", label: "Skills" },
  { href: "/admin/experience", label: "Experience" },
  { href: "/admin/applications", label: "Applications" },
  { href: "/admin/drafts", label: "Review Queue", badge: true },
  { href: "/admin/keys", label: "API Keys" },
  { href: "/admin/revisions", label: "Audit Log" },
  { href: "/admin/api-docs", label: "API & MCP" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminNav({ pendingDrafts }: { pendingDrafts: number }) {
  const pathname = usePathname();
  const router = useRouter();

  // Pre-warm all admin tabs in the client-side router cache immediately on load
  // so any tab switch is instantaneous without network waiting.
  useEffect(() => {
    ADMIN_NAV_ITEMS.forEach((item) => {
      try {
        router.prefetch(item.href);
      } catch {
        // ignore prefetch errors
      }
    });
  }, [router]);

  return (
    <div className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-5 py-1.5 text-xs no-scrollbar">
      {ADMIN_NAV_ITEMS.map((item) => {
        const isActive =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname === item.href || pathname.startsWith(item.href + "/");

        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={true}
            onMouseEnter={() => router.prefetch(item.href)}
            onTouchStart={() => router.prefetch(item.href)}
            className={`relative shrink-0 rounded-[var(--os-r-chip)] px-2.5 py-1 text-xs transition-colors ${
              isActive
                ? "bg-[var(--os-surface-3)] text-[var(--os-accent)] font-medium border border-[var(--os-line-strong)]"
                : "text-[var(--os-fg-muted)] border border-transparent hover:bg-[var(--os-surface-2)] hover:text-[var(--os-fg)]"
            }`}
          >
            <span>{item.label}</span>
            {item.badge && pendingDrafts > 0 && (
              <span className="ml-1.5 rounded-full bg-[var(--os-accent)] px-1.5 py-0.2 font-mono text-[0.6rem] text-[var(--os-accent-fg)]">
                {pendingDrafts}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
