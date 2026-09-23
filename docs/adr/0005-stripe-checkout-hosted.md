# 0005. Stripe Checkout (hosted), not Stripe Elements

Status: Accepted
Date: 2026-07-21 (recorded retroactively)

## Context

The shop needs to take card payments. Stripe offers two integration shapes: Stripe Elements (an
embedded, custom-styled card form, rendered inside this app) or Stripe Checkout (a redirect to a
Stripe-hosted payment page). Elements gives more control over the purchase flow's look; Checkout
gives up that control in exchange for never having card data touch this app's server at all.

## Decision

`app/(site)/checkout/actions.ts` redirects to Stripe's own hosted Checkout page — no embedded card
form, no `Stripe.js` Elements integration.

## Consequences

- The largest realistic reduction in PCI/security scope available to this app: card data never
  reaches this server, so there's no card-handling code to secure, audit, or get wrong.
- Because it's a server-side `redirect()` to a Stripe-hosted URL — not an iframe or a client-side
  `Stripe.js` call — no Content-Security-Policy changes were required to support it.
- `app/api/webhooks/stripe/route.ts`'s `checkout.session.completed` event is the only trustworthy
  confirmation payment succeeded; the success-page redirect is never treated as proof, since that
  URL is reachable by just visiting it.
- Trades away in-app checkout styling — the customer leaves this app's visual design for Stripe's
  hosted page during payment. Accepted as the right trade for a small shop where PCI scope
  reduction matters more than checkout-page branding.
- **Revisit if:** the studio later needs a fully custom, in-app checkout experience badly enough to
  justify taking on Stripe Elements' larger PCI scope (SAQ A-EP instead of SAQ A) and the
  CSP/frontend work that comes with it.
