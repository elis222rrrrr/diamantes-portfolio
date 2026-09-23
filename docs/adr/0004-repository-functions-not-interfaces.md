# 0004. Plain repository functions; DI scoped to 3 infrastructure interfaces

Status: Accepted
Date: 2026-07-21 (recorded retroactively)

## Context

A `"use server"` action that validates input, enforces a real invariant (no double-booking a
slot), writes to Postgres, sends an email, and redirects is doing too many things in one function
to read or change safely. The fix needs to separate "data access" from "orchestration" — but that
doesn't automatically mean every data-access function needs an interface and a DI-resolved
implementation.

## Decision

Extract data access into plain functions in `lib/<domain>/repository.ts` (`createBookingRecord`,
`markOrderPaid`, etc.) — not behind an interface, not swapped via the DI container. Reserve the
DI container (`lib/container.ts`, tsyringe) for exactly three infrastructure seams that plausibly
need swapping: `EmailSender`, `JobQueue`, `EventBus` (`lib/email/interfaces.ts`,
`lib/jobs/interfaces.ts`, `lib/events/interfaces.ts`).

## Consequences

- Repository functions translate known failure modes into domain-shaped results (e.g.
  `{ ok: false, reason: "slot_taken" }`) instead of leaking a raw `PrismaClientKnownRequestError`
  into the action — the real fix for the original problem, achieved without an interface layer.
- The three DI-resolved interfaces each still have exactly one production implementation
  (`ResendEmailSender`, `PrismaJobQueue`, `InProcessEventBus`) — an interface with one
  implementation and no test double consuming it is indirection paid for upfront. Accepted as a
  deliberate, narrowly-scoped exception (DI was explicitly requested for these three), not a
  precedent to generalize from.
- No `UseCase`-per-operation classes, no repository interfaces, no aggregate roots — each
  repository function has exactly one call site, and the one real domain invariant (no
  double-booking) is still enforced by a database unique constraint, not a domain class.
- **Revisit if:** a test suite arrives and actually injects a fake `EmailSender`/`JobQueue` — at
  that point the container's cost (three interfaces, one implementation each) starts paying for
  itself instead of sitting idle. See [Developer Guide](../DEVELOPER_GUIDE.md) for the current
  state of automated testing (there isn't one yet).
