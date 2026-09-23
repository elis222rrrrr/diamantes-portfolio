# Diamantes 3Designs

A Next.js 16 App Router site: a marketing site plus booking, contact, and newsletter features, with an authenticated admin panel.

**This is not the Next.js you already know** — this project pins a version with breaking changes from what most tutorials/training data assume. Read `AGENTS.md` before writing code.

## Documentation map

| Doc                                                          | What's in it                                                                 |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| This README                                                  | Quick start — install, run, deploy, verify.                                  |
| [ARCHITECTURE.md](./ARCHITECTURE.md)                         | How the codebase is laid out and why — layers, conventions, trade-offs made. |
| [docs/DEVELOPER_GUIDE.md](./docs/DEVELOPER_GUIDE.md)         | Day-to-day "how do I..." — common tasks, debugging, testing status.          |
| [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)                   | Full deploy runbook — first deploy, subsequent deploys, rollback, scaling.   |
| [docs/MAINTENANCE.md](./docs/MAINTENANCE.md)                 | What runs automatically vs. what needs periodic human attention.             |
| [docs/BACKUP_AND_RECOVERY.md](./docs/BACKUP_AND_RECOVERY.md) | What's backed up, and the step-by-step restore runbook.                      |
| [docs/adr/](./docs/adr/)                                     | Architecture Decision Records — one file per significant past decision.      |
| [docs/ROADMAP.md](./docs/ROADMAP.md)                         | Candidate future directions assessed against the current architecture.       |

## Requirements

- Node 20
- A Postgres database (this project uses [Neon](https://neon.tech), but any standard Postgres works — see `DATABASE_URL` in `.env.example`) — this is also where sessions and rate-limit counters live, so no separate cache/session store is needed
- An S3 bucket (automated backups), Resend account (email), Cloudinary account (file uploads), and optionally Sentry (error tracking)

## Local development

```bash
cp .env.example .env
# fill in .env — at minimum DATABASE_URL, OWNER_EMAIL/PASSWORD/NAME

npm install
npx prisma migrate dev
npx prisma db seed   # creates the initial Owner admin account

npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Running everything in Docker

```bash
docker compose up --build
```

This builds the app image (`Dockerfile`, a multi-stage `output: "standalone"` build). Postgres stays external — point `DATABASE_URL` in `.env` at your existing database; it isn't containerized here.

Migrations are **not** run automatically inside the container (the minimal production image doesn't include the Prisma CLI, only the generated client). Run them separately with the full toolchain before starting/restarting the app:

```bash
npx prisma migrate deploy
```

## Deployment

This project deploys **self-hosted** (`next start` via the Docker image above), not to Vercel — see [ADR 0001](./docs/adr/0001-self-hosted-deployment.md) for why. **Full runbook: [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)** (first deploy, subsequent deploys, rollback, scaling to more than one instance).

Quick summary:

- `.github/workflows/ci.yml` runs typecheck/lint/format/build on every push and PR.
- `.github/workflows/deploy.yml` builds and pushes the Docker image to GitHub Container Registry (GHCR) on push to `main`. The actual "pull the new image and restart on the server" step is commented out in that file — it needs `DEPLOY_HOST`/`DEPLOY_SSH_KEY` secrets that only make sense once there's a real server to deploy to.
- Migrations are **not** run automatically — always `npx prisma migrate deploy` against production before restarting the app with new code, never after.

## Environment variables

`.env.example` is the authoritative reference — every variable there has an inline comment explaining what it's for and where it's consumed. Summary:

| Variable                                                                  | Required?                 | Purpose                                                                                         |
| ------------------------------------------------------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                                                            | Yes                       | Postgres — also backs sessions/rate limiting, no separate cache needed.                         |
| `OWNER_EMAIL` / `OWNER_PASSWORD` / `OWNER_NAME`                           | Yes, for `prisma db seed` | Initial admin account. Never read outside seed time.                                            |
| `SITE_URL`                                                                | Yes                       | Absolute URL used in emails/links (no `NEXT_PUBLIC_` — server-only).                            |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL`                                    | Yes                       | Transactional email (bookings, contact notifications).                                          |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET`                      | Yes                       | Contact-form attachments, product/portfolio images, the Media library.                          |
| `S3_BUCKET` / `S3_REGION` / `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | Yes                       | Automated daily database backups — see [Backup & Recovery](./docs/BACKUP_AND_RECOVERY.md).      |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`                             | Yes, for the shop         | Checkout + payment-confirmation webhook.                                                        |
| `NEXT_PUBLIC_SENTRY_DSN` / `SENTRY_AUTH_TOKEN`                            | Optional                  | Error tracking; auth token only needed for source-map upload.                                   |
| `CRON_SECRET`                                                             | Optional                  | Protects the manual `GET /api/jobs/process` trigger — the in-process interval works without it. |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID`                                           | Optional                  | Google Analytics — only loads after cookie consent.                                             |

## Testing

Vitest, covering pure/deterministic logic — date/timezone math, price formatting, password
hashing, JSON-LD XSS escaping. No integration or E2E tests yet (no real database or browser is
exercised) — see [docs/DEVELOPER_GUIDE.md](./docs/DEVELOPER_GUIDE.md#testing) for exactly what's
covered and what isn't.

```bash
npm test        # run once
npm run test:watch
```

## Code quality

```bash
npx tsc --noEmit       # typecheck
npm test               # unit tests
npx eslint .           # lint
npx prettier --check . # format check
npm run build          # production build
```

Husky runs lint-staged (ESLint + Prettier) on commit and commitlint (Conventional Commits) on commit messages.
