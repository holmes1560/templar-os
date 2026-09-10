import { db } from "@/lib/db";
import { requireAdmin } from "@/server/auth";
import { KeysManager } from "./KeysManager";

export const dynamic = "force-dynamic";

export default async function AdminKeysPage() {
  await requireAdmin();

  const keys = await db.apiKey.findMany({
    orderBy: { createdAt: "desc" },
  });

  const serialized = keys.map((k) => ({
    id: k.id,
    name: k.name,
    keyPrefix: k.keyPrefix,
    role: k.role,
    scopes: k.scopes,
    isActive: !k.revokedAt && (!k.expiresAt || k.expiresAt > new Date()),
    createdAt: k.createdAt.toISOString(),
    lastUsedAt: k.lastUsedAt ? k.lastUsedAt.toISOString() : null,
  }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-lg font-semibold tracking-tight text-[var(--os-fg)]">
          API Keys & Agent Access
        </h1>
        <p className="text-sm text-[var(--os-fg-muted)]">
          Provision secure bearer tokens for Claude Code, Antigravity, Cursor, and automated scripts with granular capability scopes.
        </p>
      </div>

      <KeysManager keys={serialized} />
    </div>
  );
}
