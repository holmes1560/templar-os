import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/server/auth";
import { toggleApplication, moveApplication } from "./actions";
import { WORKSPACES } from "@/lib/apps";

export const dynamic = "force-dynamic";

/** matches the desktop's own geometry so the preview isn't a lie */
const ROWS = 6;
const COLS = 4;

export default async function ApplicationsList() {
  await requireAdmin();

  const apps = await db.application.findMany({
    orderBy: [{ workspace: "asc" }, { cell: "asc" }],
    include: { project: { select: { slug: true, name: true } } },
  });

  return (
    <>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-[var(--os-fg)]">Applications</h1>
          <p className="mt-1 text-sm text-[var(--os-fg-muted)]">
            How projects appear inside the OS. {apps.length} configured.
          </p>
        </div>
        <Link
          href="/admin/applications/new"
          className="pressable shrink-0 rounded-[var(--os-r-chip)] bg-[var(--os-accent)] px-3 py-2 text-sm font-medium text-[var(--os-accent-fg)]"
        >
          Add application
        </Link>
      </div>

      {/* §8 — desktop layout, as it will actually appear */}
      <section className="mb-9">
        <h2 className="label mb-3">Desktop layout</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {WORKSPACES.map((ws) => {
            const here = apps.filter((a) => a.workspace === ws.id && a.desktopVisible && a.enabled);
            const byCell = new Map(here.map((a) => [a.cell, a]));

            return (
              <div key={ws.id} className="rounded-[var(--os-r-panel)] border border-[var(--os-line)] bg-[var(--os-surface-1)] p-3">
                <div className="mb-2 flex items-baseline justify-between">
                  <span className="text-xs font-medium text-[var(--os-fg)]">{ws.name}</span>
                  <span className="label">{here.length} icons</span>
                </div>

                <div
                  className="grid gap-1"
                  style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)`, gridAutoRows: "2.1rem" }}
                >
                  {Array.from({ length: ROWS * COLS }).map((_, i) => {
                    // the desktop fills top-to-bottom then left-to-right
                    const col = i % COLS;
                    const row = Math.floor(i / COLS);
                    const cell = col * ROWS + row;
                    const app = byCell.get(cell);
                    return (
                      <div
                        key={i}
                        title={app ? `${app.name} — cell ${cell}` : `empty — cell ${cell}`}
                        className={`flex items-center justify-center overflow-hidden rounded-[3px] border px-1 text-center text-[0.58rem] leading-tight ${
                          app
                            ? "border-[var(--os-accent)]/40 bg-[var(--os-accent-wash)] text-[var(--os-fg)]"
                            : "border-dashed border-[var(--os-line)] text-[var(--os-fg-faint)]"
                        }`}
                      >
                        {app ? <span className="truncate">{app.name}</span> : cell}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-[0.68rem] text-[var(--os-fg-faint)]">
          Cells fill top-to-bottom, then left-to-right — the same order the desktop uses.
        </p>
      </section>

      {/* full list */}
      <div className="overflow-x-auto rounded-[var(--os-r-panel)] border border-[var(--os-line)]">
        <table className="w-full min-w-[54rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--os-line)] bg-[var(--os-surface-2)]">
              {["Application", "Project", "Launch", "Enabled", "On desktop", "Placement", ""].map((h) => (
                <th key={h} className="label px-3 py-2 text-left font-normal">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {apps.map((a) => (
              <tr key={a.id} className="border-b border-[var(--os-line)] last:border-0">
                <td className="px-3 py-2.5">
                  <Link href={`/admin/applications/${a.id}`} className="font-medium text-[var(--os-fg)] hover:text-[var(--os-accent)]">
                    {a.name}
                  </Link>
                  <div className="font-mono text-[0.65rem] text-[var(--os-fg-faint)]">{a.appKey}</div>
                </td>

                <td className="px-3 py-2.5 text-xs text-[var(--os-fg-muted)]">
                  {a.project ? a.project.name : <span className="text-[var(--os-fg-faint)]">system app</span>}
                </td>

                <td className="px-3 py-2.5">
                  <span className="font-mono text-[0.68rem] text-[var(--os-fg-muted)]">
                    {a.launchMode.toLowerCase()}
                  </span>
                  {a.url && (
                    <div className="max-w-[12rem] truncate font-mono text-[0.6rem] text-[var(--os-fg-faint)]">
                      {a.url}
                    </div>
                  )}
                </td>

                <td className="px-3 py-2.5">
                  <Toggle id={a.id} field="enabled" on={a.enabled} />
                </td>
                <td className="px-3 py-2.5">
                  <Toggle id={a.id} field="desktopVisible" on={a.desktopVisible} />
                </td>

                <td className="px-3 py-2.5">
                  <form
                    action={async (fd: FormData) => {
                      "use server";
                      await moveApplication(a.id, Number(fd.get("workspace")), Number(fd.get("cell")));
                    }}
                    className="flex items-center gap-1"
                  >
                    <select
                      name="workspace"
                      defaultValue={a.workspace}
                      className="rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-1 py-0.5 text-[0.68rem]"
                    >
                      {WORKSPACES.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                    <input
                      name="cell"
                      type="number"
                      min={0}
                      max={200}
                      defaultValue={a.cell}
                      className="tnum w-12 rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-1 py-0.5 text-[0.68rem]"
                    />
                    <button className="text-[0.65rem] text-[var(--os-fg-faint)] hover:text-[var(--os-accent)]">
                      move
                    </button>
                  </form>
                </td>

                <td className="px-3 py-2.5 text-right">
                  <Link href={`/admin/applications/${a.id}`} className="text-xs text-[var(--os-fg-muted)] hover:text-[var(--os-accent)]">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Toggle({ id, field, on }: { id: string; field: "enabled" | "desktopVisible"; on: boolean }) {
  return (
    <form action={async () => { "use server"; await toggleApplication(id, field); }}>
      <button
        className={`rounded-[var(--os-r-chip)] border px-2 py-0.5 text-[0.68rem] transition-colors ${
          on
            ? "border-[var(--os-ok)]/40 bg-[var(--os-ok)]/10 text-[var(--os-ok)]"
            : "border-[var(--os-line)] text-[var(--os-fg-faint)] hover:bg-[var(--os-surface-3)]"
        }`}
      >
        {on ? "yes" : "no"}
      </button>
    </form>
  );
}
