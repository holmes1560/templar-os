"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/server/auth";
import { logRevision } from "@/server/revisions";

export async function createExperience(formData: FormData) {
  const user = await requireAdmin();

  const organization = String(formData.get("organization") || "").trim();
  const role = String(formData.get("role") || "").trim();
  const employmentType = String(formData.get("employmentType") || "").trim() || null;
  const location = String(formData.get("location") || "").trim() || null;
  const startDate = String(formData.get("startDate") || "").trim();
  const endDate = String(formData.get("endDate") || "").trim() || null;
  const isCurrent = formData.get("isCurrent") === "on";
  const description = String(formData.get("description") || "").trim();
  const order = parseInt(String(formData.get("order") || "10"), 10) || 10;

  const responsibilities = String(formData.get("responsibilities") || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const achievements = String(formData.get("achievements") || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const technologies = String(formData.get("technologies") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!organization || !role || !startDate || !description) {
    return { error: "Organization, Role, Start Date, and Description are required." };
  }

  const created = await db.experience.create({
    data: {
      organization,
      role,
      employmentType,
      location,
      startDate,
      endDate: isCurrent ? null : endDate,
      isCurrent,
      description,
      responsibilities,
      achievements,
      technologies,
      order,
      visible: true,
    },
  });

  await logRevision({
    entityType: "Experience",
    entityId: created.id,
    action: "CREATE",
    before: null,
    after: created,
    author: user.email,
    changeSummary: `Created experience "${role} at ${organization}"`,
  });

  revalidatePath("/");
  revalidatePath("/admin/experience");
  return { success: true };
}

export async function deleteExperience(id: string) {
  const user = await requireAdmin();
  const existing = await db.experience.findUnique({ where: { id } });
  if (!existing) return { error: "Experience not found." };

  await db.experience.delete({ where: { id } });

  await logRevision({
    entityType: "Experience",
    entityId: id,
    action: "DELETE",
    before: existing,
    after: null,
    author: user.email,
    changeSummary: `Deleted experience "${existing.role} at ${existing.organization}"`,
  });

  revalidatePath("/");
  revalidatePath("/admin/experience");
  return { success: true };
}

export async function createEducation(formData: FormData) {
  const user = await requireAdmin();

  const institution = String(formData.get("institution") || "").trim();
  const degree = String(formData.get("degree") || "").trim();
  const fieldOfStudy = String(formData.get("fieldOfStudy") || "").trim() || null;
  const startDate = String(formData.get("startDate") || "").trim();
  const endDate = String(formData.get("endDate") || "").trim() || null;
  const isCurrent = formData.get("isCurrent") === "on";
  const description = String(formData.get("description") || "").trim() || null;
  const order = parseInt(String(formData.get("order") || "10"), 10) || 10;

  const achievements = String(formData.get("achievements") || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!institution || !degree || !startDate) {
    return { error: "Institution, Degree, and Start Date are required." };
  }

  const created = await db.education.create({
    data: {
      institution,
      degree,
      fieldOfStudy,
      startDate,
      endDate: isCurrent ? null : endDate,
      isCurrent,
      description,
      achievements,
      order,
      visible: true,
    },
  });

  await logRevision({
    entityType: "Education",
    entityId: created.id,
    action: "CREATE",
    before: null,
    after: created,
    author: user.email,
    changeSummary: `Created education "${degree} from ${institution}"`,
  });

  revalidatePath("/");
  revalidatePath("/admin/experience");
  return { success: true };
}

export async function deleteEducation(id: string) {
  const user = await requireAdmin();
  const existing = await db.education.findUnique({ where: { id } });
  if (!existing) return { error: "Education record not found." };

  await db.education.delete({ where: { id } });

  await logRevision({
    entityType: "Education",
    entityId: id,
    action: "DELETE",
    before: existing,
    after: null,
    author: user.email,
    changeSummary: `Deleted education "${existing.degree}"`,
  });

  revalidatePath("/");
  revalidatePath("/admin/experience");
  return { success: true };
}
