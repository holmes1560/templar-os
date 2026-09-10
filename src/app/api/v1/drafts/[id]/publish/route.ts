import { db } from "@/lib/db";
import { authenticateRequest, authorizeScope } from "@/server/api-auth";
import { recordRevision } from "@/server/revisions";
import { Category, RepoVisibility, TimelineType } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(req);
  const authError = authorizeScope(auth, "drafts:publish");
  if (authError) return authError;

  const { id } = await params;
  const draft = await db.draft.findUnique({ where: { id } });
  if (!draft) {
    return Response.json({ ok: false, error: "Draft not found" }, { status: 404 });
  }

  const data = draft.data as Record<string, any>;
  let appliedEntity: any = null;

  try {
    switch (draft.entityType.toLowerCase()) {
      case "project": {
        if (draft.action === "UPDATE" && draft.entityId) {
          appliedEntity = await db.project.update({
            where: { id: draft.entityId },
            data: {
              ...data,
              status: "PUBLISHED",
              category: data.category ? (String(data.category).toUpperCase() as Category) : undefined,
              repoVisibility: data.repoVisibility ? (String(data.repoVisibility).toUpperCase() as RepoVisibility) : undefined,
            },
          });
        } else {
          appliedEntity = await db.project.create({
            data: {
              name: data.name,
              slug: data.slug,
              shortDescription: data.shortDescription,
              longDescription: data.longDescription,
              category: data.category ? (String(data.category).toUpperCase() as Category) : "EXPERIMENTS",
              period: data.period || "",
              team: data.team || null,
              githubUrl: data.githubUrl || null,
              liveUrl: data.liveUrl || null,
              docsUrl: data.docsUrl || null,
              repoVisibility: data.repoVisibility ? (String(data.repoVisibility).toUpperCase() as RepoVisibility) : "LOCAL",
              hosted: Boolean(data.hosted),
              featured: Boolean(data.featured),
              clientWork: Boolean(data.clientWork),
              status: "PUBLISHED",
              caveat: data.caveat || null,
              features: Array.isArray(data.features) ? data.features : [],
              challenges: Array.isArray(data.challenges) ? data.challenges : [],
              learned: Array.isArray(data.learned) ? data.learned : [],
              skills: Array.isArray(data.skills) ? data.skills : [],
              role: data.role || null,
              architecture: data.architecture || null,
              failedApproaches: Array.isArray(data.failedApproaches) ? data.failedApproaches : [],
              problemSolutions: Array.isArray(data.problemSolutions) ? data.problemSolutions : [],
              outcome: data.outcome || null,
              order: data.order || 0,
              visible: true,
              isAiGenerated: draft.isAiGenerated,
              aiOrigin: draft.aiOrigin,
            },
          });
          if (Array.isArray(data.technologies) && data.technologies.length > 0) {
            for (const [order, techName] of data.technologies.entries()) {
              const tech = await db.technology.upsert({
                where: { name: techName },
                update: {},
                create: { name: techName, slug: techName.toLowerCase().replace(/[^a-z0-9]+/g, "-") },
              });
              await db.projectTechnology.create({
                data: { projectId: appliedEntity.id, technologyId: tech.id, order },
              });
            }
          }
        }
        break;
      }

      case "timeline": {
        if (draft.action === "UPDATE" && draft.entityId) {
          appliedEntity = await db.timelineEntry.update({
            where: { id: draft.entityId },
            data: {
              ...data,
              type: data.type ? (data.type as TimelineType) : undefined,
            },
          });
        } else {
          appliedEntity = await db.timelineEntry.create({
            data: {
              title: data.title,
              type: data.type ? (String(data.type).toUpperCase() as TimelineType) : "MILESTONE",
              organization: data.organization || null,
              startDate: data.startDate,
              endDate: data.endDate || null,
              isCurrent: Boolean(data.isCurrent),
              shortDescription: data.shortDescription,
              detailedDescription: data.detailedDescription || null,
              technologies: Array.isArray(data.technologies) ? data.technologies : [],
              skills: Array.isArray(data.skills) ? data.skills : [],
              relatedProjectIds: Array.isArray(data.relatedProjectIds) ? data.relatedProjectIds : [],
              icon: data.icon || "milestone",
              color: data.color || null,
              order: data.order || 0,
              visible: true,
              isAiGenerated: draft.isAiGenerated,
              aiOrigin: draft.aiOrigin,
            },
          });
        }
        break;
      }

      case "profile":
      case "about": {
        const profile = await db.profile.findFirst();
        if (profile) {
          appliedEntity = await db.profile.update({
            where: { id: profile.id },
            data,
          });
        } else {
          appliedEntity = await db.profile.create({ data: data as any });
        }
        break;
      }

      case "skill": {
        if (draft.action === "UPDATE" && draft.entityId) {
          appliedEntity = await db.skill.update({
            where: { id: draft.entityId },
            data,
          });
        } else {
          appliedEntity = await db.skill.create({ data: data as any });
        }
        break;
      }

      default:
        return Response.json(
          { ok: false, error: `Direct publishing for entityType '${draft.entityType}' is not implemented.` },
          { status: 400 }
        );
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to apply draft to database";
    return Response.json({ ok: false, error: msg }, { status: 500 });
  }

  const updatedDraft = await db.draft.update({
    where: { id },
    data: {
      status: "PUBLISHED",
      entityId: appliedEntity?.id || draft.entityId,
      reviewedAt: new Date(),
    },
  });

  await recordRevision({
    entityType: draft.entityType,
    entityId: appliedEntity?.id || draft.id,
    changeType: "PUBLISH",
    summary: `Published draft: ${draft.title} (${draft.entityType})`,
    newValue: appliedEntity,
    apiKeyId: auth.apiKey?.id,
    isAiGenerated: !auth.isSessionAdmin,
  });

  return Response.json({
    ok: true,
    published: true,
    draft: updatedDraft,
    data: appliedEntity,
  });
}
