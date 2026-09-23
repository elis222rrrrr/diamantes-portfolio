# Developer Guide

Practical "how do I..." for working in this codebase day to day. For _why_ it's laid out this way,
see [ARCHITECTURE.md](../ARCHITECTURE.md); for a specific past decision and its trade-offs, see
[docs/adr/](./adr/). This document assumes you've already done the [README](../README.md)'s local
setup.

## Before you touch anything: read this

**This is not the Next.js you already know.** `AGENTS.md` (in the repo root) exists specifically
because this project pins a Next.js version with breaking changes from what most training data and
tutorials assume — conventions, APIs, and file structure may differ. Check
`node_modules/next/dist/docs/` for the bundled docs on anything that seems off from what you'd
expect, before assuming a pattern from another Next.js project transfers here. Two concrete
examples already caught by doing this: `generateMetadata` works on layouts, not just pages (used in
`app/layout.tsx`), and `next/script`'s `beforeInteractive` scripts always inject into `<head>`
regardless of where they're declared (used for the theme-init script, same file).

## Project structure

See `ARCHITECTURE.md`'s "Layers" section for the full picture. The short version:

```
app/          Routes, layouts, Server Actions ("use server" entry points only)
components/   Presentation
lib/          Domain logic + data access, one subdirectory per bounded context
prisma/       Schema, migrations, seed script
docs/         This file, deployment/maintenance runbooks, ADRs
```

## Common tasks

### Add a new admin-managed content type

Follow the shape every existing one uses (Portfolio, Services are the clearest examples):

1. Add the Prisma model, run `npx prisma migrate dev --name <description>`.
2. `lib/<domain>/repository.ts` — plain functions (`listAll`, `create`, `update`, `delete`), no
   interface. See [ADR 0004](./adr/0004-repository-functions-not-interfaces.md) for why not.
3. `app/admin/(dashboard)/<domain>/{page.tsx, actions.ts, ...Form.tsx, new/page.tsx,
[id]/edit/page.tsx}` — copy the Services or Portfolio directory as a starting template rather than
   writing one from scratch; the shape (list with `ConfirmSubmitButton` delete, Zod-validated
   create/edit form, `requireRoleForAction`, `recordAudit`, `revalidatePath`) is deliberately
   identical across every admin section.
4. If it feeds a shared layout (not just one page) — like `SiteSettings` feeds the root layout's
   JSON-LD and the site layout's Footer — use `revalidatePath("/", { type: "layout" })`, not a
   plain page-level revalidate. Getting this wrong was a real bug caught during the Admin content
   phase; see `ARCHITECTURE.md`'s note on it.

### Add a new Server Action

- Colocate it under `app/`, next to the route it belongs to — even if invoked from a component
  used elsewhere. Never put a `"use server"` entry point in `lib/`.
- If it's reachable **without authentication**, it needs both a Zod schema and a
  `lib/rate-limit.ts` check — every public write action has both; see `docs/api` findings in
  `ARCHITECTURE.md`'s "API surface" section for the one gap that was found and fixed by not
  following this consistently.
- If it's an admin action, gate it with `requireRoleForAction([...])` as the first line, before any
  other logic.
- Return a typed result (`{ error: string } | null`, or a discriminated union like
  `{ ok: false, reason: "..." }`) for anything that can fail in an expected way. Don't let a Prisma
  error propagate to the caller — catch the specific known error code (see `createUserAction`'s
  `P2002` handling, or `deleteProduct`'s `P2003` handling, for the pattern).

### Run a one-off script against the database

Several `lib/*` modules (`lib/prisma.ts`, anything importing it transitively) import the
`server-only` package, which throws outside Next's own build/runtime unless the `react-server`
condition is set. To run a throwaway script (a data check, a one-time backfill) with `tsx` directly:

```bash
NODE_OPTIONS="--conditions=react-server" npx tsx path/to/script.ts
```

Write the script at the project root (so relative imports like `./lib/prisma` resolve), and delete
it once you're done — this repo doesn't keep ad-hoc scripts around; anything worth keeping belongs
in `prisma/seed.ts` or a real repository function instead.

### Inspect the live database directly

`prisma/migrations/*/migration.sql` is a historical diff log, not a snapshot — models that have
been reshaped more than once (`Session` is the clearest example: NextAuth-style table → Redis-only
→ current design) leave stale-looking `CREATE INDEX`/`CREATE TABLE` statements in old migration
files that no longer reflect reality. To check what's actually live, query Postgres's own system
catalogs instead of grepping migration history:

```sql
SELECT tablename, indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' ORDER BY 1, 2;
```

Run via the one-off-script pattern above, or any Postgres client pointed at `DATABASE_URL`.

## Debugging

- **Server Action fails silently in the browser, no error shown** — check the terminal running
  `next dev`; unhandled errors in a Server Action often surface there before (or instead of) the
  client. `components/ConfirmSubmitButton.tsx`'s destructive actions now catch and display errors
  (added during the API optimization pass); a plain `<form action={...}>` submission through
  `useActionState` already surfaces its returned `{ error }` state — but a _thrown_, uncaught
  exception in either case still hits Next's default error boundary.
- **"Failed to find Server Action" after a deploy** — see `ARCHITECTURE.md`'s "Scaling" section;
  this is the `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` issue, relevant even on a single instance across
  a rolling restart if the key isn't pinned.
- **A change to `SiteSettings`/Hero/SEO doesn't show up on pages other than the one you edited** —
  almost always the `revalidatePath` scope issue described above.
- **Sentry** (`NEXT_PUBLIC_SENTRY_DSN`) captures unhandled exceptions and the specific
  `Sentry.captureMessage`/`captureException` calls sprinkled through webhook and backup code for
  conditions that are recoverable but worth knowing about (an oversold order, a failed backup).

## Testing

**Vitest** (`vitest.config.ts`), covering pure/deterministic logic only — no database, no browser,
no mocked Prisma client. Test files are colocated next to the source they cover (`slots.test.ts`
beside `slots.ts`), matched by `**/*.test.ts`.

```bash
npm test          # run once (what CI runs)
npm run test:watch
```

Currently covered: `lib/booking/slots.ts`'s date/timezone math (including a real Athens
EET↔EEST DST-offset check — the actual regression risk with timezone code, not just "does it
run"), `lib/shop/format.ts`'s price formatting, `lib/auth/password.ts`'s hash/verify round-trip,
and `lib/seo/json-ld.ts`'s `safeJsonLd` — the one function standing between admin-editable content
and a JSON-LD XSS, so it gets a test that proves the escape actually breaks a `</script>` injection,
not just that the function runs.

**What isn't covered, and why:**

- **Repository functions** (`lib/*/repository.ts`) aren't tested — they're one line of Prisma-call
  logic each, calling out to a real database. Testing them meaningfully needs either a real test
  database or a mocked Prisma client, neither of which exists yet.
- **Server Actions** aren't tested — same reason, plus they need a request context
  (`headers()`, cookies) to exercise fully.
- **No integration or E2E tests** — nothing spins up the app and clicks through it. The Quality
  audit's Lighthouse runs (see `ARCHITECTURE.md`'s "Quality" section) are the closest thing to an
  end-to-end check today, and those are run manually, not on every push.

**Vitest needed one non-obvious config fix to work at all**: `lib/prisma.ts` imports the
`server-only` marker package, which throws outside the `react-server` module-resolution condition
— `vitest.config.ts` sets `resolve.conditions`/`ssr.resolve.conditions` to `["react-server"]` so
importing any file that transitively imports `lib/prisma.ts` doesn't crash the test file. It also
loads `dotenv/config` as a setup file, since `lib/prisma.ts` constructs its client eagerly at
import time and throws immediately if `DATABASE_URL` is unset — same reason `prisma/seed.ts` loads
dotenv itself. Neither test actually connects to a database; constructing the Prisma client object
doesn't open a connection on its own.

**If you add integration/E2E tests**, [ADR 0004](./adr/0004-repository-functions-not-interfaces.md)'s
"Revisit if" note applies directly: the DI container's three interfaces
(`EmailSender`/`JobQueue`/`EventBus`) were added specifically anticipating this, and are the
natural first thing to inject a fake implementation of.

## Code quality gate

Every change should pass, in this order, before you consider it done:

```bash
npx tsc --noEmit
npm test
npx eslint .
npx prettier --check .
npm run build
```

Husky already runs ESLint + Prettier on staged files at commit time, and commitlint enforces
Conventional Commits on the message — but a full `npm run build` only runs in CI
(`.github/workflows/ci.yml`), not on every commit, since it's too slow for a pre-commit hook.
