# 0007. Products and Users are deactivated, never deleted

Status: Accepted
Date: 2026-07-21 (recorded retroactively)

## Context

A `Product` with order history and a `User` with login/audit history both raise the same question:
what happens to that history when the row they reference is removed? Hard-deleting either would
either orphan history (if the FK allowed it) or make deletion impossible without also destroying
history (if the FK doesn't).

## Decision

Both are soft-deleted via an `isActive` boolean, never hard-deleted through the admin UI.
`OrderItem.productId`/`OrderItem.variantId` are FK `Restrict` at the database level — Postgres
itself refuses a `Product`/`ProductVariant` delete while order rows reference it, which is the
actual enforcement mechanism, not just an admin-UI convention. `User` has no such DB-level
constraint but follows the same policy, since `LoginAttempt`, `Session`, and `AuditLog.actorId` all
reference it.

## Consequences

- Past orders always resolve to a real product/variant, even after a product is discontinued —
  `updateProduct` deactivates dropped color variants rather than deleting them, for the same reason.
- `deleteProductAction` still exists as an admin action (for products with no order history) and
  now catches the `P2003` violation gracefully when attempted on one that has orders, returning a
  message instead of crashing — see the API optimization pass for that fix.
- User management is additionally **OWNER-only**, stricter than every other admin section — role
  assignment is the one action where privilege escalation (an `ADMIN` granting itself `OWNER`) is a
  security concern, not just a data-integrity one. `updateUserAction` also blocks demoting or
  deactivating the last active `OWNER`, so the studio can't lock itself out.
- A deactivated user's existing sessions are revoked on their very next request, not just at their
  next login — `getSession()` checks `user.isActive` on every lookup, not only at session creation.
- **Revisit if:** genuine data-retention requirements (e.g. a "right to erasure" request) ever
  require actually erasing a specific user's data — that's a distinct, narrower operation than
  general-purpose deletion and should be scoped separately rather than loosening this default.
