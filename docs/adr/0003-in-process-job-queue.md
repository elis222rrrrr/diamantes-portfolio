# 0003. In-process interval job queue, not a message broker

Status: Accepted
Date: 2026-07-21 (recorded retroactively)

## Context

Server Actions that need a side effect after responding (sending an email, notifying on a new
contact message) shouldn't make the user's request wait on that side effect, and shouldn't lose it
if the side effect fails. That calls for a durable queue with retry — the two realistic options
were a real message broker (SQS, RabbitMQ) or a `Job` table already living in the same Postgres
database everything else uses.

## Decision

A plain Postgres `Job` table (`lib/jobs/`), claimed via `SELECT ... FOR UPDATE SKIP LOCKED` and
drained by two mechanisms: `after()` (from `next/server`) runs the worker immediately post-response
for near-instant delivery, and an in-process `setInterval` (`instrumentation.ts`) sweeps anything
still due as a durable backstop.

## Decision, part 2 — events describe facts, jobs describe work

A Server Action publishes a `DomainEvent` (`booking.created`, `contact.message.received`) through
an in-process `InProcessEventBus`, not directly enqueuing a job — `lib/events/subscribers.ts`
decides what job (if any) each event warrants. The action that changed something states a fact and
never has to know what happens as a result.

## Consequences

- No new infrastructure to run — `enqueueJob` is a write on the same connection the request
  already has, so it can't introduce a new failure mode.
- `SELECT ... FOR UPDATE SKIP LOCKED` is already safe across multiple replicas sharing one
  Postgres, so this queue doesn't block [0001](./0001-self-hosted-deployment.md)'s scaling story.
- A broker would give at-least-once delivery guarantees across process crashes with less custom
  code, at the cost of a second piece of infrastructure to operate. Not worth it at this app's
  volume.
- The event bus is genuinely in-process — `publish()` calls subscribers synchronously in the same
  request/worker tick. It gives the decoupling benefit (action states a fact, doesn't decide the
  consequence) without needing a second process to receive events.
- **Revisit if:** side effects need to run in a different process than the one that published the
  event (e.g. a dedicated worker fleet) — that's the point where the event bus's in-process
  assumption breaks and a real broker earns its keep.
