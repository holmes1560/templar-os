import { db } from "@/lib/db";
import { requireAdmin } from "@/server/auth";
import { SkillsManager } from "./SkillsManager";

export const dynamic = "force-dynamic";

export default async function AdminSkillsPage() {
  await requireAdmin();

  const categories = await db.skillCategory.findMany({
    include: {
      skills: {
        orderBy: { order: "asc" },
      },
    },
    orderBy: { order: "asc" },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-lg font-semibold tracking-tight text-[var(--os-fg)]">
          Skills & Taxonomy
        </h1>
        <p className="text-sm text-[var(--os-fg-muted)]">
          Manage technical skill groupings, tools, frameworks, and proficiencies demonstrated across projects.
        </p>
      </div>

      <SkillsManager categories={categories} />
    </div>
  );
}
