import "server-only";

import { prisma } from "@/lib/prisma";

const WINDOW_SECONDS = 15 * 60;

/**
 * Fixed-window rate limit via a single atomic `INSERT ... ON CONFLICT DO
 * UPDATE` — the Postgres equivalent of Redis's `INCR` + `EXPIRE`, using the
 * row's own `expiresAt` as the window boundary instead of a TTL. The
 * `CASE WHEN "expiresAt" <= now()` branch resets the counter for a fresh
 * window in the same statement, so a caller never sees a stale count from a
 * window that already elapsed. Returns true once `key` has been hit more
 * than `limit` times within `windowSeconds`.
 */
async function isRateLimited(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const rows = await prisma.$queryRaw<{ count: number }[]>`
    INSERT INTO "RateLimitBucket" (key, count, "expiresAt")
    VALUES (${key}, 1, now() + make_interval(secs => ${windowSeconds}))
    ON CONFLICT (key) DO UPDATE SET
      count = CASE
        WHEN "RateLimitBucket"."expiresAt" <= now() THEN 1
        ELSE "RateLimitBucket".count + 1
      END,
      "expiresAt" = CASE
        WHEN "RateLimitBucket"."expiresAt" <= now() THEN now() + make_interval(secs => ${windowSeconds})
        ELSE "RateLimitBucket"."expiresAt"
      END
    RETURNING count
  `;
  return (rows[0]?.count ?? 0) > limit;
}

/** Periodic sweep (instrumentation.ts) — buckets outlive their window until
 * swept, since there's no TTL doing it automatically the way Redis's EXPIRE
 * did. Safe to run redundantly from more than one replica (a plain
 * idempotent DELETE, no lock needed). */
export async function deleteExpiredRateLimitBuckets(): Promise<void> {
  await prisma.rateLimitBucket.deleteMany({ where: { expiresAt: { lte: new Date() } } });
}

/** `LoginAttempt` rows are still written for the audit trail (the
 * /admin/login-history page) — that's a distinct concern from throttling. */
export async function checkLoginRateLimit(
  email: string,
  ipAddress: string | null
): Promise<boolean> {
  const emailLimited = await isRateLimited(`ratelimit:login:email:${email}`, 5, WINDOW_SECONDS);
  if (emailLimited) return true;

  if (ipAddress) {
    return isRateLimited(`ratelimit:login:ip:${ipAddress}`, 15, WINDOW_SECONDS);
  }
  return false;
}

/** Checkout-session creation is a well-known target for card-testing/carding abuse. */
export async function checkCheckoutRateLimit(ipAddress: string | null): Promise<boolean> {
  if (!ipAddress) return false;
  return isRateLimited(`ratelimit:checkout:ip:${ipAddress}`, 10, WINDOW_SECONDS);
}

export async function checkContactRateLimit(ipAddress: string | null): Promise<boolean> {
  if (!ipAddress) return false;
  return isRateLimited(`ratelimit:contact:ip:${ipAddress}`, 5, WINDOW_SECONDS);
}

export async function checkNewsletterRateLimit(ipAddress: string | null): Promise<boolean> {
  if (!ipAddress) return false;
  return isRateLimited(`ratelimit:newsletter:ip:${ipAddress}`, 5, WINDOW_SECONDS);
}

export async function checkBookingRateLimit(ipAddress: string | null): Promise<boolean> {
  if (!ipAddress) return false;
  return isRateLimited(`ratelimit:booking:ip:${ipAddress}`, 10, WINDOW_SECONDS);
}
