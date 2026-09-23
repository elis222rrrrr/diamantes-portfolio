import { notFound } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { findOrderById } from "@/lib/shop/repository";
import { formatPriceCents } from "@/lib/shop/format";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import Card from "@/components/ui/Card";
import MarkShippedForm from "./MarkShippedForm";
import { markShippedAction, cancelOrderAction } from "../actions";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["OWNER", "ADMIN"]);
  const { id } = await params;

  const order = await findOrderById(id);
  if (!order) notFound();

  const canCancel = order.status === "PENDING";
  const canShip = order.status === "PAID";
  const shipping = order.shippingAddress as {
    name?: string;
    address?: Record<string, string> | string;
    city?: string;
    postalCode?: string;
    country?: string;
  } | null;
  const stripeAddress =
    shipping?.address && typeof shipping.address !== "string" ? shipping.address : null;
  const addressLines =
    typeof shipping?.address === "string"
      ? [shipping.address, shipping.city, shipping.postalCode, shipping.country]
      : [
          stripeAddress?.line1,
          stripeAddress?.line2,
          stripeAddress?.city,
          stripeAddress?.postal_code,
          stripeAddress?.country,
        ];

  return (
    <div className="max-w-2xl">
      <h1 className="mb-2 text-2xl font-light">Order {order.id}</h1>
      <p className="mb-8 text-sm text-muted">Placed {new Date(order.createdAt).toLocaleString()}</p>

      {order.status === "REFUND_NEEDED" && (
        <div className="mb-8 flex items-start gap-3 border border-yellow-500/30 bg-yellow-500/5 p-4">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-yellow-500" />
          <p className="text-sm text-yellow-200">
            Payment was received but at least one item couldn&apos;t be fulfilled (oversold). Issue
            a refund via the Stripe dashboard and follow up with the customer.
          </p>
        </div>
      )}

      <Card className="mb-8">
        <p className="text-sm">{order.customerEmail ?? "No customer email yet"}</p>
        {order.customerName && <p className="mt-1 text-sm text-white/70">{order.customerName}</p>}
        {addressLines.some(Boolean) && (
          <p className="mt-2 text-xs text-muted">{addressLines.filter(Boolean).join(", ")}</p>
        )}
      </Card>

      <div className="mb-8 border border-white/10">
        <ul className="flex flex-col divide-y divide-white/10">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm">
                  {item.product.name}
                  {item.variant && <span className="text-white/60"> — {item.variant.color}</span>}
                </p>
                <p className="mt-1 text-xs text-muted">Qty {item.quantity}</p>
              </div>
              <span className="text-sm">
                {formatPriceCents(item.unitPriceCents * item.quantity, order.currency)}
              </span>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between border-t border-white/10 px-4 py-3">
          <span className="tracked-label text-muted">Total</span>
          <span className="text-sm">{formatPriceCents(order.totalCents, order.currency)}</span>
        </div>
      </div>

      {order.status === "FULFILLED" && order.trackingNumber && (
        <p className="mb-8 text-sm text-muted">
          Shipped — tracking number <span className="text-white">{order.trackingNumber}</span>
        </p>
      )}

      <div className="flex flex-col gap-6 sm:flex-row">
        {canShip && <MarkShippedForm action={markShippedAction.bind(null, order.id)} />}

        {canCancel && (
          <ConfirmSubmitButton
            action={cancelOrderAction.bind(null, order.id)}
            triggerLabel="Cancel order"
            triggerClassName="focus-ring tracked-label h-fit border border-white/15 px-4 py-2 text-white/70 transition hover:border-white/40 hover:text-white"
            title="Cancel this order?"
            message="This marks the order as cancelled. It does not automatically issue a Stripe refund — do that separately in the Stripe dashboard if payment was captured."
            confirmLabel="Cancel order"
          />
        )}
      </div>
    </div>
  );
}
