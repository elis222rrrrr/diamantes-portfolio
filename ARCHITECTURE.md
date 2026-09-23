# Architecture

Diamantes 3Designs is a Next.js 16 App Router application: a marketing site plus booking,
contact, and newsletter features, with an authenticated admin panel. This document describes
the actual layering, the conventions that keep it consistent, and — just as importantly — which
heavier architectural patterns were deliberately left out at this stage, and why.

For a specific past decision and its trade-offs as a standalone record, see
[docs/adr/](./docs/adr/). For day-to-day "how do I..." rather than "why is it built this way," see
[docs/DEVELOPER_GUIDE.md](./docs/DEVELOPER_GUIDE.md); for running this in production, see
[docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md), [docs/MAINTENANCE.md](./docs/MAINTENANCE.md), and
[docs/BACKUP_AND_RECOVERY.md](./docs/BACKUP_AND_RECOVERY.md). For candidate future directions
assessed against what's described below (not yet built, not yet committed to), see
[docs/ROADMAP.md](./docs/ROADMAP.md).

## Layers

```
app/          Routes, layouts, and Server Actions — the interface/orchestration layer.
components/   Presentation — marketing-site sections, admin dashboard chrome.
lib/          Domain logic + data access, organized by bounded context (auth, booking,
              email, events, jobs, newsletter, seo, storage), plus a couple of small
              generic utilities (prisma.ts, container.ts) with no home of their own.
prisma/       Schema and migrations — the persistence layer.
```

`app/` depends on `lib/`; `lib/` never imports from `app/`. That one-directional boundary is
what would let `lib/` be extracted into a separate package later if a second app ever needed
it — nothing further is done to prepare for that today (see "Monorepo" below).

## Conventions

- **Server Actions live under `app/`**, colocated with the route most tied to their domain —
  even when invoked from a shared component elsewhere. For example,
  `app/(site)/newsletter/subscribe-actions.ts` is called from the sitewide `Footer`, but lives
  under the `newsletter` route segment (alongside `/newsletter/unsubscribe`) rather than in
  `lib/`, because it's a `"use server"` entry point, not domain logic. `lib/` holds data access,
  cross-cutting concerns (auth guards, email sending, job processing), and pure computation —
  never a `"use server"` entry point itself.
- **Repository functions, not repository interfaces.** Where an action was mixing input
  validation, a real invariant, persistence, and email/redirect orchestration in one function
  (booking creation/reschedule, availability management), the Prisma calls are extracted into
  plain functions in `lib/<domain>/repository.ts` (`lib/booking/repository.ts`,
  `lib/newsletter/repository.ts`). These translate known failure modes into domain-shaped
  results — e.g. `createBookingRecord` returns `{ ok: false, reason: "slot_taken" }` instead of
  leaking a `Prisma.PrismaClientKnownRequestError` (P2002 on the unique `start` column, which
  is the actual double-booking guard) into the Server Action. This is deliberately **not**
  behind an interface — see below.
- **Simple create+list operations stay inline.** `ContactMessage` (contact-form submissions)
  has no invariant beyond validation and no reused query shape, so its Server Action and admin
  list page call Prisma directly rather than through a repository file. Repository extraction
  is applied where it earns its keep (a real invariant or a query used in more than one place),
  not uniformly.
- **Events describe facts, jobs describe work.** A Server Action that changes something publishes
  a `DomainEvent` (`lib/events/types.ts`) describing what happened — `booking.created`,
  `contact.message.received`, etc. — via `publishEvent()` (`lib/events/index.ts`). It never
  decides what should happen as a result; that's `lib/events/subscribers.ts`'s job, which reacts
  to each event by enqueuing a `Job` (`lib/jobs/repository.ts`'s `enqueueJob`). This is what
  actually decoupled email-sending from the four Server Actions that used to call Resend
  directly inline.
- **Jobs are durable, not fire-and-forget.** Enqueuing a job is a Postgres write on the connection
  the rest of the action already uses, so it can't introduce a new failure mode into the request.
  Actual delivery (calling Resend) happens later, in `lib/jobs/worker.ts`'s `runJobWorker`, and
  is retried with backoff on failure — isolated from the user-facing action entirely. Two
  mechanisms drive the worker: `after()` (from `next/server`) runs it immediately after the
  response is sent, for near-instant delivery in the common case; a `setInterval` started once in
  `instrumentation.ts` sweeps for anything still due, as a durable backstop that doesn't depend on
  the fast path having worked. This project deploys self-hosted (`next start`, a genuinely
  long-lived process), which is what makes the in-process interval a complete answer — no
  external cron provider needed. (`app/api/jobs/process` exists as an optional secret-protected
  manual trigger, not the primary mechanism.)

## SOLID, honestly

Two of the five principles materially shaped this structure; the other three don't have a
code shape to apply to here, and claiming otherwise would be decorative:

- **Single Responsibility** — the reason the repository functions above exist: an `actions.ts`
  that validated input, enforced a slot-availability invariant, wrote to Postgres, sent an
  email, and redirected was doing too many things to read or change safely. Splitting
  "data access" (repository) from "orchestration" (the action) is the fix.
- **Dependency Inversion** — satisfied two ways. Incidentally, everywhere: Server Actions depend
  on `lib/*` modules, never directly on `Resend`, `pg`, or `cloudinary`'s SDKs. And explicitly, in
  one narrow place: `EmailSender`, `JobQueue`, and `EventBus` (`lib/email/interfaces.ts`,
  `lib/jobs/interfaces.ts`, `lib/events/interfaces.ts`) are real interfaces, resolved through a
  tsyringe container (`lib/container.ts`) rather than imported as concrete classes — see the
  honesty note below on why only these three.
- **Open/Closed, Liskov Substitution, Interface Segregation** — not applicable at this scale.
  There's no class hierarchy to extend without modifying (OCP), no subtyping to preserve
  substitutability for (LSP — the codebase has essentially no inheritance), and no interface
  being forced on implementers who don't need all of it (ISP — there are no interfaces at all
  right now). Noting this explicitly rather than inventing places to "apply" them.

## Background jobs, events, and DI — honestly

Background job processing, an event bus, and a DI container were added on top of the plain
repository-function convention above, at explicit request. Stated as plainly as the rest of this
document states its trade-offs:

- **The DI container's payoff is thin today, on purpose.** `EmailSender`, `JobQueue`, and
  `EventBus` each still have exactly one production implementation (`ResendEmailSender`,
  `PrismaJobQueue`, `InProcessEventBus`). An interface with one implementation and no test double
  consuming it is indirection paid for upfront — the same judgment this document already applies
  to the repository functions, just resolved differently here because DI was explicitly asked
  for. It's scoped narrowly to these three swappable infrastructure pieces; the repository
  functions themselves (`lib/booking/repository.ts`, `lib/jobs/repository.ts`, etc.) stay plain
  functions, not wrapped in classes.
  **Revisit the "was it worth it" question if:** a test suite arrives and actually injects a fake
  `EmailSender`/`JobQueue` — at that point the container pays for itself rather than sitting idle.
- **The event bus is in-process, not a message broker.** `InProcessEventBus` is a `Map` of
  handlers, not Kafka/RabbitMQ/SQS — `publish()` calls subscribers synchronously within the same
  request. That's a deliberate, calibrated choice: it gives the real decoupling benefit (an
  action states a fact, doesn't know what happens next) without operating a second piece of
  infrastructure for a single-process app.
  **Revisit if:** side effects need to run in a different process than the one that published the
  event (e.g. a separate worker fleet), not just decoupled within it.
- **No aggregate roots / value objects / event sourcing.** The one real domain invariant (no
  double-booking a slot) is still enforced by a database unique constraint, not an aggregate
  class. Domain events here describe integration facts for the job queue to react to, not an
  event-sourced write model.
  **Revisit if:** the invariant logic outgrows what a DB constraint + a repository function can
  express clearly.
- **No `UseCase`-per-operation classes.** Each repository function still has exactly one call
  site; a second plain function is sufficient without a class-per-operation ceremony.
- **No monorepo tooling (Turborepo/pnpm workspaces).** One app, one deployable package — nothing
  to orchestrate across. The `app/` → `lib/` one-directional dependency boundary is kept clean
  specifically so a future extraction is a straightforward move, not a rewrite, but no tooling
  is installed today.
  **Revisit if:** a second deployable package (a separate app, a shared design-system package,
  a mobile client) is actually justified.

## Infrastructure: Postgres-only, Docker, backups, scaling

**Redis was removed.** Phase 9 originally introduced it for sessions, and a later phase moved
generic rate limiting onto it too. Both were reverted back onto Postgres — the reasoning below
(sessions) and in the Security section (rate limiting) is written in the present tense for the
current, Postgres-only design; there is no Redis anywhere in this codebase or its infrastructure
anymore (`lib/redis.ts` is deleted, `ioredis` is uninstalled, `docker-compose.yml` no longer runs a
`redis` service).

- **Sessions live in a Postgres `Session` table, not Redis.** `lib/auth/session.ts` stores
  `token → userId` with an `expiresAt` column as the sole expiry check — read on every
  `getSession()` call, so an expired-but-not-yet-swept row is treated exactly like a missing one.
  A periodic sweep (`deleteExpiredSessions`, run hourly from `instrumentation.ts`, the same
  in-process `setInterval` pattern the job queue and backup check already use) deletes rows past
  their expiry — this is cleanup, not a correctness requirement, since expiry is already enforced
  at read time regardless of whether the sweep has run recently.
  It deliberately does **not** cache `role`/`isActive` alongside the session — every `getSession()`
  call still does one indexed `User` PK lookup for those. Caching the full user snapshot would be
  faster, but a deactivated user or a changed role wouldn't take effect until the session's full
  7-day duration ran out. The honest tradeoff: keep the fast-changing, authorization-critical
  fields live, move only the session bookkeeping itself (creation/expiry/deletion) into its own
  table.
  **This removes Redis as a hard dependency for auth** — one fewer moving piece of infrastructure
  to keep running, at the cost of one extra indexed row lookup per session check (already paying
  for one PK lookup here regardless, for the live `role`/`isActive` check above) instead of an
  in-memory read. For this app's traffic, that's a trade worth making for the simpler ops story.
- **Backups use a Postgres advisory lock, not a distributed lock service.** `lib/backup/run.ts`'s
  `runBackupIfDue()` is checked hourly (same in-process `setInterval` pattern as the job queue) but
  only actually runs `pg_dump` once every ~24h, and only on whichever replica wins
  `pg_try_advisory_lock` — a primitive the existing Postgres connection already provides, not a new
  piece of infrastructure. This is what makes the backup job safe to run on more than one instance
  at once without every replica uploading a redundant dump to S3 simultaneously.
- **Docker is one image, one `docker-compose.yml`, not an orchestration platform.** `output:
"standalone"` (Next.js's own minimal-trace build) keeps the production image small; Postgres
  stays external (already a managed service, Neon) rather than being containerized alongside the
  app. `docker-compose.yml` runs just `app` — there's one host and one external database
  dependency, so nothing beyond Compose is justified today.

### Scaling: what actually changes if this ever runs as more than one replica

The job queue's `SELECT ... FOR UPDATE SKIP LOCKED` claim and the backup job's advisory lock were
both already designed to be safe across multiple replicas sharing one Postgres — nothing changes
there. Two things genuinely would need attention first, confirmed against Next's own
self-hosting docs, not assumed:

- **`NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`** — Next.js encrypts Server Action closure variables with
  a per-build key by default. Multiple replicas built independently (or a rolling deploy mixing old
  and new instances) would get different keys, causing "Failed to find Server Action" errors on
  requests that hit a different instance than the one that rendered the page. This app leans
  heavily on Server Actions (`createBooking`, `subscribeToNewsletter`, login, every admin mutation),
  so this isn't a corner case — it needs to be set to the same base64 value across all replicas
  before running more than one.
- **A shared cache handler for `revalidatePath`/ISR.** Next's cache is per-instance filesystem by
  default; `app/admin/(dashboard)/availability/actions.ts` (and others) call `revalidatePath` after
  a mutation, which would only invalidate the replica that handled that request — other replicas
  would keep serving stale cached data until their own cache happened to expire. Fixed by
  configuring a shared `cacheHandler` pointed at Postgres or another shared store instead of the
  default in-memory one — with no Redis in this stack anymore, a Postgres-backed handler (or
  re-introducing a cache specifically for this, if it ever comes to that) is the natural choice,
  not assumed to be free.
  **Not built now** — this deployment is a single instance today, and the default filesystem cache
  is correct for that case. Both of the above are "must-do before scaling out," not "already done."

## Shop: products, checkout, orders

- **Guest checkout with a tokenized tracking link, not customer accounts.** `Order.trackingToken`
  (`@default(uuid())`, deliberately crypto-random rather than Prisma's default `cuid()` — see the
  Security section) plays the same role `Booking.manageToken` already played: a customer reaches
  `/orders/track/[token]` without ever logging in. A second, parallel registration/login system for
  customers (distinct from the `OWNER`/`ADMIN`/`EDITOR` admin auth) was deliberately not built —
  see the Phase 10 plan for the explicit scoping call.
- **Stripe Checkout (hosted), not Stripe Elements.** `app/(site)/checkout/actions.ts` redirects to
  Stripe's own hosted payment page rather than embedding a card form — card data never reaches this
  app's server at all, which is the largest realistic reduction in PCI/security scope available.
  Because it's a server-side `redirect()` to a Stripe-hosted URL, not an iframe or client-side
  `Stripe.js` call, no CSP changes were required.
- **The webhook is the only source of truth for payment.** `app/api/webhooks/stripe/route.ts`
  verifies `checkout.session.completed` via `stripe.webhooks.constructEvent` over the _raw_ request
  body (`request.text()`, never `.json()` — signature verification is computed over the exact bytes
  Stripe sent). The success-page redirect (`/orders/success`) is never treated as proof of payment,
  since that URL is reachable by just visiting it — it only looks up the `Order` by
  `stripeCheckoutSessionId` and forwards to the real tracking page.
- **Server-side price/stock re-validation, always.** The checkout action never trusts a client-sent
  price or quantity — `app/(site)/checkout/actions.ts` re-reads `Product.priceCents`/`isActive`/
  `stock` fresh from the DB before creating the Stripe session, so a tampered client request just
  gets ignored, not charged differently.
- **Oversell races are detected, not silently ignored.** `markOrderPaid` (`lib/shop/repository.ts`)
  decrements stock via a conditional `updateMany` (`WHERE stock >= quantity`) inside a
  `prisma.$transaction` — the same unique-constraint-style safety pattern `createBookingRecord`
  already used for double-booking, generalized to quantities. If the decrement affects 0 rows
  (someone else bought the last unit between session creation and webhook confirmation), the order
  is flagged `REFUND_NEEDED` and audited, rather than oversold or silently dropped.
- **Color variants own their own stock, once a product has any.** `ProductVariant`
  (`@@unique([productId, color])`) is the same "one clear owner of scarcity" pattern `Product.stock`
  already used, just moved down a level — a product with variants ignores its own `stock` field
  entirely; `markOrderPaid` decrements whichever one actually owns the line item's availability.
  Editing a product's colors never hard-deletes a `ProductVariant` (`updateProduct` upserts by
  color and deactivates anything dropped from the submitted list) for the same reason `Product`
  itself is deactivated rather than deleted once it has order history — a past `OrderItem` may
  still reference it.
- **Product images are a fully-replaced list, not incrementally patched.** `ProductImage` rows are
  deleted and recreated on every product save (`updateProduct`) — simplest-correct for a short,
  admin-managed, position-ordered list with no independent identity worth preserving across edits.
- **Cart is client-only state — no `Cart` table.** `lib/cart/CartContext.tsx` holds cart items in a
  module-level store backed by `localStorage`, read via `useSyncExternalStore` (not
  `useEffect` + `setState`, which would cascade an extra render on every mount). It only becomes a
  durable `Order` row at the moment checkout is submitted — same "simple operations stay inline"
  reasoning as `ContactMessage` above, applied to something with no invariant to enforce before
  that point.

## Admin content system: Portfolio, Services, Hero, SEO, Settings, Media, Analytics, Users

Everything that used to be hardcoded directly in component/page source — portfolio projects,
services, the homepage hero copy, SEO defaults, the studio's contact info, shipping countries — is
now admin-managed data, plus a handful of genuinely new admin surfaces (Media, Analytics, Users,
Permissions) and a visitor-facing light/dark toggle.

- **`SiteSettings` is a single-row table, not a key-value store.** `lib/settings/repository.ts`'s
  `getSiteSettings()` upserts a fixed `id: "singleton"` row on every read (schema defaults fill in
  anything never explicitly set), so every caller gets a fully-populated object with no
  null-checking — the same "one clear owner" reasoning `Product.stock` and `ProductVariant` already
  use, applied to "the studio's own settings" instead of "purchase inventory." Wrapped in React's
  `cache()` (same pattern `getSession()` already uses) so the several places that read it in one
  request — root layout metadata, root layout JSON-LD, the site layout's Footer — share a single
  DB round-trip.
- **Content components take their data as props, they don't fetch it themselves.** `Hero`,
  `ServicesSection`, `ServiceSchema` were client components importing a static array directly;
  they now accept `services`/`tagline`/`categories` as props, fetched once by whichever Server
  Component renders them (the homepage, `/services`). This is the same "server-fetched data passed
  into a client component" shape `AddToCartButton`/`ProductGallery` already used for Shop — nothing
  new, just applied to content that used to be hardcoded.
- **`revalidatePath` needs the `"layout"` type when data feeds a shared layout, not just a page.**
  A real bug caught during this phase: `revalidatePath("/")` only busts the cache for the homepage
  itself. `SiteSettings` fields feed the _root_ layout's JSON-LD (address, social links) and the
  _site_ layout's Footer (social links) — both wrap every route, not just `/`. Since revalidating
  `"/"` with `{ type: "layout" }` cascades to every layout in `/`'s chain (root layout **and** site
  layout, route groups included), that's what the Settings/SEO admin actions actually call —
  a plain page-level `revalidatePath("/")` would have left every other page's cached Footer/JSON-LD
  stale until it happened to revalidate on its own. Hero and Services don't have this problem since
  neither feeds a shared layout, only the specific pages that already get revalidated directly.
- **The visitor light/dark toggle re-themes ~40 files by redefining two CSS variables, not by
  rewriting them.** The entire public UI is built on Tailwind's own `white`/`black` color utilities
  (`bg-black`, `text-white`, `border-white/15`, …) as this project's de-facto background/foreground
  tokens. Confirmed against the actual compiled CSS output (not assumed) that Tailwind v4 generates
  `.text-white { color: var(--color-white) }` — a real CSS variable, not an inlined literal, even
  for opacity-modifier variants (`color-mix(in oklab, var(--color-white) 70%, transparent)`). So
  `app/globals.css` redefines `--color-white`/`--color-black` (swapped) under
  `html[data-theme="light"] [data-site-root]`, and every one of those ~200 existing class usages
  across ~40 files re-themes for free. `[data-site-root]` (the site layout's own root element, not
  `<html>`) is what keeps the admin panel — which intentionally stays dark-only — unaffected
  regardless of the visitor's stored preference. The three genuinely custom-CSS pieces
  (`.card-gradient`, `.chrome-text`, `.nav-dot`) and the logo image (a white PNG, inverted via a
  `--logo-filter` variable) get their own explicit light-theme values since they're not Tailwind
  utilities. A handful of purely decorative inline gradients (Hero's liquid-chrome blob, the grid
  overlay) are literal `rgba(255,255,255,…)` values in component `style` attributes, not Tailwind
  classes — they don't invert, a disclosed limitation rather than new light-mode art direction.
  The theme itself is set via `data-theme` on `<html>`, written by a `next/script`
  `strategy="beforeInteractive"` inline script (confirmed via Next's own docs: these always inject
  into `<head>` and run before hydration, avoiding a flash of the wrong theme) — not a manually
  rendered `<head>` element, which Next's docs caution against in root layouts.
- **Users are deactivated, never deleted — and User management is OWNER-only**, stricter than
  every other admin section (`["OWNER", "ADMIN"]`). A `User` row is referenced by `LoginAttempt`,
  `Session`, and `AuditLog.actorId`, so deleting one the same way `Product`/`PortfolioProject`
  aren't hard-deleted once they have real history. OWNER-only specifically because role assignment
  is the one admin action where an `ADMIN` account granting itself `OWNER` would be a real privilege
  escalation, not just a data-integrity concern. `updateUserAction` also blocks demoting or
  deactivating the last active `OWNER`, so the studio can't accidentally lock itself out.
- **Media is a read-only-ish browser over what's already in Cloudinary, not a new upload system.**
  Scoped to `type: "upload"` (public) assets only — contact-form attachments are uploaded as
  `type: "authenticated"` (private, `lib/storage/cloudinary.ts`'s existing `uploadAttachment`) and
  are deliberately excluded, so this doesn't undermine that existing privacy boundary. In practice
  it browses whatever's been uploaded directly via Cloudinary's own dashboard for Products/Portfolio
  images, with a "Copy URL" action to paste into those forms without leaving the admin panel.
- **The internal Analytics dashboard queries existing tables directly — no new tracking, no new
  schema.** Bookings/revenue/top-products come from raw, parameterized `$queryRaw` date-bucketing
  (same safe pattern `lib/backup/run.ts`/`lib/jobs/repository.ts` already use) against `Booking`,
  `Order`, `OrderItem` — rendered as plain CSS bar charts rather than pulling in a charting
  dependency for a small internal dashboard. This is deliberately separate from Google Analytics
  (GA4, `components/GoogleAnalytics.tsx`) — one answers "how's the business doing" from data this
  app already owns, the other answers "who's visiting and from where," which is Google's own
  dashboard to view, not reimplemented here.
- **GA4 only loads after cookie consent, never before.** `components/CookieConsent.tsx` stores an
  explicit accept/decline choice in `localStorage`; `components/GoogleAnalytics.tsx` checks that
  choice (via `useSyncExternalStore`, not `useEffect` + `setState`, same reasoning as the cart
  context) and renders nothing at all — not even `next/script`'s `beforeInteractive` tag — until
  consent is "accepted." Required, not optional polish: GA4 sets cookies, and this studio is
  Greece-based, so GDPR applies to its EU visitors.
- **Permissions is a reference page, not a permission editor.** It lists what each `Role` can
  currently do, derived from reading the `requireRole([...])` calls already scattered across every
  admin page — genuinely useful documentation, but changing access still means editing the relevant
  page's own `requireRole` call, not a database-driven, admin-editable capability matrix. Building
  the latter would touch every one of those call sites for a feature that wasn't clearly asked for
  at that depth.

## Journal: the studio's news & updates CMS

A full editorial CMS — articles with a real rich-text editor, categories, tags, scheduled
publishing, SEO fields, and a public reading experience — added as its own bounded context
(`Article`/`JournalCategory`/`JournalTag`, `lib/journal/`, `components/journal/`,
`app/admin/(dashboard)/journal/`, `app/(site)/journal/`), not bolted onto any existing content
type. Portfolio/Services already existed as a template for "admin-managed content with a public
listing," but a Journal article has a fundamentally bigger shape (rich body content, SEO, taxonomy,
scheduling) that would have strained that template rather than reused it cleanly.

- **Draft/scheduled/published/archived is two fields, not four states.** `Article.status`
  (`DRAFT`/`PUBLISHED`/`ARCHIVED`) plus `publishedAt` are the whole model — a `PUBLISHED` row with a
  future `publishedAt` _is_ what "scheduled" means, filtered out by the public query
  (`publishedAt <= now()`) until its time arrives. No sweep job promotes it; there's nothing to
  promote. Same reasoning `Session`/`RateLimitBucket` already apply to `expiresAt` instead of a TTL,
  applied here to avoid a whole class of "did the sweep run yet" bugs.
- **Content is sanitized on every save, not just on first write.** `lib/journal/sanitize.ts` runs
  the editor's HTML output through `sanitize-html` with an allowlist matching exactly what the
  editor can produce (including a restricted `allowedIframeHostnames` for the YouTube embed —
  the one place this content allows an `iframe` at all). `content` is stored already-sanitized and
  rendered via `dangerouslySetInnerHTML` on the public page — treating admin/editor-authored rich
  text as untrusted input, the same boundary this app already draws around user-submitted content
  elsewhere, not a boundary assumed away because the author has an admin login.
- **Three custom Tiptap nodes exist because no stock extension covers them**: a `Callout` (holds
  real block content, so no custom NodeView is needed — editing inside it is just ordinary
  ProseMirror editing), a `ctaButton` (atomic, attributes only, inserted via a prompt), and a
  `Gallery` (the one node with a real React `NodeView` — `GalleryView.tsx` — since add/remove image
  UI genuinely needs interactive chrome the other two don't). The Gallery's `renderHTML` emits both
  the `data-images` attribute (read back by the editor's NodeView) _and_ real `<img>` children
  (needed for the plain-HTML public page render, which has no Tiptap/React runtime) — an easy detail
  to miss, since the editor alone would work fine with just the attribute.
- **Featured images crop client-side, then upload once — not upload-then-crop.** `react-easy-crop`
  produces a pixel region against a local `URL.createObjectURL()` preview (needs `blob:` in the
  CSP's `img-src`, the one addition this feature made to `next.config.ts`); `lib/journal/crop-image.ts`
  draws just that region to an offscreen canvas and uploads the _cropped_ result via
  `uploadPublicImage()` (`lib/storage/cloudinary.ts`) — a genuinely new function, since the only
  upload path that existed before this (`uploadAttachment`) is deliberately private
  (`type: "authenticated"`, for contact-form attachments); Journal images need the opposite —
  public, CDN-served, same as Product/Portfolio images already are.
- **Excerpt, reading time, and SEO title/description all have the same shape: a manual override
  that falls back to something auto-derived.** `lib/journal/excerpt.ts`/`reading-time.ts` strip the
  stored HTML to plain text and derive a value from it; the SEO fields fall back to
  `title`/the derived excerpt in the same way. The admin never has to fill in the obvious default,
  matching the same "upsert a sensible default, never null-check at the call site" reasoning
  `SiteSettings` already established.
- **A real, found-by-testing bug, not a hypothetical one: `ConfirmSubmitButton` (used by every
  admin delete/archive/duplicate action sitewide, not just the Journal) never refreshed the route
  after a successful action.** It calls the bound Server Action directly (`await action()` inside
  `startTransition`), not through a `<form action={...}>` binding — the mechanism Next.js's
  automatic post-action route refresh actually hooks into. Without an explicit `router.refresh()`,
  a deleted/renamed row stayed visible until the next manual navigation, discovered by an actual
  browser-driven end-to-end test (delete an article, watch it linger in the list) rather than
  `curl`, which can't see this class of client-rendering staleness. Fixed once, centrally, in
  `ConfirmSubmitButton` itself — every consumer (Products, Services, Portfolio, Bookings, Orders,
  Media, Journal) benefits, not just the flow that surfaced it. The Journal's own category/tag
  create-and-rename forms had the identical gap for the identical reason and got the identical fix.
- **The same test also re-confirmed a previously-identified, still-unfixed bug and fixed it
  properly this time**: `ConfirmSubmitButton`'s generic `catch` around `await action()` was
  swallowing Next.js's `redirect()` throw for any bound action that redirects (e.g. the public
  "cancel my booking" flow) — a false "Something went wrong" even though the action succeeded. Now
  checks for the `NEXT_REDIRECT`-prefixed `.digest` Next's own `RedirectBoundary` uses internally
  (there's no stable public export for this specific check) and re-throws it instead of swallowing it.

**Explicitly not built now — the request's own "Future Ready" list, and why today's shape doesn't
block any of it:** comments, newsletter cross-posting, AI article generation/SEO suggestions,
multi-author bylines, member-only articles, reactions, bookmarks, an RSS feed, and multilingual
articles. None of these needed anticipating structurally: comments/reactions/bookmarks are each a
new table with an `articleId` foreign key, no different from how `OrderItem` already relates to
`Order`; multi-author is `authorName: String?` becoming a real relation to `User` once there's more
than one person publishing (same shape `AuditLog.actorId` already uses for "who did this"); an RSS
feed is a new route reading the same `listPublishedArticles()` the `/journal` page already calls,
serialized as XML instead of HTML; member-only articles is a boolean gate plus whatever the
Client Portal / Memberships initiative (see `docs/ROADMAP.md`) eventually builds for identifying a
visitor at all — the real prerequisite there is Customer Accounts, not anything about how `Article`
is shaped. Content version history is the one item that's a genuine, non-trivial addition (a
history table, or a real audit-log-style diff) rather than a natural extension of what exists —
flagged here rather than quietly deferred without saying so.

## Database schema: tables, relationships, indexes

23 models across six bounded contexts — auth (`User`, `Session`, `RateLimitBucket`,
`LoginAttempt`), booking (`AvailabilityRule`, `BlockedDate`, `Booking`), shop (`Product`,
`ProductImage`, `ProductVariant`, `Order`, `OrderItem`), content (`PortfolioProject`, `Service`,
`SiteSettings`), the Journal (`Article`, `JournalCategory`, `JournalTag` — see its own section
below), and a handful of standalone operational tables (`ContactMessage`,
`NewsletterSubscriber`, `Job`, `BackupLog`, `AuditLog`). Each already has its data-access module
listed in "Where things live" below; this section covers the schema itself, not the repositories.

- **Eight real foreign keys exist** (one added with the Journal —
  `Article.categoryId`, `SetNull` on delete, Prisma's own default for an optional relation, made
  explicit rather than left implicit), and each one was a deliberate `Cascade`-vs-`Restrict`
  choice, not a default left unexamined: `Session.userId` and `ProductImage.productId`/
  `ProductVariant.productId` cascade, because a session or image has no meaning without its
  parent. `OrderItem.productId`/`OrderItem.variantId` explicitly do **not** cascade (default
  `Restrict`) — a product with order history can't be deleted, only deactivated, so past orders
  always resolve; this is the same reasoning the Shop section above states for `Product`/
  `ProductVariant` themselves, just visible again at the constraint level.
- **`AuditLog.actorId`/`AuditLog.targetId` are deliberately soft references, not foreign keys** —
  plain strings, not `@relation` fields. An audit row has to survive the actor being deleted (system-
  initiated events have no actor at all) and `targetId` can point at whichever table `action`
  implies, which a single FK column can't express.
- **Indexes are audited against the live database, not migration history.** `pg_indexes` was
  queried directly rather than trusting a grep across `prisma/migrations/*/migration.sql` — this
  project's migration history has real churn (`Session` alone has been reshaped twice: a
  NextAuth-style table, then Redis-only with no table at all, then the current design), so a flat
  concatenation of every migration's `CREATE INDEX` statements includes indexes that were long
  since dropped. Every index below is cross-checked against an actual `WHERE`/`ORDER BY` in
  `lib/*/repository.ts` or an admin/analytics page — not added speculatively.
- **One optimization pass (migration `optimize_indexes`) fixed three real gaps**, found this way:
  `OrderItem` had no index beyond its primary key, despite `orderId` being filtered on every
  order-detail fetch (admin list/detail, the tracking page, the payment webhook's `include: {
items: true }}`) and `productId` backing the analytics "top products" join — Postgres doesn't
  auto-index foreign keys the way MySQL does, so both needed adding explicitly
  (`@@index([orderId])`, `@@index([productId])`). `ContactMessage` had zero indexes at all despite
  `/admin/messages` running an unbounded `findMany({ orderBy: createdAt desc })` on every load —
  same shape `BackupLog` already had an index for, so it got the same treatment
  (`@@index([createdAt])`).
- **The same pass fixed two indexes that didn't match their real query.** `AuditLog`'s
  `[action, createdAt]` composite was replaced with plain `[createdAt]` — `listRecentAudits()` only
  ever does `ORDER BY createdAt DESC LIMIT n` with no `action` filter (there's no action-filtering
  admin UI), so the composite's leading column was never actually usable. `Order`'s
  `[customerEmail]` index was removed outright: grepping every consumer confirmed `customerEmail`
  is only ever displayed (admin order list/detail, the tracking page), never filtered on — pure
  write overhead with no query behind it. In its place, `Order` gained `@@index([status,
createdAt])`, which does back a real query — the analytics dashboard's `getRevenuePerDay`/
  `getTotals` filter on exactly `status IN (...) AND createdAt >= ...`.
- **`LoginAttempt`'s `[email, createdAt]`/`[ipAddress, createdAt]` indexes were kept despite not
  being hit by any current query** — `/admin/login-history` only lists the most recent 100 rows
  unfiltered, and rate limiting counts via `RateLimitBucket`, not this table. Unlike `Order`'s
  removed index, these have clear forward intent: `LoginAttempt` is a security audit trail
  specifically, and "attempts by this email" / "attempts from this IP" is the exact forensic query
  an incident response would need. Kept on intent, not on current usage — the opposite call from
  `Order.customerEmail`, for a stated reason rather than a default.
  **Revisit if:** a login-history filter UI is ever built — at that point these indexes start
  paying for themselves on read, not just standing by.
- **`Session.userId` and `LoginAttempt.userId` stay unindexed on purpose.** Both are foreign keys
  that would normally speed up a cascading delete from `User`, but users are deactivated in this
  app, never deleted (see the Admin content system section) — that delete path never runs. Adding
  an index for a delete that doesn't happen would repeat the exact mistake the `Order.customerEmail`
  removal above just corrected.

## API surface: HTTP routes and Server Actions

There's no conventional REST API here — almost every mutation is a Server Action invoked directly
from the form that needs it, not a documented URL an external client calls. Only three routes under
`app/api/` (`health`, `jobs/process`, `webhooks/stripe`) have the traditional method+path+status
contract; everything else (29 Server Actions across the public site and the admin panel) is a typed
RPC call whose "request shape" is a Zod schema, not a wire format.

- **Every unauthenticated write action is rate-limited and Zod-validated — that's the pattern, not
  an exception.** `createBooking`, `createCheckoutSession`, `submitContactEmail`,
  `subscribeToNewsletter`, and `login` all pair a `lib/rate-limit.ts` check with a schema before
  touching the database. Authenticated admin actions skip rate limiting on purpose —
  `requireRoleForAction` is the actual boundary there, and adding a second one wouldn't stop
  anything a valid session couldn't already do.
- **One optimization pass fixed three gaps, found by checking each action against what its own UI
  already promised**, not against a hypothetical spec:
  - `rescheduleBooking` (`app/(site)/contact/book/manage/[token]/actions.ts`) was the one
    unauthenticated write action with neither a rate limit nor a Zod schema — every sibling public
    action has both. A malformed `newStart` produced an Invalid Date that crashed several calls deep
    (`isSlotAvailable` → `NaN` date parts → an invalid timestamp reaching Postgres) instead of
    failing gracefully. Fixed with the same schema+rate-limit pairing every other public action uses.
  - `deleteProductAction`'s own confirm dialog states "products with existing orders can't be
    deleted — deactivate them instead," but nothing enforced it: `OrderItem.productId`'s FK
    `Restrict` does refuse the delete at the database level, but the resulting `P2003` violation
    was never caught, so it crashed to the nearest error boundary instead of showing that message.
    `deleteProduct()` (`lib/shop/repository.ts`) now catches `P2003` and returns a typed
    `{ ok: false, reason: "has_orders" }`, the same shape `createUserAction` already uses for a
    duplicate-email `P2002`.
  - `ConfirmSubmitButton` (used by all 8 admin delete/cancel confirmations) had no way to show a
    failure at all — an action either silently succeeded or threw all the way to the page's error
    boundary. It now accepts an optional `{ error }` return and catches anything that still throws,
    so every one of those 8 call sites degrades to a message instead of a crash — `deleteMediaAction`
    inherited this for free, since a Cloudinary API failure was exposed to the exact same gap.
  - `/api/jobs/process`'s bearer-secret check used a plain `!==`, the one comparison in the app that
    hadn't been brought up to the timing-safe standard `login`'s password check already established
    (`app/admin/(auth)/login/actions.ts` burns a dummy `argon2` verify against a nonexistent email
    specifically to avoid leaking account existence via response timing). Swapped for
    `crypto.timingSafeEqual`.
- **The Stripe webhook has no rate limit, and that's correct, not an oversight** — it's authenticated
  by signature (`stripe.webhooks.constructEvent`), and Stripe, not an end user, controls delivery
  frequency; throttling it risks dropping a legitimate retry.

## Security

- **CSRF** — already covered by Next's own Server Actions, not rebuilt. Server Actions compare the
  request's `Origin` against the host and reject cross-origin calls unless `allowedOrigins` is
  explicitly configured (it isn't here) — confirmed against Next's own bundled docs. The Stripe
  webhook route uses a different, correctly-matched mechanism instead (signature verification),
  since it's a server-to-server call, not a browser-originated one.
- **SQL injection** — already covered. Every raw query in the codebase (`api/health`,
  `lib/backup/run.ts`, `lib/jobs/repository.ts`) uses tagged-template parameterization
  (`` prisma.$queryRaw`...` ``); everywhere else goes through Prisma's query builder. Confirmed via a
  repo-wide grep, not assumed.
- **Rate limiting** — `lib/rate-limit.ts`, a generic fixed-window limiter backed by a
  `RateLimitBucket` Postgres table: a single atomic `INSERT ... ON CONFLICT DO UPDATE` per check
  plays the same role Redis's `INCR`+`EXPIRE` would, using the row's own `expiresAt` column as the
  window boundary instead of a TTL (an earlier revision of this limiter did use Redis; it was
  reverted along with sessions — see the Infrastructure section). Applied to login, checkout-session
  creation, contact-form submission, newsletter signup, and booking creation. The Stripe webhook
  route is intentionally exempt — it's authenticated by signature, not by request volume from an
  end user. A periodic sweep (`deleteExpiredRateLimitBuckets`, hourly from `instrumentation.ts`)
  deletes rows past their window, for the same "cleanup, not correctness" reason `Session` rows are
  swept — the check itself already re-validates `expiresAt` on every call.
- **XSS** — the only `dangerouslySetInnerHTML` usage sitewide is JSON-LD structured data
  (`app/layout.tsx`, `BreadcrumbSchema`, `FaqSchema`, `ServiceSchema`). `JSON.stringify` alone
  doesn't escape `<`, so a `</script>`-containing string could break out of the script tag; all four
  call sites go through `safeJsonLd()` (`lib/seo/json-ld.ts`), which escapes `<` to `<`. Closed
  now, before admin-editable `Product.description` gives it something real to exploit.
- **Audit logs** — `AuditLog` (`lib/audit/repository.ts`) records admin/system mutations on
  sensitive resources: product create/update/delete, order shipped/cancelled, and oversell events
  flagged `REFUND_NEEDED`. Distinct from `LoginAttempt`, which predates it and covers a narrower,
  already-working concern (the `/admin/login-history` audit trail specifically).
  `checkLoginRateLimit`'s throttling and `LoginAttempt`'s logging are intentionally two separate
  mechanisms for that reason.
- **Secrets** — all credentials (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`,
  `AWS_SECRET_ACCESS_KEY`, etc.) are environment variables, never committed; `.env.example`
  documents the shape without real values. No new secret-handling pattern was introduced for the
  shop — it follows the same convention as every existing integration.
- **Encryption** — no new requirement identified beyond what the managed Postgres provider (Neon)
  already provides at rest, and TLS in transit (already enforced via `sslmode=require`). Card data
  specifically never reaches this app's own database at all, since Stripe Checkout is hosted.
- **Money-adjacent tokens use `uuid()`, not `cuid()`.** `Order.trackingToken` overrides Prisma's
  default ID generator with `@default(uuid())` — `cuid` is designed for sortable uniqueness, not
  unguessability, so anything reachable by knowing the token alone (order tracking, booking
  management) gets the stronger, crypto-random default instead.

## Quality: testing, performance, accessibility, monitoring

Audited against the running production build (`npm run build` + the real standalone server, not
`next dev`), real Lighthouse runs, and a real 3-engine/3-viewport smoke test — not assumptions.

- **`npm start` (`next start`) doesn't actually match this app's own `output: "standalone"` config**
  — confirmed by running it: Next.js prints a warning that they're incompatible, and the served
  bundle is subtly different from what `Dockerfile` actually ships (`node server.js` from the
  standalone output, with `public/` and `.next/static` copied in as separate `COPY` steps). A local
  `npm start` was therefore never quite testing what production runs. Fixed with
  `scripts/start-standalone.mjs` (`npm run start:standalone`) — mirrors Dockerfile's copy steps and
  launches the real standalone `server.js`, so "does this behave like production" can actually be
  answered locally.
- **Lighthouse (production build): 100/100/100/100 (performance/accessibility/best-practices/SEO)
  on desktop** across `/`, `/shop`, `/portfolio`, `/services`, `/contact` — confirmed after fixing
  the two real findings below. `/cart` scores 69 on SEO for exactly one reason:
  `robots.txt` blocks it from indexing — correct, deliberate behavior for a cart page, not a defect
  to chase.
- **The hero `<h1>` — this app's LCP element on every page that renders `Hero` — was gated behind
  a `framer-motion` `whileInView` + opacity animation.** Real, non-simulated mobile throttling
  (Lighthouse `--throttling-method=devtools`, mobile) measured this costing several real seconds:
  LCP 5.3s and a performance score of 62 before the fix. The IntersectionObserver has to wait for
  JS hydration to even attach, then fire, then run a 0.6s transition — all before the page's most
  important text becomes "contentful" by Core Web Vitals' definition, even though the element
  itself was already downloaded and ready to paint in under 500ms. `components/Hero.tsx` now
  renders the `<h1>` immediately, outside any motion wrapper — the surrounding chrome (dot-line
  markers, tagline, category tags) keeps its `whileInView` entrance animation unchanged, since none
  of that is ever the LCP candidate. Confirmed fix: LCP 5.3s → 2.1s, performance score 62 → 84,
  same real throttling, same page, no other change. Desktop was already fine before and after
  (LCP 0.5s under real throttling) — this was specifically a slow-connection/low-end-device problem,
  invisible on a fast desktop lab run, which is exactly why it went unnoticed.
- **A real WCAG AA contrast failure, caught by Lighthouse, traced back to a violation of this
  codebase's own documented rule.** `app/globals.css`'s `--text-muted` (60% white on black) has an
  explicit comment stating it's the one opacity tier that clears 4.5:1 for real text — but 8 call
  sites across the app used `text-white/30` (30% opacity, ~2.44:1) for genuine label text ("2
  colors", "(inactive)", "Sold out", an admin nav-group label) instead. The original comment's own
  carve-out for "micro-labels" at a 3:1 threshold was itself the bug: WCAG's lower 3:1 bar is for
  non-text UI/graphics, not small text — text size doesn't relax the 4.5:1 requirement, only WCAG's
  "large text" threshold does (≥18pt/14pt-bold, which no `.tracked-label` usage reaches). All 8 were
  swapped to `.text-muted`; the misleading comment was corrected. `placeholder:text-white/30` (form
  hints) and decorative icons at the same opacity were left alone — genuinely exempt, unlike the
  label text they were confused with.
- **Cross-browser/cross-device: verified, not assumed.** A Playwright smoke test loaded all 6
  public pages across Chromium, Firefox, and WebKit, at mobile/tablet/desktop viewports (54 checks
  total) — every load returned 200, and **zero** produced horizontal overflow at any viewport in
  any engine, confirming the Tailwind responsive breakpoints actually hold up across rendering
  engines, not just the one used during development. One WebKit-only console error appeared once
  (a Sentry envelope beacon failing to send on `/cart`) and did not reproduce on a second run —
  logged here as an observed, non-reproducing, environment-specific blip, not a confirmed bug.
- **Testing.** Vitest now covers the pure, deterministic logic most likely to silently regress:
  `lib/booking/slots.ts`'s Athens timezone math (including a real EET↔EEST DST-offset assertion,
  not just "does it run"), `lib/shop/format.ts`'s price formatting, `lib/auth/password.ts`'s
  hash/verify round-trip, and `lib/seo/json-ld.ts`'s `safeJsonLd` — proven to actually break a
  `</script>` injection, not just that it runs without throwing. See
  [docs/DEVELOPER_GUIDE.md](./docs/DEVELOPER_GUIDE.md#testing) for exactly what is and isn't
  covered (no repository/Server Action/integration/E2E tests yet — all require a real or mocked
  database and request context that doesn't exist today).
- **Monitoring was already solid — audited, not rebuilt.** Sentry is wired on both
  `instrumentation.ts` (server) and `instrumentation-client.ts` (browser) with
  `tracesSampleRate: 1`, the CSP already allowlists Sentry's ingest origins, and `/api/health`
  exists specifically for external uptime monitors. No gap found here worth adding to.
- **A pre-existing `npm audit` finding (moderate, in `next`'s own vendored `postcss`) was checked
  and left alone.** It's nested inside `next`'s dependency tree, not a direct dependency this app
  controls, and npm's own suggested fix is a major Next.js downgrade — clearly not the right call
  for a documentation/quality pass. Flagged here so it's a known, deliberately-deferred item, not a
  silently-ignored one.

## Design system: tokens vs. primitives

Two different things get called "design system," and this codebase had one but not the other.
**Tokens** (color, spacing, one focus-ring accent, one content-width) were already disciplined —
confirmed by grepping for arbitrary Tailwind values (`p-[...]`, breakpoint overrides) and finding
none outside the one case fixed below. **Shared component primitives** didn't exist at all: every
button, input, card, and form-error message was a hand-copied Tailwind string, independently
repeated across 13–17 files each. `components/ui/` now holds what those files were all
independently reinventing.

- **Zero `components/ui/` primitives existed before this pass — the actual finding.** Grepping for
  the exact repeated class strings: the input style (`border-white/15 bg-transparent ...
placeholder:text-white/30`) appeared in 13 files, the submit-button style
  (`border-white/15 ... hover:border-white/40 disabled:opacity-50`) in 15 files (17 occurrences),
  the list-item card style (`border-white/10 p-4`) in 14 files, and the error-message pattern
  (`role="alert"` + `text-sm text-red-400`) in 17 places. None of this was a visual inconsistency —
  every one of those was byte-identical or near-identical — it was _unenforced_ consistency,
  one edit away from drifting the next time someone touched only one of the 13+ copies.
- **Seven primitives now exist** (`components/ui/Button.tsx`, `Input.tsx`, `Textarea.tsx`,
  `Select.tsx`, `FormError.tsx`, `Card.tsx`, `LinkButton.tsx`), each owning the "identity" classes
  that were duplicated (border, focus-ring, hover, disabled state, `role="alert"` + red-400) while
  leaving padding/width/layout to a `className` prop per call site — a deliberate design, not a
  half-measure: those genuinely vary by context (a compact admin form vs. a sparse public one), so
  centralizing them would just move the duplication rather than remove it. `Button` also folds in
  `disabled={pending} aria-busy={pending}`, which was hand-repeated identically at every call site
  and easy to forget on a new one.
- **One deliberate exception, not an oversight: `ConfirmDialog`'s and `CookieConsent`'s
  higher-emphasis "confirm/accept" buttons stay hand-styled.** They use a different border color
  (`border-white/40` vs. the standard `border-white/15`) for intentional visual emphasis. Since
  Tailwind utility classes have equal CSS specificity, whichever `border-*` utility happens to
  appear later in the _compiled_ stylesheet wins a conflict — not whichever appears later in the
  `className` string — so composing a color override via `<Button className="border-white/40">`
  would be relying on undefined-in-practice class order rather than a real API. Left as plain
  `<button>`s rather than forcing a fragile composition onto a primitive built for one visual style.
- **A real token inconsistency, found and fixed: the site's 1200px content width was expressed two
  ways.** `.section-container`'s own `max-width: 1200px` and a hardcoded `max-w-[1200px]` arbitrary
  value, independently repeated in `Nav.tsx` (both bars), `Footer.tsx` (×2), `Hero.tsx`, and
  `CookieConsent.tsx` — six copies of the same design decision with no shared source. Consolidated
  into one `--content-width` custom property (`app/globals.css`), referenced everywhere as
  `max-w-[var(--content-width)]` — Tailwind's arbitrary-value syntax accepts a CSS variable
  directly, so this needed no Tailwind config changes, matching how `--focus-ring`/`--text-muted`
  already work in this file.
- **Icon sizing, breakpoints, and animation timing were audited and left alone — informal but not
  actually inconsistent.** Icon `size` props cluster around a small, real set (12/14/16/18/22/28–32)
  that maps sensibly to role (remove-icon → nav icon → empty-state icon), just not written down
  anywhere; not mechanically converted to named constants, since the existing usage already reads
  clearly and 48 call sites of low-risk cosmetic churn wasn't worth it for a non-broken pattern.
  Breakpoints are deliberately just `sm:`/`lg:` sitewide (no arbitrary values, no `md:`/`xl:` —
  confirmed via grep) — a genuinely minimal, consistent two-tier system, not a gap; the Quality
  pass's cross-browser matrix already verified zero layout overflow at any tested viewport.
  Animation durations (`0.15s`/`0.2s` for modal/overlay chrome, `0.6s` for the shared `fadeInUp`
  scroll-reveal) are literal values repeated in a handful of places rather than named constants —
  noted as a minor future candidate, not fixed here, since the values are already consistent within
  each use case and touching them risked exactly the kind of unnecessary churn this section
  otherwise argues against.
- **Verified, not assumed:** every primitive-adopting file was checked with `tsc`/`eslint`/
  `prettier`/`npm run build`, then the actual rendered DOM was inspected on a running production
  build (`computed class` on the login page's submit button and email input matched the original
  hand-written strings exactly, just reordered) and smoke-tested across 9 pages with zero new
  console errors and zero layout overflow — the same real-browser verification approach the
  Quality pass established.

## Where things live (quick reference)

| Concern                                                    | Location                                                                                                                                                                                        |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Session/auth guards                                        | `lib/auth/session.ts` (`requireSession`/`requireRole` for pages, `requireSessionForAction`/`requireRoleForAction` for Server Actions; sessions themselves live in the Postgres `Session` table) |
| Booking slot computation (Europe/Athens, DST-safe)         | `lib/booking/slots.ts`                                                                                                                                                                          |
| Booking/availability data access                           | `lib/booking/repository.ts`                                                                                                                                                                     |
| Newsletter data access                                     | `lib/newsletter/repository.ts`                                                                                                                                                                  |
| Domain events + subscribers                                | `lib/events/` (`types.ts`, `bus.ts`, `subscribers.ts`, `publishEvent()` in `index.ts`)                                                                                                          |
| Background job queue (types, claim/backoff, worker)        | `lib/jobs/` (`types.ts`, `repository.ts`, `worker.ts`, `processors.ts`)                                                                                                                         |
| DI wiring (EmailSender/JobQueue/EventBus tokens)           | `lib/container.ts`                                                                                                                                                                              |
| Outbound email (Resend client + templates)                 | `lib/email/` (`sender.ts` is the DI-facing `EmailSender` implementation; `resend.ts`/`templates/` are unchanged)                                                                                |
| File uploads (Cloudinary, signed URLs)                     | `lib/storage/cloudinary.ts`                                                                                                                                                                     |
| Canonical site URL                                         | `lib/seo/site.ts`                                                                                                                                                                               |
| Prisma client singleton                                    | `lib/prisma.ts`                                                                                                                                                                                 |
| Automated database backups                                 | `lib/backup/` (`run.ts`'s `runBackupIfDue`, `repository.ts`)                                                                                                                                    |
| Product/order data access, stock decrement                 | `lib/shop/repository.ts`                                                                                                                                                                        |
| Stripe client singleton + webhook secret                   | `lib/shop/stripe.ts`                                                                                                                                                                            |
| Cart client state (localStorage-backed)                    | `lib/cart/CartContext.tsx`                                                                                                                                                                      |
| Checkout Server Action + Stripe webhook                    | `app/(site)/checkout/actions.ts`, `app/api/webhooks/stripe/route.ts`                                                                                                                            |
| Generic rate limiting (Postgres)                           | `lib/rate-limit.ts`                                                                                                                                                                             |
| Audit log                                                  | `lib/audit/repository.ts`                                                                                                                                                                       |
| Site settings singleton (studio info, SEO, hero, shipping) | `lib/settings/repository.ts`                                                                                                                                                                    |
| Portfolio/Services data access                             | `lib/portfolio/repository.ts`, `lib/services/repository.ts`                                                                                                                                     |
| User management data access                                | `lib/users/repository.ts`                                                                                                                                                                       |
| Internal analytics queries                                 | `lib/analytics/repository.ts`                                                                                                                                                                   |
| Media library (Cloudinary list/delete)                     | `lib/storage/cloudinary.ts` (`listMediaAssets`, `deleteMediaAsset`)                                                                                                                             |
| Visitor light/dark theme (tokens, toggle)                  | `app/globals.css` (`[data-theme]`/`[data-site-root]`), `components/ThemeToggle.tsx`, theme-init script in `app/layout.tsx`                                                                      |
| Cookie consent + Google Analytics                          | `components/CookieConsent.tsx`, `components/GoogleAnalytics.tsx`                                                                                                                                |
| JSON-LD XSS escaping helper                                | `lib/seo/json-ld.ts`                                                                                                                                                                            |
| Unit tests                                                 | `vitest.config.ts`; `*.test.ts` colocated next to the source file it covers                                                                                                                     |
| Docker-parity local production server                      | `scripts/start-standalone.mjs` (`npm run start:standalone`)                                                                                                                                     |
| Shared UI primitives (Button, Input, Card, etc.)           | `components/ui/`                                                                                                                                                                                |
| Journal data access (articles, categories, tags)           | `lib/journal/repository.ts`                                                                                                                                                                     |
| Journal helpers (excerpt, reading time, sanitize, slugify) | `lib/journal/`                                                                                                                                                                                  |
| Rich text editor (Tiptap + custom nodes)                   | `components/journal/editor/`                                                                                                                                                                    |
| Featured image upload/crop                                 | `components/journal/FeaturedImageEditor.tsx`, `lib/journal/crop-image.ts`                                                                                                                       |
| Public Journal pages (listing, article, sitemap entries)   | `app/(site)/journal/`, `app/sitemap.ts`                                                                                                                                                         |
| Journal admin (articles, categories, tags)                 | `app/admin/(dashboard)/journal/`                                                                                                                                                                |
