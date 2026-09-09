"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { audit, createSession, rateLimit, verifyPassword } from "@/server/auth";

/**
 * Server Actions carry Next's built-in Origin check, which gives CSRF
 * protection without a token dance (§21).
 */

const LoginInput = z.object({
  email: z.string().email().max(200),
  password: z.string().min(1).max(400),
  next: z.string().optional(),
});

export type LoginState = { error?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = LoginInput.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next"),
  });
  if (!parsed.success) return { error: "Enter a valid email and password." };

  const { email, password } = parsed.data;

  // throttle by IP, then by account, so neither a single source nor a single
  // target can be hammered
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";

  for (const key of [`ip:${ip}`, `email:${email.toLowerCase()}`]) {
    const rl = rateLimit(key);
    if (!rl.ok) {
      await audit(null, "login.rate_limited", "AdminUser", undefined, { email, ip });
      return { error: `Too many attempts. Try again in ${rl.retryInS}s.` };
    }
  }

  const user = await db.adminUser.findUnique({ where: { email: email.toLowerCase() } });

  // Always run a verification, even with no user, so response time doesn't
  // reveal whether the address exists.
  const DUMMY = "scrypt$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
  const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY);

  if (!user || !ok) {
    await audit(null, "login.failed", "AdminUser", undefined, { email, ip });
    // one message for both cases — never confirm which half was wrong
    return { error: "Incorrect email or password." };
  }

  await createSession(user.id);
  await audit(user.id, "login.success", "AdminUser", user.id, { ip });

  // only ever redirect within this site — an open redirect here would be a
  // phishing primitive
  const next = parsed.data.next;
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/admin";
  redirect(safeNext);
}
