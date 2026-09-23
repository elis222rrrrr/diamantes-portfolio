import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { runJobWorker } from "@/lib/jobs/worker";
import { runBackupIfDue } from "@/lib/backup/run";
import { deleteExpiredSessions } from "@/lib/auth/session";
import { deleteExpiredRateLimitBuckets } from "@/lib/rate-limit";

/** Constant-time comparison — see the identical helper/reasoning in
 * app/api/jobs/process/route.ts. */
function safeCompare(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  return aBuf.length === bBuf.length && timingSafeEqual(aBuf, bBuf);
}

/**
 * The Vercel Cron entrypoint (see vercel.json) — everything
 * instrumentation.ts's in-process intervals do on a self-hosted deployment,
 * run instead as one externally-triggered sweep, since a serverless
 * function has no persistent process to hold a `setInterval` across
 * requests (see ADR 0001). Vercel automatically sends
 * `Authorization: Bearer $CRON_SECRET` on requests it triggers itself, so
 * this is safe as a public route.
 *
 * Job delivery for the common case doesn't depend on this at all — every
 * action that enqueues a job (Stripe webhook, booking, contact form,
 * newsletter) already calls runJobWorker() itself as a fast path (see
 * lib/jobs/worker.ts). This is only the backstop for failed-job retries,
 * plus the backup/expiry sweeps, none of which are time-critical: backups
 * are self-limited to ~once/24h already, and both getSession()/
 * isRateLimited() check expiresAt themselves regardless of when this last
 * ran. A once-daily cron (the max Vercel's Hobby plan allows) loses
 * nothing meaningful over the self-hosted 30s/hourly intervals.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization") ?? "";

  if (!secret || !safeCompare(authHeader, `Bearer ${secret}`)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await Promise.allSettled([
    runJobWorker(50),
    runBackupIfDue(),
    deleteExpiredSessions(),
    deleteExpiredRateLimitBuckets(),
  ]);

  for (const result of results) {
    if (result.status === "rejected") {
      Sentry.captureException(result.reason);
    }
  }

  return NextResponse.json({ ok: true });
}
