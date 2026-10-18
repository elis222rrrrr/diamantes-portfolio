import "server-only";

import { revalidateTag, unstable_cache } from "next/cache";

/** One tag for every cached public read (site settings + the homepage's
 * service/portfolio/product lists). Content edits are rare, so busting it
 * all on any write is simpler than per-model tags and costs nothing.
 *
 * Why cache at all: every page is per-request, and each request used to hit
 * Postgres — including Sentry's once-a-minute uptime check — so the Neon
 * compute never got to scale to zero and the free plan's monthly compute
 * quota ran out, taking the whole site down. With these reads cached, an
 * idle site touches the DB at most once per REVALIDATE_SECONDS. */
const PUBLIC_CONTENT_TAG = "public-content";
const REVALIDATE_SECONDS = 60 * 60;

/** Note: unstable_cache JSON-serializes results, so Date fields come back as
 * strings — only wrap reads whose callers don't use Date values. */
export function cachePublicContent<Args extends unknown[], Result>(
  fn: (...args: Args) => Promise<Result>,
  key: string
) {
  return unstable_cache(fn, [key], {
    tags: [PUBLIC_CONTENT_TAG],
    revalidate: REVALIDATE_SECONDS,
  });
}

/** Call after any write that changes cached public content, so the next
 * request reads fresh data instead of waiting out the revalidate window.
 * expire: 0 (not "max") so an admin sees their own save immediately; works
 * from both Server Actions and Route Handlers (the Stripe webhook). */
export function invalidatePublicContent() {
  revalidateTag(PUBLIC_CONTENT_TAG, { expire: 0 });
}
