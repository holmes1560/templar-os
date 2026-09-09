import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

/**
 * Password hashing, deliberately free of the `server-only` guard so the
 * admin-creation CLI can use the exact same code path the login does.
 * Two implementations would be two chances to disagree.
 */

const scryptAsync = promisify(scrypt) as (
  password: string, salt: Buffer, keylen: number
) => Promise<Buffer>;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt, 64);
  return `scrypt$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, saltB64, keyB64] = stored.split("$");
  if (scheme !== "scrypt" || !saltB64 || !keyB64) return false;

  const expected = Buffer.from(keyB64, "base64");
  const actual = await scryptAsync(password, Buffer.from(saltB64, "base64"), expected.length);

  // constant-time: never branch on how much of the hash matched
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
