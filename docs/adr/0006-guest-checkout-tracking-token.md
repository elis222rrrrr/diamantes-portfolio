# 0006. Guest checkout via tokenized tracking link, no customer accounts

Status: Accepted
Date: 2026-07-21 (recorded retroactively)

## Context

A customer needs a way to check their order status after paying, without this app maintaining a
second authentication system alongside the existing `OWNER`/`ADMIN`/`EDITOR` admin auth. Building
real customer accounts (registration, login, password reset, email verification) is a substantial
system in its own right, for a studio whose actual need is simpler: "let me see my order."

## Decision

`Order.trackingToken` (`@default(uuid())`, deliberately crypto-random rather than Prisma's default
`cuid()`) plays the same role `Booking.manageToken` already established: a customer reaches
`/orders/track/[token]` with a link, never logging in. No customer registration/login system was
built.

## Consequences

- Zero customer-auth surface to secure — no password storage, no session management, no "forgot
  password" flow for customers to get wrong.
- The tracking token is the entire access control for that order — hence `uuid()` over `cuid()`
  specifically: `cuid` optimizes for sortable uniqueness, not unguessability, and this token is the
  only thing standing between "anyone with the link" and one customer's order/shipping details.
- A customer with multiple orders has no single place to see all of them — each order's tracking
  link is independent, with no account tying them together. Accepted for a studio at this scale.
- **Revisit if:** repeat-customer volume grows enough that "one link per order, no account" becomes
  a real friction point — that's a much larger addition (a second, customer-facing auth system)
  than extending the existing admin auth, and should be scoped as its own decision when it comes up.
