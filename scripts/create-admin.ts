/**
 * Creates or updates the single admin account.
 *
 *   pnpm admin:create
 *
 * The password is read from a hidden prompt — never from an argument, so it
 * can't end up in shell history or a process listing, and never generated,
 * so this script cannot leave behind a credential someone else knows.
 */
import { createInterface } from "node:readline";
import { db } from "../src/lib/db";
import { hashPassword } from "../src/server/password";

function ask(question: string, hidden = false): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });

  if (!hidden) {
    return new Promise((res) => rl.question(question, (a) => { rl.close(); res(a.trim()); }));
  }

  // suppress echo so the password never appears on screen
  return new Promise((res) => {
    const stdin = process.stdin;
    process.stdout.write(question);
    const onData = (chunk: Buffer) => {
      const s = chunk.toString();
      if (s === "\n" || s === "\r" || s === "") {
        stdin.removeListener("data", onData);
        process.stdout.write("\n");
      }
    };
    stdin.on("data", onData);
    // @ts-expect-error - _writeToOutput is internal but the standard way to mask
    rl._writeToOutput = () => {};
    rl.question("", (a) => { rl.close(); res(a.trim()); });
  });
}

async function main() {
  if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32) {
    console.error(
      "\n✗ AUTH_SECRET is missing or too short.\n\n" +
      "  Add this to .env, using a fresh value:\n" +
      '  AUTH_SECRET="' + (await import("node:crypto")).randomBytes(48).toString("base64url") + '"\n'
    );
    process.exit(1);
  }

  const email = (await ask("Admin email: ")).toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    console.error("✗ That doesn't look like an email address.");
    process.exit(1);
  }

  const password = await ask("Password (hidden): ", true);
  if (password.length < 12) {
    console.error("✗ Use at least 12 characters. This is the only account.");
    process.exit(1);
  }
  const again = await ask("Confirm password: ", true);
  if (password !== again) {
    console.error("✗ Passwords don't match.");
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);
  const user = await db.adminUser.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash },
  });

  const total = await db.adminUser.count();
  console.log(`\n✓ Admin ready: ${user.email}`);
  console.log(`  ${total} account${total === 1 ? "" : "s"} exist. Sign in at /admin/login\n`);
}

main()
  .catch((e) => { console.error("✗", e.message ?? e); process.exit(1); })
  .finally(() => db.$disconnect());
