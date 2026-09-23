import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import type Stripe from "stripe";
import { stripe, requireStripeWebhookSecret } from "@/lib/shop/stripe";
import { findOrderByCheckoutSessionId, markOrderPaid, type Prisma } from "@/lib/shop/repository";
import { recordAudit } from "@/lib/audit/repository";
import { publishEvent } from "@/lib/events";
import { runJobWorker } from "@/lib/jobs/worker";

/**
 * The only trustworthy confirmation that money moved — a customer landing on
 * /orders/success is not proof of payment, since that URL is reachable by
 * just visiting it. Reads the raw body (never `.json()`) because signature
 * verification is computed over the exact bytes Stripe sent.
 */
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, requireStripeWebhookSecret());
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (
    event.type !== "checkout.session.completed" &&
    event.type !== "checkout.session.async_payment_succeeded"
  ) {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  // checkout.session.completed can arrive while an asynchronous payment is
  // still pending. Fulfill only after Stripe reports the session as paid.
  if (session.payment_status !== "paid") {
    return NextResponse.json({ received: true });
  }

  const order = await findOrderByCheckoutSessionId(session.id);
  if (!order) {
    // Every session we create has a matching PENDING order created just
    // before the redirect to Stripe — this should be unreachable.
    Sentry.captureMessage(`Stripe webhook: no Order found for session ${session.id}`);
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const email = session.customer_details?.email ?? session.customer_email ?? order.customerEmail;
  if (!email) {
    Sentry.captureMessage(`Stripe webhook: session ${session.id} completed with no customer email`);
    return NextResponse.json({ error: "Missing customer email" }, { status: 400 });
  }

  const shippingDetails = session.collected_information?.shipping_details;

  const result = await markOrderPaid(
    order.id,
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : (session.payment_intent?.id ?? null),
    {
      email,
      name: session.customer_details?.name ?? order.customerName ?? undefined,
      shippingAddress: shippingDetails
        ? ({
            name: shippingDetails.name,
            address: shippingDetails.address,
          } as unknown as Prisma.InputJsonValue)
        : (order.shippingAddress as Prisma.InputJsonValue | undefined),
    }
  );

  if (!result.ok) {
    if (result.reason === "oversold") {
      await recordAudit({
        action: "order.refund_needed",
        targetId: order.id,
        metadata: { productId: result.productId, stripeCheckoutSessionId: session.id },
      });
      Sentry.captureMessage(
        `Order ${order.id} oversold on product ${result.productId} — needs manual refund`
      );
    }
    // "already_processed" — Stripe retries webhooks; treat a repeat delivery
    // as success rather than an error.
    return NextResponse.json({ received: true });
  }

  await publishEvent({
    type: "order.paid",
    orderId: order.id,
    email,
    trackingToken: order.trackingToken,
    totalCents: order.totalCents,
    currency: order.currency,
  });
  await runJobWorker();

  return NextResponse.json({ received: true });
}
