"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/server/auth";
import { logRevision } from "@/server/revisions";

export async function rollbackRevision(revisionId: string) {
  const user = await requireAdmin();

  const rev = await db.revision.findUnique({ where: { id: revisionId } });
  if (!rev) return { error: "Revision not found." };
  if (!rev.previousValue) {
    return { error: "Cannot rollback an event that has no prior snapshot." };
  }

  const before = rev.previousValue as Record<string, any>;

  // Perform rollback based on entityType
  if (rev.entityType === "Profile") {
    const current = await db.profile.findUnique({ where: { id: rev.entityId } });
    const { id, createdAt, updatedAt, ...rest } = before;
    const restored = await db.profile.update({
      where: { id: rev.entityId },
      data: rest,
    });
    await logRevision({
      entityType: "Profile",
      entityId: rev.entityId,
      action: "UPDATE",
      before: current,
      after: restored,
      author: user.email,
      changeSummary: `Rollback Profile to revision before ${rev.id}`,
    });
  } else if (rev.entityType === "TimelineEntry") {
    const current = await db.timelineEntry.findUnique({ where: { id: rev.entityId } });
    const { id, createdAt, updatedAt, ...rest } = before;
    const restored = await db.timelineEntry.update({
      where: { id: rev.entityId },
      data: rest,
    });
    await logRevision({
      entityType: "TimelineEntry",
      entityId: rev.entityId,
      action: "UPDATE",
      before: current,
      after: restored,
      author: user.email,
      changeSummary: `Rollback TimelineEntry to revision before ${rev.id}`,
    });
  } else if (rev.entityType === "Project") {
    const current = await db.project.findUnique({ where: { id: rev.entityId } });
    const { id, createdAt, updatedAt, githubRepoId, technologies, applications, ...rest } = before;
    const restored = await db.project.update({
      where: { id: rev.entityId },
      data: rest,
    });
    await logRevision({
      entityType: "Project",
      entityId: rev.entityId,
      action: "UPDATE",
      before: current,
      after: restored,
      author: user.email,
      changeSummary: `Rollback Project to revision before ${rev.id}`,
    });
  }

  revalidatePath("/");
  revalidatePath("/admin/revisions");
  return { success: true };
}
