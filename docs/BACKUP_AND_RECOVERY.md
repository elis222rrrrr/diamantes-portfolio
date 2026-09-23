# Backup & Recovery

Backup is fully automated. Recovery, until this document, was not written down anywhere — an
untested, undocumented recovery path is close to having none at all. This is the runbook.

## Backup

`lib/backup/run.ts`'s `runBackupIfDue()` is checked hourly (`instrumentation.ts`) but only actually
acts once ~24h have passed since the last success, and only on whichever replica wins a Postgres
advisory lock — safe to run redundantly across multiple instances without duplicate uploads.

1. `pg_dump <DATABASE_URL> -F c -f <tmp>/backup-<ISO-timestamp>.dump` — **custom format**
   (`-F c`), not plain SQL. This matters for recovery: custom-format dumps require `pg_restore`,
   not `psql`, and support selective/parallel restore.
2. Uploaded to `S3_BUCKET` (region `S3_REGION`) under the same filename as the key — object keys
   sort lexicographically, and since the timestamp is ISO-8601 (colons/periods replaced with
   hyphens), the newest backup is always the last key alphabetically.
3. Recorded in the `BackupLog` table (`success`, `sizeBytes`, `error` on failure) — visible at
   `/admin/backups`. A failed `pg_dump` or S3 upload is caught, logged with the actual error message,
   and reported to Sentry; it does not crash the interval or stop future attempts.
4. The local temp file is always deleted after (`finally`), success or failure.

**What's in a backup:** every row in every table — the full logical schema and data.
**What's not:** anything living outside Postgres. See "What a restore does not give you back" below.

## Recovery

### 0. Decide: restore in place, or restore to a scratch database first?

Restoring directly into the production database is appropriate when that database is empty or
already lost (e.g. provisioning a replacement after the original was destroyed). If production
still exists and is merely _suspected_ corrupted, restore to a **new, throwaway database first**,
verify it, and only then repoint `DATABASE_URL` — restoring destructively into a database you might
still need to inspect is a one-way door. Neon (and most managed Postgres) makes this a cheap
branch/new-database operation, not a new server.

### 1. Find the backup to restore

Two ways to find it, in order of preference:

```sql
-- From the app's own record of what succeeded (fastest, if the DB is still reachable)
SELECT filename, "sizeBytes", "createdAt" FROM "BackupLog"
WHERE success = true ORDER BY "createdAt" DESC LIMIT 5;
```

```bash
# From S3 directly, if the database is unreachable
aws s3 ls s3://$S3_BUCKET/ --region $S3_REGION | sort | tail -5
```

### 2. Download it

```bash
aws s3 cp s3://$S3_BUCKET/backup-2026-07-21T03-00-00-000Z.dump ./restore.dump --region $S3_REGION
```

### 3. Restore

Against an **empty** target database (new instance, or a fresh scratch database):

```bash
pg_restore --no-owner --if-exists -d "$DATABASE_URL" ./restore.dump
```

Against a target that **already has schema/data** you want fully replaced (only once you've
decided in step 0 that overwriting is intended):

```bash
pg_restore --no-owner --clean --if-exists -d "$DATABASE_URL" ./restore.dump
```

`--clean --if-exists` drops existing objects before recreating them, without erroring on objects
that happen not to exist. `--no-owner` avoids failing on role/ownership mismatches between the
environment the dump came from and the one you're restoring into — this app's migrations don't
depend on specific Postgres role ownership, so this is safe here.

### 4. Reconcile Prisma's migration bookkeeping

The restored dump includes the `_prisma_migrations` table as it existed at backup time. If any
migrations were applied to production _after_ that backup, running `npx prisma migrate deploy`
against the restored database re-applies exactly those — normal, expected, and safe, since Prisma
tracks what's already applied. If you're unsure, run `npx prisma migrate status` first to see
what it thinks is pending before deploying anything.

### 5. Verify before switching production traffic to it

- `curl https://<host>/api/health` (once the app is pointed at the restored DB) — confirms basic
  connectivity.
- Spot-check row counts against what `BackupLog`/your own memory of the incident suggests is
  reasonable — a restore that "succeeds" but silently truncated data still needs to be caught here,
  not discovered later.
- Log into `/admin/login` with a known Owner account — confirms `User`/`Session` came back intact
  and password hashes still verify.
- Open a few `/admin/*` pages that touch different tables (Orders, Bookings, Portfolio) as a broad
  smoke test.

Only after this passes: repoint `DATABASE_URL` for the running app (and restart it — Prisma's
connection pool is established at process start) to the restored database.

## What a restore does not give you back

- **Cloudinary assets.** Product images, portfolio images, and contact-form attachments are stored
  in Cloudinary, referenced from Postgres by URL/`public_id` only. A Postgres restore recovers
  those references perfectly — the _rows_ are fine — but if Cloudinary's own account/assets were
  also lost, the images those rows point to are gone. Cloudinary has its own backup/retention
  story, entirely separate from this document; if that matters for your risk tolerance, it needs
  its own plan.
- **In-flight state that only ever lived in Redis** — not applicable to the current design (see
  [ADR 0002](./adr/0002-postgres-sessions-and-rate-limit.md)), but worth remembering if that
  decision is ever revisited: anything moved back to a pure in-memory/TTL store stops being
  captured by this backup mechanism entirely.
- **Anything written after the last successful backup** — up to ~24h of data, in the worst case
  (a backup fails right after succeeding, then the incident happens 23 hours later). If this
  recovery-point objective isn't tight enough for the business's tolerance, `BACKUP_INTERVAL_MS`
  in `lib/backup/run.ts` is the one place to change it — more frequent backups trade off against
  more `pg_dump` load and S3 storage cost.

## Test this periodically

An untested backup is not a real backup. Periodically — quarterly is a reasonable cadence for an
app this size — actually run steps 1–5 above against a scratch database, not just when a real
incident forces it. The first time anyone reads this runbook shouldn't be during an actual outage.
