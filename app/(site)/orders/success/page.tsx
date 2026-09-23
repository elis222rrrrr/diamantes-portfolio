import { notFound, redirect } from "next/navigation";
import { findOrderByCheckoutSessionId } from "@/lib/shop/repository";
import { buildMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Order confirmation",
  description: "Confirming your order.",
  path: "/orders/success",
  noIndex: true,
});

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;
  if (!sessionId) notFound();

  const order = await findOrderByCheckoutSessionId(sessionId);
  if (!order) notFound();

  // The webhook — not this redirect — is what confirms payment; this page
  // just hands off to the token-gated tracking page a customer can safely
  // bookmark, whatever the order's status turns out to be by the time it
  // (or the webhook) is checked.
  redirect(`/orders/track/${order.trackingToken}?justPaid=1`);
}
