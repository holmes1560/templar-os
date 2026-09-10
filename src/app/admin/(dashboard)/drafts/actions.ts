"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/server/auth";
import { logRevision } from "@/server/revisions";
import { invalidateDraftsCache } from "@/server/drafts";

export async function approveDraft(draftId: string) {
  const user = await requireAdmin();

  const draft = await db.draft.findUnique({ where: { id: draftId } });
  if (!draft) return { error: "Draft not found." };

  const updated = await db.draft.update({
    where: { id: draftId },
    data: {
      status: "APPROVED",
      reviewedAt: new Date(),
    },
  });

  await logRevision({
    entityType: "Draft",
    entityId: draftId,
    action: "UPDATE",
    before: draft,
    after: updated,
    author: user.email,
    changeSummary: `Approved draft "${draft.summary || draft.title}"`,
  });

  invalidateDraftsCache();
  revalidatePath("/admin/drafts");
  return { success: true };
}

export async function rejectDraft(draftId: string, reason?: string) {
  const user = await requireAdmin();

  const draft = await db.draft.findUnique({ where: { id: draftId } });
  if (!draft) return { error: "Draft not found." };

  const updated = await db.draft.update({
    where: { id: draftId },
    data: {
      status: "REJECTED",
      reviewNotes: reason || "Rejected by administrator",
      reviewedAt: new Date(),
    },
  });

  await logRevision({
    entityType: "Draft",
    entityId: draftId,
    action: "UPDATE",
    before: draft,
    after: updated,
    author: user.email,
    changeSummary: `Rejected draft "${draft.summary || draft.title}"`,
  });

  invalidateDraftsCache();
  revalidatePath("/admin/drafts");
  return { success: true };
}

export async function publishDraft(draftId: string) {
  const user = await requireAdmin();

  const draft = await db.draft.findUnique({ where: { id: draftId } });
  if (!draft) return { error: "Draft not found." };

  const data = draft.data as Record<string, any>;

  // Apply change according to entityType
  if (draft.entityType.toLowerCase() === "project") {
    if (draft.action === "CREATE") {
      const slug = data.slug || data.name?.toLowerCase().replace(/[^a-z0-9-]/g, "-") || `project-${Date.now()}`;
      const created = await db.project.create({
        data: {
          slug,
          name: data.name || data.title || "Untitled Project",
          shortDescription: data.shortDescription || data.summary || "",
          longDescription: data.longDescription || data.description || "",
          category: data.category?.toUpperCase() || "EXPERIMENTS",
          period: data.period || "",
          team: data.team || null,
          role: data.role || null,
          architecture: data.architecture || null,
          features: data.features || [],
          challenges: data.challenges || [],
          learned: data.learned || [],
          failedApproaches: data.failedApproaches || [],
          problemSolutions: data.problemSolutions || [],
          outcome: data.outcome || null,
          repoVisibility: data.repoVisibility?.toUpperCase() || "PUBLIC",
          githubUrl: data.githubUrl || null,
          liveUrl: data.liveUrl || data.demoUrl || null,
          docsUrl: data.docsUrl || null,
          status: "PUBLISHED",
          visible: true,
          featured: Boolean(data.featured),
          clientWork: Boolean(data.clientWork),
          hosted: Boolean(data.hosted),
          caveat: data.caveat || null,
          isAiGenerated: true,
          aiOrigin: draft.aiOrigin || "Agent",
        },
      });

      await logRevision({
        entityType: "Project",
        entityId: created.id,
        action: "CREATE",
        before: null,
        after: created,
        author: user.email,
        changeSummary: `Published Project draft "${created.name}" into production`,
      });
    }
  } else if (draft.entityType.toLowerCase() === "timelineentry" || draft.entityType.toLowerCase() === "timeline") {
    if (draft.action === "CREATE") {
      const created = await db.timelineEntry.create({
        data: {
          title: data.title,
          type: data.type?.toUpperCase() || "MILESTONE",
          organization: data.organization || null,
          startDate: data.startDate,
          endDate: data.endDate || null,
          isCurrent: Boolean(data.isCurrent),
          shortDescription: data.shortDescription,
          detailedDescription: data.detailedDescription || null,
          technologies: data.technologies || [],
          skills: data.skills || [],
          relatedProjectIds: data.relatedProjectIds || [],
          icon: data.icon || "timeline",
          order: data.order || 100,
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
        changeSummary: `Published Milestone draft "${created.title}" into production`,
      });
    }
  }

  // Mark draft as published
  await db.draft.update({
    where: { id: draftId },
    data: {
      status: "PUBLISHED",
      reviewedAt: new Date(),
    },
  });

  invalidateDraftsCache();
  revalidatePath("/");
  revalidatePath("/admin/drafts");
  revalidatePath("/admin/projects");
  revalidatePath("/admin/timeline");
  return { success: true };
}
