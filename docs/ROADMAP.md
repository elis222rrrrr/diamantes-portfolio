# Roadmap: Future Directions

Nine names were given as candidate future directions: Marketplace, Client Portal, Mobile App,
Desktop App, AI Agents, Community, Courses, Subscriptions, Memberships. This document evaluates
each one against the architecture that actually exists today — not speculative design — and
proposes a sequencing based on real dependencies between them, not priority guesses. **This is
planning material, not a commitment or a timeline.** No code was written for any of these; that's
deliberate — several of the nine differ from each other by an order of magnitude in cost depending
on a business decision only the studio can make, and guessing wrong before that decision is made
would waste real effort.

## What exists today that any of these would build on

- **Single-tenant commerce.** `Product`/`Order`/`OrderItem` assume one seller — this studio.
  There's no vendor/seller concept anywhere in the schema. (Relevant to: Marketplace.)
- **No customer accounts.** Visitors interact as guests — a `Booking` or `Order` is reached via a
  crypto-random tokenized link (`manageToken`/`trackingToken`), not a login
  ([ADR 0006](./adr/0006-guest-checkout-tracking-token.md)). The only real authentication in this
  app is `User`/`Session` for internal staff (`OWNER`/`ADMIN`/`EDITOR`), gated by
  `requireRole`/`requireRoleForAction`. (Relevant to: Client Portal, Community, Courses,
  Memberships, Subscriptions — four of the nine items need some notion of "this visitor, across
  visits," which doesn't exist today in any form.)
- **One-time payments only.** `lib/shop/stripe.ts` creates Checkout sessions with `mode:
"payment"`; nothing in this codebase creates a `mode: "subscription"` session, a Stripe `price`
  with a recurring interval, or handles subscription lifecycle webhooks (`invoice.paid`,
  `customer.subscription.updated/deleted`). The webhook route only handles
  `checkout.session.completed`. (Relevant to: Memberships, Subscriptions.)
- **No public API — Server Actions only.** As documented in `ARCHITECTURE.md`'s "API surface"
  section: almost every mutation is a Server Action, callable only from this Next.js frontend, not
  a stable, versioned contract an external client can call. Only 3 real HTTP routes exist
  (`/api/health`, `/api/jobs/process`, `/api/webhooks/stripe`), none of which is a general-purpose
  data API. (Relevant to: Mobile App, Desktop App.)
- **No user-generated content anywhere.** Every piece of content (Portfolio, Services, Hero, SEO)
  is admin-managed through the CMS built earlier — there's no comment, post, or upload created by a
  site visitor, and therefore no moderation/abuse-handling infrastructure at all. (Relevant to:
  Community, Courses.)
- **`Memberships` already exists as a placeholder page** (`app/(site)/memberships/page.tsx`) — a
  "Coming soon" notice: _"priority access to new arrivals, studio previews, and collaborative
  projects for collectors and long-term partners."_ This is the only one of the nine with any
  existing product copy to anchor against.

## The one cross-cutting decision that changes four items' cost

**Client Portal, Community, Courses, and Memberships/Subscriptions all independently need some
form of persistent visitor identity** — a way to recognize the same person across visits, which
this app deliberately doesn't have today. Building that four separate times (once per feature,
each slightly differently) would be a real, avoidable cost. The strong recommendation: if more
than one of these four is actually wanted, treat **Customer Accounts** as its own foundational
piece of work first, sized and sequenced independently, rather than bundled into whichever feature
happens to get built first.

This is a deliberate, visible reversal of [ADR 0006](./adr/0006-guest-checkout-tracking-token.md)'s
"no customer accounts" decision — worth being explicit about, not something to slide into as a
side effect of building one feature. That ADR's own reasoning still holds for one-off purchases;
it just no longer covers a studio that wants recurring, identity-anchored relationships with
collectors.

## Per-item assessment

### Memberships + Subscriptions — assessed together

These are the same underlying mechanic (recurring billing behind a tier), not two features. Building
them separately would mean two parallel implementations of nearly identical Stripe subscription
logic.

- **Needs:** Customer Accounts (above); Stripe subscription integration (`mode: "subscription"`,
  recurring `price` objects — genuinely new, not an extension of the existing one-time Checkout
  code); subscription-lifecycle webhook handling (new event types beyond
  `checkout.session.completed`); a `Membership`/`Subscription` Prisma model; a way to actually gate
  something by tier.
- **Reuses:** `lib/shop/stripe.ts`'s Stripe client, the webhook route's signature-verification
  pattern, the event/job pipeline (`lib/events/`, `lib/jobs/`) for anything that should happen when
  a membership starts/lapses.
- **Open question only the studio can answer:** what does a membership actually unlock? The
  existing placeholder copy gestures at "priority access to new arrivals, studio previews,
  collaborative projects" — that's a start, but each of those needs to become a concrete gated
  feature (an early-access window on `Product`? a members-only page? a Discord-style invite?)
  before this can be scoped further.
- **Relative size:** Medium–Large once Customer Accounts exists; Large–XL if attempted standalone.

### Client Portal

- **Needs:** Customer Accounts; a portal UI surfacing a customer's own `Order`/`Booking` history;
  for anything beyond simple order-status viewing (e.g. commission collaboration — file exchange,
  approval steps, messaging), a genuinely new data model — there's nothing like it today.
- **Reuses:** `Order`/`Booking` already exist and already have the right shape for "show me my own
  orders" once there's an identity to check against; the admin session pattern
  (`lib/auth/session.ts`) is a reasonable template for a second, customer-facing principal type,
  though it shouldn't reuse the same `User`/role system (`OWNER`/`ADMIN`/`EDITOR` is an internal
  staff concept, not a customer one).
- **Open question:** is this "customers can see their own order/booking status" (a moderate
  addition once accounts exist) or "customers collaborate on custom commission work end-to-end"
  (a much bigger scope, closer to a lightweight project-management tool than a portal)?
- **Relative size:** Medium (status-viewing only) to Large (collaboration features).

### Mobile App + Desktop App — assessed together

Both need the same prerequisite and neither is possible without it first.

- **Needs:** A real, versioned, public API — the concrete, already-documented gap in
  `ARCHITECTURE.md`'s "API surface" section. Server Actions aren't callable from a native app; this
  means designing and building an actual REST or GraphQL surface over the domain logic that already
  exists in `lib/*/repository.ts`. Also needs token-based auth (mobile clients can't rely on the
  current cookie-session model, which assumes a browser) for anything beyond public read-only data.
- **Reuses:** All the actual business logic — `lib/shop/repository.ts`, `lib/booking/repository.ts`,
  etc. already encode every real invariant (stock decrement, no-double-booking, oversell handling).
  A public API is a new transport layer on top of logic that doesn't need to be reinvented.
- **Open question, and the one worth answering before anything else here:** what would a native app
  actually do that the responsive website — already verified mobile-friendly in the Quality audit
  (Lighthouse mobile scores, zero layout overflow across viewports/engines) — doesn't already cover?
  Push notifications for order/booking status? Offline portfolio browsing? Without a concrete
  answer, this is the item with the weakest cost-to-benefit case of the nine as stated.
- **Relative size:** Medium–Large just for the public-API prerequisite; XL for either native app on
  top of it (new codebase, new toolchain, app-store distribution and review process).

### Marketplace

The single most architecturally disruptive item on this list, and the one where the name itself is
ambiguous enough to matter:

- **If "Marketplace" means more product variety in the studio's own shop** — more categories, more
  listings, more sellers-of-one (i.e., still just this studio) — that's not a new initiative at
  all; the existing `Shop` already supports it today, unblocked, with zero new architecture.
- **If "Marketplace" means other designers/studios selling through this platform** — a true
  multi-vendor marketplace — that's a different business, not a bigger shop. `Product`/`Order`/
  `OrderItem` have no seller/vendor concept anywhere; adding one means payment splitting (Stripe
  Connect, not the current single-account Checkout), per-vendor fulfillment and payout tracking,
  and a moderation/trust model for other sellers' listings that doesn't exist in any form today.
- **This ambiguity should be resolved before anything else about this item is planned** — the two
  readings differ by roughly an order of magnitude in cost.
- **Relative size:** effectively zero (already possible) under the first reading; XL, the largest
  item on this list, under the second.

### AI Agents

**Too undefined to size at all — flagged rather than guessed at.** "AI Agents" could mean any of
several genuinely different projects with different risk profiles:

- A customer-facing design/product assistant (chatbot) — real cost and abuse/liability surface
  (what can it promise, refund, or commit to on the studio's behalf?).
- An internal admin copilot — e.g., drafting product descriptions, summarizing analytics — lower
  risk, since it's staff-facing and reviewed before anything ships.
- Exposing this app's own data/actions via a protocol like MCP so an external AI tool can act on
  it on the studio's behalf (browse orders, draft a response to a contact message) — an API-shaped
  problem, inheriting the same "no public API yet" prerequisite as Mobile/Desktop App above.
- Automating a specific existing business process (e.g., auto-drafting replies to
  `ContactMessage` rows) — the narrowest, cheapest version, and the only one of these four that
  could be scoped today without further discussion.
- **This needs a scoping conversation, not an estimate**, before it can be sequenced against
  anything else on this list.

### Community

- **Needs:** Customer Accounts; genuinely new user-generated-content infrastructure (posts,
  comments, or whatever the actual shape turns out to be) with a moderation story — a different
  trust model from anything in this codebase today, where every existing piece of content is
  admin-authored.
- **Reuses:** Little, architecturally. `NewsletterSubscriber` already exists as a much lighter
  "stay in touch" mechanic — worth explicitly asking whether that already satisfies the underlying
  need before building a heavier community platform.
- **Open question:** what is "community" here concretely — a customer forum, an Instagram-style
  project showcase, or something closer to what the newsletter already does?
- **Relative size:** Large.

### Courses

- **Needs:** Content delivery (likely video, given the studio's medium), progress tracking, and —
  if paywalled — the same Customer Accounts + subscription-billing foundation as Memberships above.
- **Reuses:** The Cloudinary media library (`lib/storage/cloudinary.ts`) could plausibly host video
  assets; the existing admin-CMS pattern (Portfolio/Services) is a reasonable structural template
  for managing course content, even though the content type itself is new.
- **Open question:** a self-paced content library (moderate) or live, cohort-based teaching
  (materially bigger — scheduling, cohort/group state, live-session infrastructure)?
- **Relative size:** Large.

## Suggested sequencing

Ordered by real dependency, not assumed priority — reorder freely once the open questions above
are answered:

1. **Resolve the two decisions that change everything else's cost:** what "Marketplace" actually
   means, and what "AI Agents" is supposed to do. Both are business decisions, not technical ones —
   nothing below can be sized confidently until these are answered.
2. **Customer Accounts**, if more than one of Client Portal / Community / Courses /
   Memberships-Subscriptions is actually wanted — built once, deliberately, as a visible
   supersession of [ADR 0006](./adr/0006-guest-checkout-tracking-token.md), not smuggled in as a
   side effect of whichever feature gets built first.
3. **Memberships + Subscriptions** (merged) — the item with the most existing signal (real
   placeholder copy already live on the site) and the most direct line to recurring revenue.
4. **Client Portal** — status-viewing scope first; collaboration features only if the studio's
   commission work actually needs them.
5. **Community / Courses** — lower urgency than the above without further definition; revisit once
   there's a concrete answer to each item's open question.
6. **Public API** — the shared prerequisite for Mobile App and Desktop App; worth building only
   once there's a real answer to "what does a native app do that the responsive site doesn't."
7. **Mobile App / Desktop App** — on top of (6), once justified.
8. **Marketplace** — last, and only if the multi-vendor reading is actually what's meant; the
   single-seller reading is already unblocked today and isn't really "future" work at all.

## Explicitly not decided here

- No priority ranking beyond dependency order — that's the studio's call, not an architectural one.
- No timeline or resourcing estimate — "Large" and "XL" describe relative complexity, not weeks.
- No scope decision for Marketplace or AI Agents — both need a real answer before they're
  plannable at all, not a guessed default.
