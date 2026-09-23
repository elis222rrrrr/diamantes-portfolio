import "reflect-metadata";
import * as Sentry from "@sentry/nextjs";

const JOB_SWEEP_INTERVAL_MS = 30_000;
const BACKUP_CHECK_INTERVAL_MS = 60 * 60 * 1000; // hourly — runBackupIfDue() itself only acts once ~24h
const EXPIRY_SWEEP_INTERVAL_MS = 60 * 60 * 1000; // hourly — sessions/rate-limit buckets just need periodic cleanup, not TTL-precision

// Guards the in-process intervals against restarting on every dev Fast
// Refresh, same globalThis idempotency pattern used by lib/prisma.ts / lib/container.ts.
const globalForJobs = globalThis as unknown as {
  jobSweepStarted?: boolean;
  backupCheckStarted?: boolean;
  expirySweepStarted?: boolean;
};

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" || process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: 1,
    });
  }

  // On Vercel (VERCEL is set automatically in every one of their runtimes),
  // a serverless function has no persistent process to hold a setInterval
  // across requests — it'd restart from scratch on every cold start and
  // never survive long enough to actually fire on its own schedule. See
  // app/api/cron/route.ts + vercel.json for the externally-triggered
  // replacement (ADR 0001) — self-hosted (`next start`) is the only target
  // that keeps using these in-process intervals.
  if (process.env.VERCEL) return;

  // Self-hosted (`next start`) runs a genuinely long-lived Node process, so a
  // simple in-process interval is a complete, dependency-free backstop for
  // the durable job queue — no external cron provider needed. This only
  // makes sense in the Node.js runtime (not edge, and not during `next build`).
  if (process.env.NEXT_RUNTIME === "nodejs" && !globalForJobs.jobSweepStarted) {
    globalForJobs.jobSweepStarted = true;
    const { runJobWorker } = await import("@/lib/jobs/worker");
    setInterval(() => {
      runJobWorker(10).catch((error) => {
        console.error("Job sweep failed:", error);
      });
    }, JOB_SWEEP_INTERVAL_MS);
  }

  // Same self-hosted scheduling pattern as the job sweep above — checked
  // hourly, but runBackupIfDue() itself is a no-op unless ~24h have passed
  // since the last successful backup, and only the replica that wins the
  // Postgres advisory lock actually runs pg_dump/uploads to S3.
  if (process.env.NEXT_RUNTIME === "nodejs" && !globalForJobs.backupCheckStarted) {
    globalForJobs.backupCheckStarted = true;
    const { runBackupIfDue } = await import("@/lib/backup/run");
    setInterval(() => {
      runBackupIfDue().catch((error) => {
        console.error("Backup check failed:", error);
      });
    }, BACKUP_CHECK_INTERVAL_MS);
  }

  // Sessions and rate-limit buckets (Postgres, not Redis — see ARCHITECTURE.md)
  // have no TTL to expire them automatically; this sweep is what actually
  // deletes rows past their expiresAt. Correctness never depends on this
  // running promptly — both getSession() and isRateLimited() already check
  // expiresAt themselves — so an hourly cadence is purely about not letting
  // the tables grow unbounded.
  if (process.env.NEXT_RUNTIME === "nodejs" && !globalForJobs.expirySweepStarted) {
    globalForJobs.expirySweepStarted = true;
    const { deleteExpiredSessions } = await import("@/lib/auth/session");
    const { deleteExpiredRateLimitBuckets } = await import("@/lib/rate-limit");
    setInterval(() => {
      deleteExpiredSessions().catch((error) => {
        console.error("Session sweep failed:", error);
      });
      deleteExpiredRateLimitBuckets().catch((error) => {
        console.error("Rate-limit bucket sweep failed:", error);
      });
    }, EXPIRY_SWEEP_INTERVAL_MS);
  }
}

export const onRequestError = Sentry.captureRequestError;
