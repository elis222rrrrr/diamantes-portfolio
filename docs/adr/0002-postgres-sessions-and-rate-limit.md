# 0002. Sessions & rate limiting on Postgres, not Redis

Status: Accepted (supersedes an earlier Redis-based design)
Date: 2026-07-21 (recorded retroactively)

## Context

An earlier phase of this project introduced Redis for two unrelated concerns: session storage
(`session:{token}` keys with a Redis TTL) and generic rate limiting (`INCR` + `EXPIRE`). Both are
genuinely well-suited to Redis's primitives — but both also made Redis a hard dependency for
authentication and abuse-prevention on every request, in an app that already has exactly one other
stateful dependency (Postgres) and no other use for a cache/KV store.

## Decision

Move both onto Postgres tables (`Session`, `RateLimitBucket`), each using an `expiresAt` column as
the sole expiry check — read on every lookup — instead of a TTL, with a periodic sweep
(`instrumentation.ts`) for cleanup only, not correctness.

## Consequences

- Removes Redis as infrastructure entirely — `lib/redis.ts` deleted, `ioredis` uninstalled, no
  `redis` service in `docker-compose.yml`. One fewer moving piece to run, monitor, and secure.
- Costs one extra indexed row lookup per session check and per rate-limit check, versus an
  in-memory Redis read — accepted as the right trade for this app's traffic level. See
  `ARCHITECTURE.md`'s Infrastructure section for the specific fixed-window `INSERT ... ON CONFLICT
DO UPDATE` pattern that replaces `INCR`+`EXPIRE` atomically.
- A row past its `expiresAt` is still treated as expired even before the sweep runs — the sweep
  only bounds table growth, so a delayed or failed sweep cycle is never a correctness bug.
- **Revisit if:** request volume grows enough that the extra Postgres round-trip on every session
  check becomes a measurable bottleneck — at that point a read-through cache in front of `Session`
  (not necessarily Redis specifically) would be the next thing to reach for, backed by an actual
  measurement rather than this document's assumption.
