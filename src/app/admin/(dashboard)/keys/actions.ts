"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/server/auth";
import { createApiKey } from "@/server/api-auth";
import { logRevision } from "@/server/revisions";
import { ApiKeyRole } from "@prisma/client";

export async function createApiKeyAction(formData: FormData) {
  const user = await requireAdmin();

  const name = String(formData.get("name") || "").trim();
  const roleInput = String(formData.get("role") || "CONTENT_EDITOR").toUpperCase();
  const scopesRaw = String(formData.get("scopes") || "").trim();

  if (!name) return { error: "Key name is required." };

  let role: ApiKeyRole = ApiKeyRole.CONTENT_EDITOR;
  if (roleInput === "ADMIN" || roleInput === "FULL_AGENT") role = ApiKeyRole.FULL_AGENT;
  else if (roleInput === "PUBLISHER") role = ApiKeyRole.PUBLISHER;
  else if (roleInput === "READ_ONLY") role = ApiKeyRole.READ_ONLY;
  else if (roleInput === "CUSTOM") role = ApiKeyRole.CUSTOM;

  let customScopes: string[] | undefined = undefined;
  if (scopesRaw) {
    customScopes = scopesRaw.split(",").map((s) => s.trim()).filter(Boolean);
    role = ApiKeyRole.CUSTOM;
  }

  const { apiKey, rawSecret } = await createApiKey({
    name,
    role,
    customScopes,
  });

  await logRevision({
    entityType: "ApiKey",
    entityId: apiKey.id,
    action: "CREATE",
    before: null,
    after: { ...apiKey, keyHash: "[REDACTED]" },
    author: user.email,
    changeSummary: `Generated API Key "${name}" (${role})`,
  });

  revalidatePath("/admin/keys");
  return { success: true, secret: rawSecret, keyName: apiKey.name, keyPrefix: apiKey.keyPrefix, keyId: apiKey.id };
}

export async function revokeApiKeyAction(id: string) {
  const user = await requireAdmin();

  const existing = await db.apiKey.findUnique({ where: { id } });
  if (!existing) return { error: "Key not found." };

  await db.apiKey.update({
    where: { id },
    data: { revokedAt: new Date() },
  });

  await logRevision({
    entityType: "ApiKey",
    entityId: id,
    action: "UPDATE",
    before: existing,
    after: { ...existing, revokedAt: new Date() },
    author: user.email,
    changeSummary: `Revoked API Key "${existing.name}"`,
  });

  revalidatePath("/admin/keys");
  return { success: true };
}
