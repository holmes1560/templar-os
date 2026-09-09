import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/server/auth";
import { ApplicationForm } from "../ApplicationForm";

export const dynamic = "force-dynamic";

export default async function NewApplication() {
  await requireAdmin();

  const projects = await db.project.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <Link href="/admin/applications" className="label mb-4 inline-block hover:text-[var(--os-accent)]">
        ← Applications
      </Link>
      <h1 className="mb-1 text-lg font-semibold tracking-tight text-[var(--os-fg)]">New application</h1>
      <p className="mb-6 text-sm text-[var(--os-fg-muted)]">
        Link it to a project to surface that work on the desktop, or leave the project empty for a
        system app.
      </p>

      <ApplicationForm
        projects={projects}
        values={{
          id: null,
          appKey: "", name: "", icon: "folder",
          launchMode: "DEMO", url: "", projectId: "",
          enabled: true, desktopVisible: true,
          workspace: 1, cell: 0,
          windowWidth: 900, windowHeight: 620,
          resizable: true, maximizable: true, minimizable: true,
        }}
      />
    </>
  );
}
