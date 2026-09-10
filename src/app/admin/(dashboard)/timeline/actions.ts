"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/server/auth";
import { logRevision } from "@/server/revisions";
import { TimelineType } from "@prisma/client";

export async function createTimelineEntry(formData: FormData) {
  const user = await requireAdmin();

  const title = String(formData.get("title") || "").trim();
  const type = (String(formData.get("type") || "MILESTONE").toUpperCase() as TimelineType);
  const organization = String(formData.get("organization") || "").trim() || null;
  const startDate = String(formData.get("startDate") || "").trim();
  const endDate = String(formData.get("endDate") || "").trim() || null;
  const isCurrent = formData.get("isCurrent") === "on" || formData.get("isCurrent") === "true";
  const shortDescription = String(formData.get("shortDescription") || "").trim();
  const detailedDescription = String(formData.get("detailedDescription") || "").trim() || null;
  const icon = String(formData.get("icon") || "timeline").trim();
  const order = parseInt(String(formData.get("order") || "100"), 10) || 100;

  const technologies = String(formData.get("technologies") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const skills = String(formData.get("skills") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const relatedProjectIds = String(formData.get("relatedProjectIds") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!title || !startDate || !shortDescription) {
    return { error: "Title, Start Date, and Short Description are required." };
  }

  const created = await db.timelineEntry.create({
    data: {
      title,
      type,
      organization,
      startDate,
      endDate: isCurrent ? null : endDate,
      isCurrent,
      shortDescription,
      detailedDescription,
      technologies,
      skills,
      relatedProjectIds,
      icon,
      order,
      visible: true,
    },
  });

  await logRevision({
    entityType: "TimelineEntry",
    entityId: created.id,
    action: "CREATE",
    before: null,
    after: created,
    author: user.email,
    changeSummary: `Created milestone "${title}"`,
  });

  revalidatePath("/");
  revalidatePath("/admin/timeline");
  return { success: true };
}

export async function updateTimelineEntry(id: string, formData: FormData) {
  const user = await requireAdmin();

  const existing = await db.timelineEntry.findUnique({ where: { id } });
  if (!existing) return { error: "Milestone not found." };

  const title = String(formData.get("title") || "").trim();
  const type = (String(formData.get("type") || "MILESTONE").toUpperCase() as TimelineType);
  const organization = String(formData.get("organization") || "").trim() || null;
  const startDate = String(formData.get("startDate") || "").trim();
  const endDate = String(formData.get("endDate") || "").trim() || null;
  const isCurrent = formData.get("isCurrent") === "on" || formData.get("isCurrent") === "true";
  const shortDescription = String(formData.get("shortDescription") || "").trim();
  const detailedDescription = String(formData.get("detailedDescription") || "").trim() || null;
  const icon = String(formData.get("icon") || "timeline").trim();
  const order = parseInt(String(formData.get("order") || "100"), 10) || 100;

  const technologies = String(formData.get("technologies") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const skills = String(formData.get("skills") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const relatedProjectIds = String(formData.get("relatedProjectIds") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const updated = await db.timelineEntry.update({
    where: { id },
    data: {
      title,
      type,
      organization,
      startDate,
      endDate: isCurrent ? null : endDate,
      isCurrent,
      shortDescription,
      detailedDescription,
      technologies,
      skills,
      relatedProjectIds,
      icon,
      order,
    },
  });

  await logRevision({
    entityType: "TimelineEntry",
    entityId: id,
    action: "UPDATE",
    before: existing,
    after: updated,
    author: user.email,
    changeSummary: `Updated milestone "${title}"`,
  });

  revalidatePath("/");
  revalidatePath("/admin/timeline");
  return { success: true };
}

export async function deleteTimelineEntry(id: string) {
  const user = await requireAdmin();

  const existing = await db.timelineEntry.findUnique({ where: { id } });
  if (!existing) return { error: "Milestone not found." };

  await db.timelineEntry.delete({ where: { id } });

  await logRevision({
    entityType: "TimelineEntry",
    entityId: id,
    action: "DELETE",
    before: existing,
    after: null,
    author: user.email,
    changeSummary: `Deleted milestone "${existing.title}"`,
  });

  revalidatePath("/");
  revalidatePath("/admin/timeline");
  return { success: true };
}
