import { createCipheriv, createDecipheriv, randomBytes, createHash } from "node:crypto";

/**
 * Authenticated encryption for secrets held in the database.
 *
 * The GitHub connection row grants read access to the owner's repositories.
 * Stored as plaintext it would leak through any of the ordinary accidents —
 * a database backup, a screenshot of a DB browser, a log line, a support
 * export. Encrypting it means possession of the database alone is not enough.
 *
 * AES-256-GCM rather than CBC: GCM authenticates the ciphertext, so tampering
 * is detected on decrypt instead of silently producing garbage plaintext.
 *
 * The key is derived from ENCRYPTION_KEY (or AUTH_SECRET as a fallback) via
 * SHA-256, so any sufficiently long secret yields a valid 32-byte key.
 */

const ALGO = "aes-256-gcm";

function key(): Buffer {
  const raw = process.env.ENCRYPTION_KEY || process.env.AUTH_SECRET;
  if (!raw || raw.length < 32) {
    throw new Error(
      "ENCRYPTION_KEY (or AUTH_SECRET) is missing or too short — refusing to store secrets weakly."
    );
  }
  return createHash("sha256").update(raw).digest();
}

/** → "v1.<iv>.<authTag>.<ciphertext>", all base64url */
export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12); // 96-bit nonce, the GCM standard
  const cipher = createCipheriv(ALGO, key(), iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    "v1",
    iv.toString("base64url"),
    tag.toString("base64url"),
    ct.toString("base64url"),
  ].join(".");
}

/**
 * Returns null rather than throwing when a value can't be decrypted — a
 * rotated key or a corrupted row should surface as "reconnect GitHub", not
 * as a crashed admin panel (§22).
 */
export function decryptSecret(stored: string): string | null {
  try {
    const [version, ivB64, tagB64, ctB64] = stored.split(".");
    if (version !== "v1" || !ivB64 || !tagB64 || !ctB64) return null;

    const decipher = createDecipheriv(ALGO, key(), Buffer.from(ivB64, "base64url"));
    decipher.setAuthTag(Buffer.from(tagB64, "base64url"));

    return Buffer.concat([
      decipher.update(Buffer.from(ctB64, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return null;
  }
}
