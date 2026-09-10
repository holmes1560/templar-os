"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/server/auth";
import { logRevision } from "@/server/revisions";

export async function createCategory(formData: FormData) {
  const user = await requireAdmin();
  const name = String(formData.get("name") || "").trim();
  const slug = String(formData.get("slug") || "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const order = parseInt(String(formData.get("order") || "10"), 10) || 10;

  if (!name || !slug) return { error: "Category name and slug are required." };

  const created = await db.skillCategory.create({
    data: { name, slug, order },
  });

  await logRevision({
    entityType: "SkillCategory",
    entityId: created.id,
    action: "CREATE",
    before: null,
    after: created,
    author: user.email,
    changeSummary: `Created skill category "${name}"`,
  });

  revalidatePath("/");
  revalidatePath("/admin/skills");
  return { success: true };
}

export async function createSkill(formData: FormData) {
  const user = await requireAdmin();
  const categoryId = String(formData.get("categoryId") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const proficiency = parseInt(String(formData.get("proficiency") || "4"), 10) || 4;
  const featured = formData.get("featured") === "on";
  const order = parseInt(String(formData.get("order") || "10"), 10) || 10;

  const technologies = String(formData.get("technologies") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!categoryId || !name) return { error: "Category and Skill Name are required." };

  const created = await db.skill.create({
    data: {
      categoryId,
      name,
      description,
      proficiency,
      technologies,
      featured,
      order,
      visible: true,
    },
  });

  await logRevision({
    entityType: "Skill",
    entityId: created.id,
    action: "CREATE",
    before: null,
    after: created,
    author: user.email,
    changeSummary: `Created skill "${name}"`,
  });

  revalidatePath("/");
  revalidatePath("/admin/skills");
  return { success: true };
}

export async function deleteSkill(id: string) {
  const user = await requireAdmin();
  const existing = await db.skill.findUnique({ where: { id } });
  if (!existing) return { error: "Skill not found." };

  await db.skill.delete({ where: { id } });

  await logRevision({
    entityType: "Skill",
    entityId: id,
    action: "DELETE",
    before: existing,
    after: null,
    author: user.email,
    changeSummary: `Deleted skill "${existing.name}"`,
  });

  revalidatePath("/");
  revalidatePath("/admin/skills");
  return { success: true };
}

export async function deleteCategory(id: string) {
  const user = await requireAdmin();
  const existing = await db.skillCategory.findUnique({
    where: { id },
    include: { skills: true },
  });
  if (!existing) return { error: "Category not found." };
  if (existing.skills.length > 0) {
    return { error: "Cannot delete category with existing skills. Delete or move skills first." };
  }

  await db.skillCategory.delete({ where: { id } });

  await logRevision({
    entityType: "SkillCategory",
    entityId: id,
    action: "DELETE",
    before: existing,
    after: null,
    author: user.email,
    changeSummary: `Deleted category "${existing.name}"`,
  });

  revalidatePath("/");
  revalidatePath("/admin/skills");
  return { success: true };
}
