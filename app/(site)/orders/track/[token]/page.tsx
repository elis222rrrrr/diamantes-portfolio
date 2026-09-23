import { notFound } from "next/navigation";
import { CheckCircle2, Clock, Package, AlertTriangle, XCircle } from "lucide-react";
import { findOrderByTrackingToken } from "@/lib/shop/repository";
import { formatPriceCents } from "@/lib/shop/format";
import { buildMetadata } from "@/lib/seo/metadata";
import ClearCartOnPaid from "@/components/ClearCartOnPaid";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Track Your Order",
  description: "Track the status of your Diamantes 3Designs order.",
  path: "/orders/track",
  noIndex: true,
});

const STATUS_COPY = {
  PENDING: {
    icon: Clock,
    label: "Awaiting payment confirmation",
    detail: "We're confirming your payment. This page updates automatically once it's done.",
  },
  PAID: {
    icon: CheckCircle2,
    label: "Payment confirmed",
    detail: "Your order is confirmed and being prepared.",
  },
  FULFILLED: {
    icon: Package,
    label: "Shipped",
    detail: "Your order is on its way.",
  },
  CANCELLED: {
    icon: XCircle,
    label: "Cancelled",
    detail: "This order was cancelled.",
  },
  REFUND_NEEDED: {
    icon: AlertTriangle,
    label: "Payment received, fulfillment issue",
    detail:
      "Your payment went through, but we ran into a stock issue fulfilling one of the items. We'll be in touch shortly about a refund or replacement.",
  },
} as const;

export default async function TrackOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ justPaid?: string }>;
}) {
  const { token } = await params;
  const { justPaid } = await searchParams;

  const order = await findOrderByTrackingToken(token);
  if (!order) notFound();

  const status = STATUS_COPY[order.status];
  const StatusIcon = status.icon;

  return (
    <section className="flex flex-1 flex-col px-6 py-24 text-white">
      {justPaid && <ClearCartOnPaid />}
      <div className="mx-auto w-full max-w-2xl">
        <p className="tracked-label mb-3 text-muted">Order tracking</p>
        <div className="mb-3 h-px w-6" style={{ backgroundColor: "var(--focus-ring)" }} />
        <h1 className="mb-3 text-2xl font-light">Thank you for your order</h1>
        <p className="mb-8 break-all font-mono text-xs text-muted">
          Order code: <span className="text-white">{order.trackingToken}</span>
        </p>
        <div className="mb-4 flex items-center gap-3">
          <StatusIcon size={22} className="text-white/70" />
          <h2 className="text-lg font-light">{status.label}</h2>
        </div>
        <p className="mb-10 text-sm leading-relaxed text-muted">{status.detail}</p>

        <div className="mb-10 border border-white/10">
          <ul className="flex flex-col divide-y divide-white/10">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-sm">
                    {item.product.name}
                    {item.variant && <span className="text-white/60"> ({item.variant.color})</span>}
                  </p>
                  <p className="mt-1 text-xs text-muted">Qty {item.quantity}</p>
                </div>
                <span className="text-sm">
                  {formatPriceCents(item.unitPriceCents * item.quantity, order.currency)}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between border-t border-white/10 px-5 py-4">
            <span className="tracked-label text-muted">Total</span>
            <span className="text-sm">{formatPriceCents(order.totalCents, order.currency)}</span>
          </div>
        </div>

        {order.status === "FULFILLED" && order.trackingNumber && (
          <p className="text-sm text-muted">
            Tracking number: <span className="text-white">{order.trackingNumber}</span>
          </p>
        )}

        {order.customerEmail && (
          <p className="mt-2 text-xs text-muted">
            Order confirmation sent to {order.customerEmail}
          </p>
        )}
      </div>
    </section>
  );
}
