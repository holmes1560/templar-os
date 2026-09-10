import { db } from "@/lib/db";
import { authenticateRequest, authorizeScope, createApiKey } from "@/server/api-auth";
import { recordRevision } from "@/server/revisions";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/v1/keys/[id]
 *
 * Revoke an API key immediately.
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(req);
  const authError = authorizeScope(auth, "keys:write");
  if (authError) return authError;

  const { id } = await params;
  const existing = await db.apiKey.findUnique({ where: { id } });
  if (!existing) {
    return Response.json({ ok: false, error: "API key not found" }, { status: 404 });
  }

  const revoked = await db.apiKey.update({
    where: { id },
    data: { revokedAt: new Date() },
  });

  await recordRevision({
    entityType: "api_key",
    entityId: id,
    changeType: "UPDATE",
    summary: `Revoked API key: ${existing.name}`,
    previousValue: { revokedAt: null },
    newValue: { revokedAt: revoked.revokedAt },
    apiKeyId: auth.apiKey?.id,
    isAiGenerated: !auth.isSessionAdmin,
  });

  return Response.json({ ok: true, message: `API key ${existing.name} revoked successfully.` });
}

/**
 * POST /api/v1/keys/[id]
 * Action: Rotate the key (revokes previous key, creates a new key with identical configuration and scopes)
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(req);
  const authError = authorizeScope(auth, "keys:write");
  if (authError) return authError;

  const { id } = await params;
  const existing = await db.apiKey.findUnique({ where: { id } });
  if (!existing) {
    return Response.json({ ok: false, error: "API key not found" }, { status: 404 });
  }

  // Revoke old key
  await db.apiKey.update({
    where: { id },
    data: { revokedAt: new Date() },
  });

  // Create new key with same name, role, scopes, rate limit
  const { apiKey, rawSecret } = await createApiKey({
    name: `${existing.name} (Rotated)`,
    role: existing.role,
    customScopes: existing.scopes,
    rateLimitPerMin: existing.rateLimitPerMin,
  });

  await recordRevision({
    entityType: "api_key",
    entityId: apiKey.id,
    changeType: "UPDATE",
    summary: `Rotated API key ${existing.name} -> ${apiKey.name}`,
    previousValue: { oldKeyId: existing.id },
    newValue: { newKeyId: apiKey.id },
    apiKeyId: auth.apiKey?.id,
    isAiGenerated: !auth.isSessionAdmin,
  });

  return Response.json({
    ok: true,
    message: "Key rotated successfully. Old key is revoked; save the new key now.",
    apiKey: {
      id: apiKey.id,
      name: apiKey.name,
      keyPrefix: apiKey.keyPrefix,
      role: apiKey.role,
      scopes: apiKey.scopes,
      rateLimitPerMin: apiKey.rateLimitPerMin,
      createdAt: apiKey.createdAt,
    },
    rawKey: rawSecret,
  });
}
