# Maintenance

Routine operational tasks — what the app already does for itself, and what still needs a human.

## Runs automatically — nothing to do

All three are in-process `setInterval`s started once from `instrumentation.ts`, only in the Node.js
runtime (not during `next build`, not on edge):

| Task                       | Cadence   | What it does                                                                                                                                                                    |
| -------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Job queue sweep            | every 30s | Claims and processes due `Job` rows (`lib/jobs/worker.ts`) — the durable backstop; `after()` already handles the common case immediately post-request.                          |
| Backup check               | hourly    | `runBackupIfDue()` — only actually runs `pg_dump` + uploads to S3 once ~24h since the last success.                                                                             |
| Session / rate-limit sweep | hourly    | Deletes `Session`/`RateLimitBucket` rows past their `expiresAt` — cleanup only; both tables already check expiry on every read, so a missed cycle is never a correctness issue. |

Nothing to schedule externally for any of these — they run as long as the app's Node process does.
An external scheduler hitting `GET /api/jobs/process` (with `CRON_SECRET`) exists as an optional
extra trigger, not a requirement.

## Needs periodic human attention

- **Check `/admin/backups`** occasionally — confirms backups are actually succeeding, not just that
  the interval is running. A backup job that's been silently failing for weeks (bad S3 credentials,
  a full disk on the `pg_dump` temp path) is worse than no backup job, since it creates false
  confidence. See [Backup & Recovery](./BACKUP_AND_RECOVERY.md) for what "success" should mean and
  how to actually test a restore.
- **Check `/admin/login-history`** occasionally for repeated failed attempts — the rate limiter
  throttles brute-forcing, but doesn't alert anyone; a sustained pattern of failures against one
  email or from one IP is worth a look even though it's already been slowed down.
- **Dependency updates.** No automated update PRs (no Dependabot/Renovate configured) — run
  `npm outdated` periodically. Prisma in particular ships frequently; a version drift between
  `prisma`/`@prisma/client`/`@prisma/adapter-pg` in `package.json` is the most common thing worth
  keeping in sync (`npm i --save-dev prisma@latest && npm i @prisma/client@latest
@prisma/adapter-pg@latest`, then re-run the full verification pass in
  [Developer Guide](./DEVELOPER_GUIDE.md) before deploying).
- **Rotate secrets** that don't expire on their own — `CRON_SECRET`, `STRIPE_SECRET_KEY`/
  `STRIPE_WEBHOOK_SECRET`, `AWS_SECRET_ACCESS_KEY`, `RESEND_API_KEY`, `CLOUDINARY_API_SECRET` — on
  whatever cadence your own security policy calls for; nothing in this app rotates them for you.
- **`_prisma_migrations` table drift** — if a migration is ever applied by hand (bypassing
  `prisma migrate deploy`) during an incident, `npx prisma migrate status` will flag the mismatch
  on the next real deploy. Resolve it with `prisma migrate resolve` before deploying further,
  rather than force-applying over a database that's already in the target state.

## Not automated, and that's a deliberate gap

- **Restoring from a backup** is a manual runbook, not a script — see
  [Backup & Recovery](./BACKUP_AND_RECOVERY.md#recovery). Automating disaster recovery has real
  value, but it's also the kind of code that's never exercised until the one day it matters most;
  until this app's operator has a reason to run it more than a handful of times, a clear runbook a
  human follows carefully is more trustworthy than a script that's never been tested against a real
  incident.
- **Cloudinary assets are not backed up at all.** `pg_dump` captures every URL/public_id
  _reference_ stored in Postgres, but the actual images living in Cloudinary are a second system
  with its own retention, outside this app's backup job. See
  [Backup & Recovery](./BACKUP_AND_RECOVERY.md) for the full implication.
