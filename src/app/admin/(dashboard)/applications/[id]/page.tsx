import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/server/auth";
import { ApplicationForm } from "../ApplicationForm";

export const dynamic = "force-dynamic";

export default async function EditApplication({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const [a, projects] = await Promise.all([
    db.application.findUnique({ where: { id } }),
    db.project.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  if (!a) notFound();

  return (
    <>
      <Link href="/admin/applications" className="label mb-4 inline-block hover:text-[var(--os-accent)]">
        ← Applications
      </Link>
      <h1 className="mb-6 text-lg font-semibold tracking-tight text-[var(--os-fg)]">{a.name}</h1>

      <ApplicationForm
        projects={projects}
        values={{
          id: a.id,
          appKey: a.appKey,
          name: a.name,
          icon: a.icon,
          launchMode: a.launchMode,
          url: a.url ?? "",
          projectId: a.projectId ?? "",
          enabled: a.enabled,
          desktopVisible: a.desktopVisible,
          workspace: a.workspace,
          cell: a.cell,
          windowWidth: a.windowWidth,
          windowHeight: a.windowHeight,
          resizable: a.resizable,
          maximizable: a.maximizable,
          minimizable: a.minimizable,
        }}
      />
    </>
  );
}
