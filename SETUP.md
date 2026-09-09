# TEMPLAR OS — setup

Everything here is a one-time step. None of it needs repeating to add a project later.

---

## 1. Database

Local development uses Docker:

```bash
docker run -d --name templar-db \
  -e POSTGRES_USER=templar -e POSTGRES_PASSWORD=templar -e POSTGRES_DB=templar_os \
  -p 5439:5432 postgres:17-alpine
```

> Port 5439 deliberately — 5432 is the system Postgres and 5433 is the TaaS dev database.

Production uses Neon. Create a project, then set `DATABASE_URL` and run:

```bash
pnpm exec prisma migrate deploy
```

---

## 2. Environment variables

`.env` is gitignored. Nothing in this file may ever reach the client bundle.

```ini
DATABASE_URL="postgresql://…"

# Signs session cookies. Rotating it signs everyone out.
AUTH_SECRET="…"

# Encrypts secrets held in the database (GitHub tokens).
# Falls back to AUTH_SECRET if unset, but a separate key is better:
# rotating your session key then can't lock you out of your integrations.
ENCRYPTION_KEY="…"
```

Generate either with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

---

## 3. Admin account

```bash
pnpm admin:create
```

Hidden prompt, minimum 12 characters. The script never generates a password and
never accepts one as an argument, so nothing lands in your shell history.

Sign in at `/admin/login`.

---

## 4. AI importer

```ini
ANTHROPIC_API_KEY="sk-ant-…"
```

Server-side only. Without it the importer reports that it is unconfigured
rather than failing obscurely; every other part of the admin panel keeps working.

---

## 5. GitHub App

This powers the repository picker and sync. **Optional** — manual project
creation works without it.

### Register the app

Go to **github.com/settings/apps/new** and set:

| Field | Value |
|---|---|
| Name | anything, e.g. `templar-os-portfolio` |
| Homepage URL | `http://localhost:3100` (your domain in production) |
| Callback URL | `http://localhost:3100/api/github/callback` |
| Request user authorization (OAuth) during installation | **checked** |
| Webhook | **uncheck Active** — not used yet |

**Repository permissions** — read-only, nothing else:

- **Contents** → Read-only (needed to read README and config files)
- **Metadata** → Read-only (mandatory, granted automatically)

Do not grant write access to anything. The integration only ever reads.

### After creating it

1. Note the **App ID**
2. Generate a **client secret**
3. Generate a **private key** — downloads a `.pem`
4. **Install** the app on your account, choosing *Only select repositories*

That last step is the point of using a GitHub App rather than an OAuth App:
you choose which repositories it can see, and you can change or revoke that
from GitHub at any time without touching this codebase.

### Environment

```ini
GITHUB_APP_ID="123456"
GITHUB_CLIENT_ID="Iv1.…"
GITHUB_CLIENT_SECRET="…"
GITHUB_CALLBACK_URL="http://localhost:3100/api/github/callback"

# The .pem contents. Keep the literal \n escapes on one line:
GITHUB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIE…\n-----END RSA PRIVATE KEY-----\n"
```

Connect it from **Settings → Integrations → GitHub** in the admin panel.

> Disconnecting GitHub does not delete any project. It only removes the
> ability to import and sync through that connection.

---

## Everyday commands

```bash
pnpm dev              # dev server on :3100
pnpm admin:create     # create or update the admin account
pnpm db:migrate       # apply schema changes
pnpm db:studio        # browse the database
pnpm db:snapshot      # refresh the offline fallback — see below
```

### About the snapshot

`src/data/snapshot.json` is what the portfolio serves when the database is
unreachable, so a sleeping free-tier Postgres degrades to slightly stale
content instead of an error page.

Refresh and commit it after meaningful content changes. The script refuses to
write a snapshot containing zero projects, so a broken database can never
replace a good fallback with an empty one.
