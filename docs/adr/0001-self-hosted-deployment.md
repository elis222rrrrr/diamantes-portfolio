# 0001. Self-hosted deployment, not Vercel/serverless

Status: Accepted
Date: 2026-07-21 (recorded retroactively)

## Context

Next.js's own docs and defaults lean toward Vercel — Vercel Cron for scheduled work, a managed
edge cache, zero-config serverless functions. This app needed a durable background job queue
(email delivery, retries), a recurring backup job, and periodic cleanup sweeps (expired sessions,
rate-limit buckets), all of which are naturally suited to a long-lived process, not a
request-scoped serverless function that can be frozen or recycled between invocations.

## Decision

Deploy as a genuinely long-lived Node process (`next start`, via the Docker image in `Dockerfile`),
not to Vercel or another serverless platform.

## Consequences

- A single in-process `setInterval` (`instrumentation.ts`) is a complete, dependency-free
  scheduler for the job queue, backup check, and expiry sweeps — no external cron provider needed.
  This would not work on Vercel, where a serverless function has no persistent process to hold an
  interval across requests.
- Trades away Vercel's zero-ops scaling and edge network for direct responsibility over the host:
  provisioning, TLS, restarts, and the two prerequisites documented in `ARCHITECTURE.md`'s "Scaling"
  section (`NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`, a shared cache handler) before running more than
  one replica.
- `.github/workflows/deploy.yml` builds and pushes a Docker image to GHCR on every push to `main`;
  the actual "pull and restart" step is deliberately commented out until real server infrastructure
  exists — see [Deployment](../DEPLOYMENT.md).
- **Revisit if:** traffic or team size grows to where managed infrastructure's ops savings outweigh
  the background-job architecture's simplicity — that would mean re-introducing an external queue
  (e.g. a managed cron trigger calling `/api/jobs/process`) rather than the in-process interval.
