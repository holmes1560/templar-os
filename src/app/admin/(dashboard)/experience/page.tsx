import { db } from "@/lib/db";
import { requireAdmin } from "@/server/auth";
import { ExperienceManager } from "./ExperienceManager";

export const dynamic = "force-dynamic";

export default async function AdminExperiencePage() {
  await requireAdmin();

  const [experience, education] = await Promise.all([
    db.experience.findMany({ orderBy: { order: "asc" } }),
    db.education.findMany({ orderBy: { order: "asc" } }),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-lg font-semibold tracking-tight text-[var(--os-fg)]">
          Work Experience & Education
        </h1>
        <p className="text-sm text-[var(--os-fg-muted)]">
          Manage professional engineering positions, responsibilities, degrees, and academic coursework.
        </p>
      </div>

      <ExperienceManager experience={experience} education={education} />
    </div>
  );
}
