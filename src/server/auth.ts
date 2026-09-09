import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { hashPassword, verifyPassword } from "./password";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

/**
 * Authentication for the single admin account.
 *
 * Deliberately dependency-free. Node ships scrypt (a memory-hard KDF) and
 * HMAC; adding an auth framework here would mean more supply chain, more
 * config, and more ways to be subtly wrong for a system with exactly one
 * user. §28 asks for the smallest clean architecture, and this is it.
 *
 * Security properties:
 *  · passwords stored as scrypt(salt, password), never reversible
 *  · verification is constant-time, so timing can't leak the hash
 *  · session is an HMAC-signed cookie — a tampered payload fails the MAC
 *  · the cookie is httpOnly, so client JavaScript can never read it
 *  · every check happens on the server; the client is never trusted (§2)
 */

const COOKIE = "templar_session";
const SESSION_TTL_S = 60 * 60 * 8; // 8 hours

function secret(): Buffer {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) {
    throw new Error(
      "AUTH_SECRET is missing or too short. Generate one with:\n" +
      "  node -e \"console.log(require('crypto').randomBytes(48).toString('base64url'))\""
    );
  }
  return Buffer.from(s, "utf8");
}

export { hashPassword, verifyPassword };

/* ──────────────────────────── sessions ─────────────────────────── */

type SessionPayload = { sub: string; exp: number };

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function encode(p: SessionPayload): string {
  const body = Buffer.from(JSON.stringify(p)).toString("base64url");
  return `${body}.${sign(body)}`;
}

function decode(token: string): SessionPayload | null {
  const [body, mac] = token.split(".");
  if (!body || !mac) return null;

  const expected = Buffer.from(sign(body));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;

  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString()) as SessionPayload;
    return p.exp > Math.floor(Date.now() / 1000) ? p : null;
  } catch {
    return null;
  }
}

export async function createSession(userId: string) {
  const token = encode({ sub: userId, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_S });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_S,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

/** Reads and validates the session. Returns null for anonymous visitors. */
export async function getSession(): Promise<{ id: string; email: string } | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;

  const payload = decode(token);
  if (!payload) return null;

  // the account must still exist — a deleted admin's cookie must stop working
  const user = await db.adminUser.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true },
  });
  return user ?? null;
}

/**
 * Guard for every admin server action and route handler.
 *
 * Middleware alone is not authorization — it can be bypassed by anything that
 * doesn't route through it, and it can't touch the database. Every privileged
 * operation calls this (§2, §21).
 */
export async function requireAdmin() {
  const user = await getSession();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

/* ───────────────────────── rate limiting ───────────────────────── */

/**
 * In-memory fixed window. Adequate for a single-instance deployment and it
 * costs nothing, which matters on a free tier (§14). If this ever runs on
 * more than one instance, move it to the database or a shared store —
 * per-process counters would let an attacker multiply their attempts.
 */
const attempts = new Map<string, { n: number; resetAt: number }>();

export function rateLimit(key: string, max = 5, windowMs = 60_000) {
  const now = Date.now();
  const rec = attempts.get(key);

  if (!rec || now > rec.resetAt) {
    attempts.set(key, { n: 1, resetAt: now + windowMs });
    return { ok: true, retryInS: 0 };
  }
  if (rec.n >= max) {
    return { ok: false, retryInS: Math.ceil((rec.resetAt - now) / 1000) };
  }
  rec.n += 1;
  return { ok: true, retryInS: 0 };
}

/* ────────────────────────── audit trail ────────────────────────── */

export async function audit(
  actorId: string | null,
  action: string,
  entity: string,
  entityId?: string,
  meta?: Record<string, unknown>
) {
  try {
    await db.auditLog.create({
      data: {
        actorId, action, entity,
        entityId: entityId ?? null,
        meta: (meta ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  } catch {
    // logging must never break the operation it is recording
  }
}
