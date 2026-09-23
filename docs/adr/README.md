# Architecture Decision Records

A short, dated record of a specific decision — not a restatement of [ARCHITECTURE.md](../../ARCHITECTURE.md),
which describes the current system and stays up to date as it evolves. An ADR instead freezes the
moment a decision was made: what was true then, what was chosen, and what that cost. When a later
decision reverses an earlier one, the old ADR is marked **Superseded**, not deleted or edited —
the record of "we tried X, here's why we moved to Y" is the point.

These were written retroactively, covering decisions already made earlier in this project's history
— reconstructed from the actual code and existing `ARCHITECTURE.md` narrative, not from memory of a
real-time discussion. Each one links to the `ARCHITECTURE.md` section with the fuller reasoning.

| ADR                                                   | Decision                                                    | Status   |
| ----------------------------------------------------- | ----------------------------------------------------------- | -------- |
| [0001](./0001-self-hosted-deployment.md)              | Self-hosted (`next start`), not Vercel/serverless           | Accepted |
| [0002](./0002-postgres-sessions-and-rate-limit.md)    | Sessions & rate limiting on Postgres, not Redis             | Accepted |
| [0003](./0003-in-process-job-queue.md)                | In-process interval job queue, not a message broker         | Accepted |
| [0004](./0004-repository-functions-not-interfaces.md) | Plain repository functions; DI scoped to 3 infra interfaces | Accepted |
| [0005](./0005-stripe-checkout-hosted.md)              | Stripe Checkout (hosted), not Stripe Elements               | Accepted |
| [0006](./0006-guest-checkout-tracking-token.md)       | Guest checkout via tokenized link, no customer accounts     | Accepted |
| [0007](./0007-deactivate-dont-delete.md)              | Products/Users are deactivated, never deleted               | Accepted |
| [0008](./0008-visitor-theme-token-redefinition.md)    | Visitor light/dark theme via CSS variable redefinition      | Accepted |

## Adding a new one

Copy the format below into `NNNN-short-title.md` (next sequential number), add a row above.

```markdown
# NNNN. Title

Status: Accepted | Superseded by [NNNN](./NNNN-....md) | Deprecated
Date: YYYY-MM-DD

## Context

What situation forced a choice — the constraint, the competing options, the "why now."

## Decision

The one sentence that states what was chosen, stated as a decision, not a description.

## Consequences

What this makes easier, what it makes harder, and what would trigger revisiting it.
```
