import "server-only";
import { db } from "@/lib/db";
import { cache } from "react";

let cachedCount: { count: number; expiresAt: number } | null = null;

/**
 * Returns the count of pending drafts with in-memory caching and request deduplication.
 * This prevents repeated database count queries when navigating between admin tabs.
 */
export const getPendingDraftsCount = cache(async (): Promise<number> => {
  const now = Date.now();
  if (cachedCount && now < cachedCount.expiresAt) {
    return cachedCount.count;
  }

  try {
    const count = await db.draft.count({ where: { status: "PENDING" } });
    cachedCount = { count, expiresAt: now + 30_000 };
    return count;
  } catch {
    return 0;
  }
});

export function invalidateDraftsCache() {
  cachedCount = null;
}
