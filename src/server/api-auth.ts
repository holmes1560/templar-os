import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { getSession } from "./auth";
import type { ApiKey, ApiKeyRole } from "@prisma/client";

/**
 * Fine-grained API key authentication and authorization for external AI agents
 * and integrations (§5, §18).
 *
 * Security properties:
 *  - Keys are generated with 24 cryptographically random bytes (192 bits entropy)
 *  - Formatted with a recognisable prefix: tpl_live_<base64url>
 *  - Only SHA-256 hashes are persisted in the database
 *  - Raw secret is returned once upon creation and NEVER stored
 *  - Endpoints verify granular permission scopes with wildcard inheritance
 *  - In-memory rate limiting per key with configurable limits
 *  - Rejection of revoked or expired keys with explicit error messages
 */

export const ROLE_SCOPES: Record<ApiKeyRole, string[]> = {
  READ_ONLY: [
    "portfolio:read",
    "profile:read",
    "about:read",
    "skills:read",
    "projects:read",
    "timeline:read",
    "experience:read",
    "education:read",
    "certifications:read",
    "achievements:read",
    "resume:read",
    "contact:read",
    "socials:read",
    "drafts:read",
    "revisions:read",
  ],
  CONTENT_EDITOR: [
    "portfolio:read",
    "profile:read", "profile:write",
    "about:read", "about:write",
    "skills:read", "skills:write",
    "projects:read", "projects:create", "projects:update",
    "timeline:read", "timeline:write",
    "experience:read", "experience:write",
    "education:read", "education:write",
    "certifications:read", "certifications:write",
    "achievements:read", "achievements:write",
    "resume:read", "resume:write",
    "contact:read", "contact:write",
    "socials:read", "socials:write",
    "drafts:read", "drafts:create", "drafts:update",
    "revisions:read",
  ],
  PUBLISHER: [
    "portfolio:read",
    "profile:read", "profile:write",
    "about:read", "about:write",
    "skills:read", "skills:write",
    "projects:read", "projects:create", "projects:update", "projects:publish",
    "timeline:read", "timeline:write",
    "experience:read", "experience:write",
    "education:read", "education:write",
    "certifications:read", "certifications:write",
    "achievements:read", "achievements:write",
    "resume:read", "resume:write",
    "contact:read", "contact:write",
    "socials:read", "socials:write",
    "drafts:read", "drafts:create", "drafts:update", "drafts:approve", "drafts:publish",
    "revisions:read",
  ],
  FULL_AGENT: ["*"],
  CUSTOM: [],
};

export interface AuthContext {
  authenticated: boolean;
  isSessionAdmin: boolean;
  apiKey?: ApiKey;
  scopes: string[];
  error?: string;
  statusCode?: number;
}

// In-memory rate limiting bucket per key
const keyUsageBuckets = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(keyId: string, limitPerMin: number): boolean {
  const now = Date.now();
  const bucket = keyUsageBuckets.get(keyId);

  if (!bucket || now > bucket.resetAt) {
    keyUsageBuckets.set(keyId, { count: 1, resetAt: now + 60_000 });
    return true;
  }

  if (bucket.count >= limitPerMin) {
    return false;
  }

  bucket.count += 1;
  return true;
}

export function hashApiKey(rawKey: string): string {
  return createHash("sha256").update(rawKey.trim()).digest("hex");
}

export async function createApiKey(params: {
  name: string;
  role: ApiKeyRole;
  customScopes?: string[];
  rateLimitPerMin?: number;
  expiresInDays?: number;
}): Promise<{ apiKey: ApiKey; rawSecret: string }> {
  const rawSecret = `tpl_live_${randomBytes(24).toString("base64url")}`;
  const keyHash = hashApiKey(rawSecret);
  const keyPrefix = rawSecret.slice(0, 12);

  const scopes =
    params.role === "CUSTOM"
      ? params.customScopes || []
      : ROLE_SCOPES[params.role] || ["portfolio:read"];

  const expiresAt = params.expiresInDays
    ? new Date(Date.now() + params.expiresInDays * 24 * 60 * 60 * 1000)
    : null;

  const apiKey = await db.apiKey.create({
    data: {
      name: params.name.trim(),
      keyPrefix,
      keyHash,
      role: params.role,
      scopes,
      rateLimitPerMin: params.rateLimitPerMin || 60,
      expiresAt,
    },
  });

  return { apiKey, rawSecret };
}

/**
 * Authenticate incoming request via Bearer token, X-API-Key header, or admin session cookie.
 */
export async function authenticateRequest(req: Request): Promise<AuthContext> {
  // 1. Check if logged in via admin session cookie
  try {
    const adminUser = await getSession();
    if (adminUser) {
      return {
        authenticated: true,
        isSessionAdmin: true,
        scopes: ["*"],
      };
    }
  } catch {
    // ignore cookie failure
  }

  // 2. Extract API Key from headers
  const authHeader = req.headers.get("Authorization");
  const xApiKey = req.headers.get("X-API-Key");

  let rawKey: string | null = null;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    rawKey = authHeader.slice(7).trim();
  } else if (xApiKey) {
    rawKey = xApiKey.trim();
  }

  if (!rawKey) {
    return {
      authenticated: false,
      isSessionAdmin: false,
      scopes: [],
      error: "Missing API Key. Provide 'Authorization: Bearer <key>' or 'X-API-Key: <key>' header.",
      statusCode: 401,
    };
  }

  const hash = hashApiKey(rawKey);
  const apiKeyRecord = await db.apiKey.findUnique({
    where: { keyHash: hash },
  });

  if (!apiKeyRecord) {
    return {
      authenticated: false,
      isSessionAdmin: false,
      scopes: [],
      error: "Invalid API Key.",
      statusCode: 401,
    };
  }

  if (apiKeyRecord.revokedAt) {
    return {
      authenticated: false,
      isSessionAdmin: false,
      scopes: [],
      error: "This API Key has been revoked.",
      statusCode: 403,
    };
  }

  if (apiKeyRecord.expiresAt && apiKeyRecord.expiresAt < new Date()) {
    return {
      authenticated: false,
      isSessionAdmin: false,
      scopes: [],
      error: "This API Key has expired.",
      statusCode: 403,
    };
  }

  // Rate limiting check
  if (!checkRateLimit(apiKeyRecord.id, apiKeyRecord.rateLimitPerMin)) {
    return {
      authenticated: false,
      isSessionAdmin: false,
      scopes: apiKeyRecord.scopes,
      error: `Rate limit exceeded (${apiKeyRecord.rateLimitPerMin} requests/min). Try again shortly.`,
      statusCode: 429,
    };
  }

  // Asynchronously record lastUsedAt (fire & forget to keep response fast)
  db.apiKey
    .update({
      where: { id: apiKeyRecord.id },
      data: { lastUsedAt: new Date() },
    })
    .catch(() => {});

  return {
    authenticated: true,
    isSessionAdmin: false,
    apiKey: apiKeyRecord,
    scopes: apiKeyRecord.scopes,
  };
}

/**
 * Check whether the granted scopes satisfy the required scope.
 * Supports wildcards:
 *   - '*' matches everything
 *   - 'projects:*' matches 'projects:read', 'projects:create', etc.
 */
export function hasScope(grantedScopes: string[], requiredScope: string): boolean {
  if (grantedScopes.includes("*")) return true;
  if (grantedScopes.includes(requiredScope)) return true;

  const [resource, action] = requiredScope.split(":");
  if (resource && grantedScopes.includes(`${resource}:*`)) return true;
  if (action === "read" && grantedScopes.includes(`${resource}:write`)) return true;

  return false;
}

/**
 * Guard utility for Route Handlers. Returns standard JSON error response if unauthorized.
 */
export function authorizeScope(auth: AuthContext, requiredScope: string): Response | null {
  if (!auth.authenticated) {
    return Response.json(
      { ok: false, error: auth.error || "Unauthorized" },
      { status: auth.statusCode || 401 }
    );
  }

  if (!hasScope(auth.scopes, requiredScope)) {
    return Response.json(
      {
        ok: false,
        error: `Forbidden: Missing required permission '${requiredScope}'.`,
        grantedScopes: auth.scopes,
      },
      { status: 403 }
    );
  }

  return null;
}
