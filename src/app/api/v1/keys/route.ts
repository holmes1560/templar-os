import { db } from "@/lib/db";
import { authenticateRequest, authorizeScope, createApiKey, ROLE_SCOPES } from "@/server/api-auth";
import { recordRevision } from "@/server/revisions";
import { ApiKeyRole } from "@prisma/client";
import { z } from "zod";

export const dynamic = "force-dynamic";

const CreateKeySchema = z.object({
  name: z.string().trim().min(1).max(100),
  role: z.enum(["READ_ONLY", "CONTENT_EDITOR", "PUBLISHER", "FULL_AGENT", "CUSTOM"]).default("READ_ONLY"),
  customScopes: z.array(z.string()).optional(),
  rateLimitPerMin: z.number().int().min(1).max(1000).optional().default(60),
  expiresInDays: z.number().int().min(1).max(365).optional(),
});

export async function GET(req: Request) {
  const auth = await authenticateRequest(req);
  const authError = authorizeScope(auth, "keys:read");
  if (authError) return authError;

  const keys = await db.apiKey.findMany({
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      role: true,
      scopes: true,
      rateLimitPerMin: true,
      lastUsedAt: true,
      expiresAt: true,
      revokedAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ ok: true, data: keys, availableRoles: Object.keys(ROLE_SCOPES) });
}

export async function POST(req: Request) {
  const auth = await authenticateRequest(req);
  const authError = authorizeScope(auth, "keys:write");
  if (authError) return authError;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = CreateKeySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Validation failed", details: parsed.error.format() },
      { status: 400 }
    );
  }

  const { apiKey, rawSecret } = await createApiKey({
    name: parsed.data.name,
    role: parsed.data.role as ApiKeyRole,
    customScopes: parsed.data.customScopes,
    rateLimitPerMin: parsed.data.rateLimitPerMin,
    expiresInDays: parsed.data.expiresInDays,
  });

  await recordRevision({
    entityType: "api_key",
    entityId: apiKey.id,
    changeType: "CREATE",
    summary: `Created API key: ${apiKey.name} (${apiKey.role})`,
    newValue: {
      id: apiKey.id,
      name: apiKey.name,
      role: apiKey.role,
      scopes: apiKey.scopes,
    },
    apiKeyId: auth.apiKey?.id,
    isAiGenerated: !auth.isSessionAdmin,
  });

  return Response.json(
    {
      ok: true,
      message: "API key created successfully. Save the rawKey now; it will never be shown again.",
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        keyPrefix: apiKey.keyPrefix,
        role: apiKey.role,
        scopes: apiKey.scopes,
        rateLimitPerMin: apiKey.rateLimitPerMin,
        expiresAt: apiKey.expiresAt,
        createdAt: apiKey.createdAt,
      },
      rawKey: rawSecret,
    },
    { status: 201 }
  );
}
