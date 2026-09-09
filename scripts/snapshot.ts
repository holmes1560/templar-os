/**
 * Writes src/data/snapshot.json — the fallback the portfolio serves when the
 * database is unreachable (§16).
 *
 * Run it after content changes and commit the result. It intentionally has no
 * error fallback: if the database is broken, the run fails and the previous
 * good snapshot stays on disk. Overwriting a working fallback with an empty
 * portfolio would defeat the entire point.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { queryDatabase } from "../src/server/portfolio-query";
import { db } from "../src/lib/db";

const OUT = resolve(process.cwd(), "src/data/snapshot.json");

async function main() {
  const data = await queryDatabase();

  if (data.projects.length === 0) {
    throw new Error("refusing to write a snapshot with zero projects");
  }

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(data, null, 2) + "\n");

  console.log(
    `✓ snapshot written — ${data.projects.length} projects, ${data.apps.length} applications`
  );
}

main()
  .catch((e) => {
    console.error("✗ snapshot failed (previous snapshot left intact):", e.message ?? e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
