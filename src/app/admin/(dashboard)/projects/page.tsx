import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/server/auth";
import { setProjectFlag } from "./actions";

export const dynamic = "force-dynamic";

export default async function ProjectsList() {
  await requireAdmin();

  const projects = await db.project.findMany({
    orderBy: [{ status: "asc" }, { featured: "desc" }, { name: "asc" }],
    include: { applications: { select: { id: true, launchMode: true, enabled: true } } },
  });

  return (
    <>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-[var(--os-fg)]">Projects</h1>
          <p className="mt-1 text-sm text-[var(--os-fg-muted)]">
            {projects.length} total. Changes appear on the portfolio immediately.
          </p>
        </div>
        <Link
          href="/admin/projects/new"
          className="pressable shrink-0 rounded-[var(--os-r-chip)] bg-[var(--os-accent)] px-3 py-2 text-sm font-medium text-[var(--os-accent-fg)]"
        >
          Add project
        </Link>
      </div>

      <div className="overflow-x-auto rounded-[var(--os-r-panel)] border border-[var(--os-line)]">
        <table className="w-full min-w-[52rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--os-line)] bg-[var(--os-surface-2)]">
              {["Project", "Status", "GitHub", "Live demo", "Application", "Featured", ""].map((h) => (
                <th key={h} className="label px-3 py-2 text-left font-normal">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => {
              const liveApp = p.applications.find((a) => a.enabled);
              return (
                <tr key={p.id} className="border-b border-[var(--os-line)] last:border-0">
                  <td className="px-3 py-2.5">
                    <Link
                      href={`/admin/projects/${p.id}`}
                      className="font-medium text-[var(--os-fg)] hover:text-[var(--os-accent)]"
                    >
                      {p.name}
                    </Link>
                    <div className="font-mono text-[0.65rem] text-[var(--os-fg-faint)]">{p.slug}</div>
                  </td>

                  <td className="px-3 py-2.5">
                    <form action={async (fd: FormData) => {
                      "use server";
                      await setProjectFlag(p.id, "status", String(fd.get("status")));
                    }}>
                      <select
                        name="status"
                        defaultValue={p.status}
                        className="rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-1.5 py-1 text-xs text-[var(--os-fg)]"
                      >
                        {["PUBLISHED", "DRAFT", "ARCHIVED"].map((s) => (
                          <option key={s} value={s}>{s.toLowerCase()}</option>
                        ))}
                      </select>
                      <button className="ml-1 text-[0.65rem] text-[var(--os-fg-faint)] hover:text-[var(--os-accent)]">
                        set
                      </button>
                    </form>
                  </td>

                  <td className="px-3 py-2.5">
                    <Dot on={Boolean(p.githubUrl)} onLabel={p.repoVisibility.toLowerCase()} offLabel="none" />
                  </td>

                  <td className="px-3 py-2.5">
                    <Dot
                      on={p.hosted && Boolean(p.liveUrl)}
                      onLabel="hosted"
                      offLabel={p.liveUrl ? "url, off" : "none"}
                    />
                  </td>

                  <td className="px-3 py-2.5">
                    <Dot
                      on={Boolean(liveApp)}
                      onLabel={liveApp ? liveApp.launchMode.toLowerCase() : ""}
                      offLabel="none"
                    />
                  </td>

                  <td className="px-3 py-2.5">
                    <form action={async () => {
                      "use server";
                      await setProjectFlag(p.id, "featured", String(!p.featured));
                    }}>
                      <button
                        className={`rounded-[var(--os-r-chip)] border px-2 py-0.5 text-[0.68rem] transition-colors ${
                          p.featured
                            ? "border-[var(--os-accent)] bg-[var(--os-accent-wash)] text-[var(--os-accent)]"
                            : "border-[var(--os-line)] text-[var(--os-fg-faint)] hover:bg-[var(--os-surface-3)]"
                        }`}
                      >
                        {p.featured ? "yes" : "no"}
                      </button>
                    </form>
                  </td>

                  <td className="px-3 py-2.5 text-right">
                    <Link
                      href={`/admin/projects/${p.id}`}
                      className="text-xs text-[var(--os-fg-muted)] hover:text-[var(--os-accent)]"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Dot({ on, onLabel, offLabel }: { on: boolean; onLabel: string; offLabel: string }) {
  return (
    <span className="flex items-center gap-1.5 font-mono text-[0.68rem]">
      <span
        className={`h-1.5 w-1.5 rounded-full ${on ? "bg-[var(--os-ok)]" : "bg-[var(--os-fg-faint)]"}`}
      />
      <span className={on ? "text-[var(--os-fg-muted)]" : "text-[var(--os-fg-faint)]"}>
        {on ? onLabel : offLabel}
      </span>
    </span>
  );
}
