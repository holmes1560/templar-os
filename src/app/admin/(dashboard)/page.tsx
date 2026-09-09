import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function AdminOverview() {
  await requireAdmin();

  const [projects, published, featured, drafts, archived, apps, hostedApps, recent] =
    await Promise.all([
      db.project.count(),
      db.project.count({ where: { status: "PUBLISHED" } }),
      db.project.count({ where: { featured: true } }),
      db.project.count({ where: { status: "DRAFT" } }),
      db.project.count({ where: { status: "ARCHIVED" } }),
      db.application.count(),
      db.project.count({ where: { hosted: true } }),
      db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    ]);

  return (
    <>
      <h1 className="mb-1 text-lg font-semibold tracking-tight text-[var(--os-fg)]">Overview</h1>
      <p className="mb-7 text-sm text-[var(--os-fg-muted)]">
        Everything the portfolio renders comes from here. No deploy is needed to change it.
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Projects" value={projects} href="/admin/projects" />
        <Stat label="Published" value={published} tone="ok" />
        <Stat label="Drafts" value={drafts} tone={drafts ? "warn" : undefined} />
        <Stat label="Archived" value={archived} />
        <Stat label="Featured" value={featured} />
        <Stat label="Applications" value={apps} href="/admin/applications" />
        <Stat label="Hosted" value={hostedApps} />
      </div>

      <section className="mt-9">
        <h2 className="label mb-3">Recent activity</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-[var(--os-fg-faint)]">Nothing logged yet.</p>
        ) : (
          <ul className="divide-y divide-[var(--os-line)] rounded-[var(--os-r-panel)] border border-[var(--os-line)]">
            {recent.map((a) => (
              <li key={a.id} className="flex items-baseline gap-3 px-3 py-2 font-mono text-[0.7rem]">
                <span className="text-[var(--os-fg)]">{a.action}</span>
                <span className="text-[var(--os-fg-faint)]">{a.entity}</span>
                <span className="tnum ml-auto text-[var(--os-fg-faint)]">
                  {a.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function Stat({
  label, value, href, tone,
}: {
  label: string; value: number; href?: string; tone?: "ok" | "warn";
}) {
  const color =
    tone === "ok" ? "text-[var(--os-ok)]"
    : tone === "warn" ? "text-[var(--os-warn)]"
    : "text-[var(--os-fg)]";

  const body = (
    <div className="rounded-[var(--os-r-panel)] border border-[var(--os-line)] bg-[var(--os-surface-1)] px-3 py-3 transition-colors hover:bg-[var(--os-surface-2)]">
      <div className={`tnum text-2xl font-semibold ${color}`}>{value}</div>
      <div className="label mt-0.5">{label}</div>
    </div>
  );

  return href ? <Link href={href}>{body}</Link> : body;
}
