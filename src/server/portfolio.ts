import "server-only";

import snapshot from "@/data/snapshot.json";
import { queryDatabase } from "./portfolio-query";
import type { PortfolioData } from "@/lib/portfolio-types";

/**
 * The public read path.
 *
 * §16 is the constraint that shapes this: the portfolio must not go down
 * because something it depends on is unavailable. Making the site
 * database-driven introduced a new single point of failure — a free-tier
 * Postgres that suspends when idle — so this layer never lets a database
 * problem reach a visitor.
 *
 *   1. Pages render with ISR, so the database is queried on revalidation,
 *      not on every request. Visitors are served static output.
 *   2. Any failure — down, asleep, slow — falls back to a snapshot that is
 *      committed to the repo and bundled at build time.
 *
 * Worst case the portfolio is stale. It is never broken.
 */

const DB_TIMEOUT_MS = 4000;

/** the committed fallback, typed on the way out */
function fromSnapshot(): PortfolioData {
  return { ...(snapshot as unknown as PortfolioData), stale: true };
}

export async function getPortfolio(): Promise<PortfolioData> {
  try {
    // a suspended database that never answers is as bad as one that errors
    return await Promise.race([
      queryDatabase(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("database timeout")), DB_TIMEOUT_MS)
      ),
    ]);
  } catch (err) {
    console.warn(
      "[portfolio] database unavailable, serving committed snapshot:",
      err instanceof Error ? err.message : err
    );
    return fromSnapshot();
  }
}

/** Used by the snapshot script — deliberately has no fallback, so a broken
 *  database fails the snapshot build loudly instead of overwriting good data
 *  with an empty portfolio. */
export const getPortfolioStrict = queryDatabase;
