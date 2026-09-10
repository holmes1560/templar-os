import "server-only";

import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export interface RecordRevisionParams {
  entityType: string;
  entityId: string;
  changeType: "CREATE" | "UPDATE" | "PUBLISH" | "ARCHIVE" | "RESTORE" | "REVERT" | "DELETE";
  summary?: string;
  previousValue?: unknown;
  newValue?: unknown;
  actorId?: string | null;
  apiKeyId?: string | null;
  isAiGenerated?: boolean;
}

function safeJson(val: unknown): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
  if (val === undefined || val === null) return Prisma.JsonNull;
  try {
    return JSON.parse(
      JSON.stringify(val, (_, v) => (typeof v === "bigint" ? v.toString() : v))
    );
  } catch {
    return Prisma.JsonNull;
  }
}

/**
 * Persists a snapshot diff to the revisions history table (§15).
 */
export async function recordRevision(params: RecordRevisionParams) {
  try {
    return await db.revision.create({
      data: {
        entityType: params.entityType,
        entityId: params.entityId,
        changeType: params.changeType,
        summary: params.summary || null,
        previousValue: safeJson(params.previousValue),
        newValue: safeJson(params.newValue),
        actorId: params.actorId || null,
        apiKeyId: params.apiKeyId || null,
        isAiGenerated: params.isAiGenerated ?? false,
      },
    });
  } catch (err) {
    console.error("[revisions] failed to record revision:", err);
    return null;
  }
}

export interface LogRevisionParams {
  entityType: string;
  entityId: string;
  action?: "CREATE" | "UPDATE" | "PUBLISH" | "ARCHIVE" | "RESTORE" | "REVERT" | "DELETE";
  changeType?: "CREATE" | "UPDATE" | "PUBLISH" | "ARCHIVE" | "RESTORE" | "REVERT" | "DELETE";
  changeSummary?: string;
  summary?: string;
  before?: unknown;
  previousValue?: unknown;
  after?: unknown;
  newValue?: unknown;
  author?: string | null;
  actorId?: string | null;
  apiKeyId?: string | null;
  isAiGenerated?: boolean;
}

export async function logRevision(params: LogRevisionParams) {
  return recordRevision({
    entityType: params.entityType,
    entityId: params.entityId,
    changeType: params.changeType || params.action || "UPDATE",
    summary: params.summary || params.changeSummary || "",
    previousValue: params.previousValue !== undefined ? params.previousValue : params.before,
    newValue: params.newValue !== undefined ? params.newValue : params.after,
    actorId: params.actorId || null,
    apiKeyId: params.apiKeyId || null,
    isAiGenerated: params.isAiGenerated,
  });
}

/**
 * Fetch revisions for a specific entity or across the whole platform.
 */
export async function getRevisions(options?: {
  entityType?: string;
  entityId?: string;
  take?: number;
  skip?: number;
}) {
  const where: Prisma.RevisionWhereInput = {};
  if (options?.entityType) where.entityType = options.entityType;
  if (options?.entityId) where.entityId = options.entityId;

  return db.revision.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: options?.take || 50,
    skip: options?.skip || 0,
    include: {
      actor: { select: { id: true, email: true, name: true } },
      apiKey: { select: { id: true, name: true, keyPrefix: true } },
    },
  });
}
