import { db } from "@/lib/db";
import { authenticateRequest, authorizeScope, hasScope } from "@/server/api-auth";
import { recordRevision } from "@/server/revisions";
import { DraftStatus, DraftAction } from "@prisma/client";
import { z } from "zod";

export const dynamic = "force-dynamic";

const CreateDraftSchema = z.object({
  entityType: z.string().trim().min(1),
  entityId: z.string().trim().optional(),
  action: z.enum(["CREATE", "UPDATE", "DELETE"]).default("CREATE"),
  title: z.string().trim().min(1),
  summary: z.string().trim().optional(),
  data: z.record(z.string(), z.unknown()),
  previousData: z.record(z.string(), z.unknown()).optional(),
  isAiGenerated: z.boolean().default(true),
  aiOrigin: z.string().optional(),
});

export async function GET(req: Request) {
  const auth = await authenticateRequest(req);
  const authError = authorizeScope(auth, "drafts:read");
  if (authError) return authError;

  const url = new URL(req.url);
  const status = url.searchParams.get("status")?.toUpperCase();
  const entityType = url.searchParams.get("entityType");

  const where: any = {};
  if (status && Object.values(DraftStatus).includes(status as any)) {
    where.status = status as DraftStatus;
  }
  if (entityType) {
    where.entityType = entityType;
  }

  const drafts = await db.draft.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      apiKey: { select: { id: true, name: true, keyPrefix: true } },
    },
  });

  return Response.json({ ok: true, data: drafts });
}

export async function POST(req: Request) {
  const auth = await authenticateRequest(req);
  const authError = authorizeScope(auth, "drafts:create");
  if (authError) return authError;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = CreateDraftSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Validation failed", details: parsed.error.format() },
      { status: 400 }
    );
  }

  const input = parsed.data;

  const draft = await db.draft.create({
    data: {
      entityType: input.entityType,
      entityId: input.entityId || null,
      action: input.action as DraftAction,
      title: input.title,
      summary: input.summary || null,
      data: input.data as any,
      previousData: (input.previousData as any) || null,
      status: "PENDING",
      isAiGenerated: input.isAiGenerated,
      aiOrigin: input.aiOrigin || (auth.apiKey ? `API Key: ${auth.apiKey.name}` : "Agent"),
      createdByApiKeyId: auth.apiKey?.id,
    },
  });

  await recordRevision({
    entityType: "draft",
    entityId: draft.id,
    changeType: "CREATE",
    summary: `Submitted draft: ${draft.title} (${draft.entityType})`,
    newValue: draft,
    apiKeyId: auth.apiKey?.id,
    isAiGenerated: draft.isAiGenerated,
  });

  return Response.json({ ok: true, data: draft }, { status: 201 });
}
