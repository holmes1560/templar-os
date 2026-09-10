import { db } from "@/lib/db";
import { authenticateRequest, authorizeScope, hasScope } from "@/server/api-auth";
import { recordRevision } from "@/server/revisions";
import { TimelineType } from "@prisma/client";
import { z } from "zod";

export const dynamic = "force-dynamic";

const CreateTimelineSchema = z.object({
  title: z.string().trim().min(1).max(200),
  type: z.enum([
    "UNIVERSITY",
    "INTERNSHIP",
    "EMPLOYMENT",
    "PROJECT",
    "CERTIFICATION",
    "MILESTONE",
    "LEARNING",
  ]).default("MILESTONE"),
  organization: z.string().trim().optional(),
  startDate: z.string().trim().min(1),
  endDate: z.string().trim().optional(),
  isCurrent: z.boolean().default(false),
  shortDescription: z.string().trim().min(1).max(500),
  detailedDescription: z.string().trim().max(4000).optional(),
  technologies: z.array(z.string()).default([]),
  skills: z.array(z.string()).default([]),
  relatedProjectIds: z.array(z.string()).default([]),
  icon: z.string().trim().default("milestone"),
  color: z.string().trim().optional(),
  order: z.number().int().default(0),
  visible: z.boolean().default(true),
  isAiGenerated: z.boolean().default(false),
  aiOrigin: z.string().optional(),
});

export async function GET(req: Request) {
  const auth = await authenticateRequest(req);
  const authError = authorizeScope(auth, "timeline:read");
  if (authError) return authError;

  const url = new URL(req.url);
  const typeParam = url.searchParams.get("type")?.toUpperCase();

  const where: any = {};
  if (typeParam && Object.values(TimelineType).includes(typeParam as any)) {
    where.type = typeParam as TimelineType;
  }

  const entries = await db.timelineEntry.findMany({
    where,
    orderBy: { order: "asc" },
  });

  return Response.json({ ok: true, data: entries });
}

export async function POST(req: Request) {
  const auth = await authenticateRequest(req);

  const canCreateDirectly = hasScope(auth.scopes, "timeline:write");
  const canCreateDraft = hasScope(auth.scopes, "drafts:create");

  if (!canCreateDirectly && !canCreateDraft) {
    return Response.json(
      { ok: false, error: "Forbidden: requires 'timeline:write' or 'drafts:create' permission." },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = CreateTimelineSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Validation failed", details: parsed.error.format() },
      { status: 400 }
    );
  }

  const input = parsed.data;

  // If cannot write directly, route to Draft queue
  if (!canCreateDirectly && canCreateDraft) {
    const draft = await db.draft.create({
      data: {
        entityType: "timeline",
        action: "CREATE",
        title: input.title,
        summary: input.shortDescription,
        data: input,
        status: "PENDING",
        isAiGenerated: input.isAiGenerated || !auth.isSessionAdmin,
        aiOrigin: input.aiOrigin || (auth.apiKey ? `API Key: ${auth.apiKey.name}` : undefined),
        createdByApiKeyId: auth.apiKey?.id,
      },
    });
    return Response.json(
      {
        ok: true,
        isDraft: true,
        message: "Timeline entry submitted to Review Queue as a draft.",
        data: draft,
      },
      { status: 202 }
    );
  }

  const entry = await db.timelineEntry.create({
    data: {
      ...input,
      type: input.type as TimelineType,
      isAiGenerated: input.isAiGenerated || !auth.isSessionAdmin,
      aiOrigin: input.aiOrigin || (auth.apiKey ? `API Key: ${auth.apiKey.name}` : undefined),
    },
  });

  await recordRevision({
    entityType: "timeline",
    entityId: entry.id,
    changeType: "CREATE",
    summary: `Created timeline milestone ${entry.title}`,
    newValue: entry,
    apiKeyId: auth.apiKey?.id,
    isAiGenerated: entry.isAiGenerated,
  });

  return Response.json({ ok: true, data: entry }, { status: 201 });
}
