import "server-only";

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { stat, unlink, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as Sentry from "@sentry/nextjs";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "@/lib/prisma";
import { recordBackup, findLastSuccessfulBackup } from "./repository";

const execFileAsync = promisify(execFile);

const BACKUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Arbitrary fixed key identifying this specific lock — Postgres advisory
// locks are keyed by a bigint the application chooses, scoped to the
// connection that acquired it. Only one replica can hold this at a time,
// which is what actually makes a horizontally-scaled deployment safe: every
// replica's interval sees "a backup is due" at the same moment, but only
// the one that wins the lock runs pg_dump/uploads to S3.
const BACKUP_LOCK_KEY = 918_273_645;

async function tryAcquireLock(): Promise<boolean> {
  const rows = await prisma.$queryRaw<{ locked: boolean }[]>`
    SELECT pg_try_advisory_lock(${BACKUP_LOCK_KEY}) AS locked
  `;
  return rows[0]?.locked ?? false;
}

async function releaseLock(): Promise<void> {
  await prisma.$queryRaw`SELECT pg_advisory_unlock(${BACKUP_LOCK_KEY})`;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set.`);
  return value;
}

async function performBackup(): Promise<void> {
  const databaseUrl = requireEnv("DATABASE_URL");
  const bucket = requireEnv("S3_BUCKET");
  const region = requireEnv("S3_REGION");

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `backup-${timestamp}.dump`;
  const tmpPath = join(tmpdir(), filename);

  try {
    await execFileAsync("pg_dump", [databaseUrl, "-F", "c", "-f", tmpPath]);

    const { size } = await stat(tmpPath);
    const fileBuffer = await readFile(tmpPath);

    const s3 = new S3Client({ region });
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: filename,
        Body: fileBuffer,
      })
    );

    await recordBackup({ filename, sizeBytes: size, success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    Sentry.captureException(error);
    await recordBackup({ filename, sizeBytes: 0, success: false, error: message });
  } finally {
    await unlink(tmpPath).catch(() => {});
  }
}

/** Checked on an hourly interval (see instrumentation.ts) — only actually runs the backup once ~24h since the last successful one, and only on whichever replica wins the advisory lock. */
export async function runBackupIfDue(): Promise<void> {
  const last = await findLastSuccessfulBackup();
  if (last && Date.now() - last.createdAt.getTime() < BACKUP_INTERVAL_MS) {
    return;
  }

  const acquired = await tryAcquireLock();
  if (!acquired) return;

  try {
    // Re-check after acquiring the lock — another replica may have just
    // finished a backup while we were waiting to acquire it.
    const stillDue = await findLastSuccessfulBackup();
    if (stillDue && Date.now() - stillDue.createdAt.getTime() < BACKUP_INTERVAL_MS) {
      return;
    }
    await performBackup();
  } finally {
    await releaseLock();
  }
}
