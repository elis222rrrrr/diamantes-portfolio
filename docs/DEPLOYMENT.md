# Deployment

This app deploys **self-hosted** — a genuinely long-lived `next start` process, not Vercel or
another serverless platform. See [ADR 0001](./adr/0001-self-hosted-deployment.md) for why; this
document is the runbook for actually doing it.

## Prerequisites

- A host that can run a long-lived Docker container (any VM, or a Docker-capable PaaS) — reachable
  over HTTPS, since Server Actions, Stripe webhooks, and cookie-based sessions all assume it.
- The Postgres database already provisioned (this project targets [Neon](https://neon.tech), but
  any standard Postgres works) — reachable from the host.
- Every environment variable in `.env.example` filled in with real values. In particular:
  `SITE_URL` must be the real public URL (it's used to build absolute links in emails), and
  `STRIPE_WEBHOOK_SECRET` must match the endpoint you register in Stripe's dashboard for
  `https://<your-domain>/api/webhooks/stripe`.

## What CI already does

- **`.github/workflows/ci.yml`** — runs on every push and PR to `main`: `tsc --noEmit`, `eslint`,
  `prettier --check`, `npm run build`. Uses dummy env values (no real secrets needed, since nothing
  in this job talks to a real database or third-party API). A red CI check means don't merge, full
  stop.
- **`.github/workflows/deploy.yml`** — on push to `main`, builds the production Docker image
  (`Dockerfile`) and pushes it to GitHub Container Registry as
  `ghcr.io/<repo>:<sha>` and `ghcr.io/<repo>:latest`. The second job (actually deploying — SSH in,
  pull, restart) is present but **commented out**, since it needs `DEPLOY_HOST`/`DEPLOY_USER`/
  `DEPLOY_SSH_KEY` repository secrets that only make sense once a real server exists.

## First deploy to a new server

1. Provision the host, install Docker + Docker Compose.
2. Copy `.env` (filled in with real, production values — never commit this file) and
   `docker-compose.yml` to the server.
3. Run migrations **before** starting the app for the first time — the production image
   deliberately doesn't include the Prisma CLI (only the generated client, to keep the image
   minimal), so this needs the full toolchain, run from a machine with this repo checked out and
   `DATABASE_URL` pointed at the production database:
   ```bash
   npx prisma migrate deploy
   ```
4. Seed the initial Owner account (same toolchain, same `DATABASE_URL`):
   ```bash
   npx prisma db seed
   ```
5. On the server: `docker compose up -d --build` (or `docker compose pull && docker compose up -d`
   once an image is already in GHCR).
6. Verify: `curl https://<your-domain>/api/health` should return `{ "status": "ok" }`. Log into
   `/admin/login` with the seeded Owner credentials.
7. Point Stripe's webhook configuration at `https://<your-domain>/api/webhooks/stripe` and confirm
   `STRIPE_WEBHOOK_SECRET` matches what Stripe's dashboard shows for that endpoint.

## Subsequent deploys

Migrations are **not** run automatically as part of the container starting — the deploy step is
always: run `npx prisma migrate deploy` against production first (from a machine with the
toolchain), _then_ restart the app with the new image. Running them in the other order risks the
old code briefly running against a schema it doesn't expect, or vice versa.

To activate the currently-commented-out automatic deploy in `.github/workflows/deploy.yml`:

1. Add repository secrets: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`.
2. Uncomment the `deploy:` job — it's a standard "SSH in, `docker pull`, `docker compose up -d`"
   step, already written.
3. Decide where `prisma migrate deploy` fits in that automation — it isn't wired in yet, since
   running schema migrations unattended from CI is a judgment call each team should make
   deliberately (a migration that locks a large table, for instance, might warrant a maintenance
   window rather than a silent CI step). Until you decide, keep running it manually, as in "First
   deploy" above.

## Rollback

- **Application code**: `docker pull ghcr.io/<repo>:<previous-sha>` and restart — every build is
  tagged with its commit SHA, not just `latest`, specifically so this is possible.
- **Schema**: Prisma migrations are forward-only by design; there's no `migrate down`. Rolling back
  a bad migration means writing and applying a new, corrective migration — or restoring from a
  backup if the migration already caused data loss. See
  [Backup & Recovery](./BACKUP_AND_RECOVERY.md).

## Scaling beyond one instance

Read [ARCHITECTURE.md](../ARCHITECTURE.md)'s "Scaling" section in full before doing this — the job
queue and backup lock are already safe across replicas, but two things are not yet configured and
must be before running more than one:

1. **`NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`** — set to the same value across every replica, or
   requests will randomly fail with "Failed to find Server Action" when they land on a different
   instance than the one that rendered the page.
2. **A shared cache handler** — `revalidatePath` only invalidates the replica that handled the
   request by default; other replicas keep serving stale data. Needs a `cacheHandler` pointed at a
   shared store (Postgres or otherwise) instead of the default per-instance filesystem cache.

Neither is built today — this deployment is a single instance, and the defaults are correct for
that case.

## Monitoring

- **`GET /api/health`** — the uptime-monitor target; hit this from an external monitor (UptimeRobot,
  a status-page service, or your host's own health check), not from inside the app.
- **Sentry** (`NEXT_PUBLIC_SENTRY_DSN`) — unhandled exceptions and explicit `captureMessage`/
  `captureException` calls for recoverable-but-notable conditions (an oversold order, a failed
  backup, a Stripe webhook signature failure).
- **`/admin/backups`** and **`/admin/login-history`** — the two admin pages worth checking
  periodically even without an alert firing; see [Maintenance](./MAINTENANCE.md).
