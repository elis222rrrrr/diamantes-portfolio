import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { listOrders } from "@/lib/shop/repository";
import { formatPriceCents } from "@/lib/shop/format";
import Card from "@/components/ui/Card";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending",
  PAID: "Paid",
  FULFILLED: "Shipped",
  CANCELLED: "Cancelled",
  REFUND_NEEDED: "Refund needed",
};

export default async function OrdersPage() {
  await requireRole(["OWNER", "ADMIN"]);

  const orders = await listOrders();
  const needsAttention = orders.filter((o) => o.status === "REFUND_NEEDED");

  return (
    <div className="max-w-4xl">
      <h1 className="mb-2 text-2xl font-light">Orders</h1>
      <p className="mb-10 text-sm text-muted">Most recent first.</p>

      {needsAttention.length > 0 && (
        <div className="mb-8 flex items-start gap-3 border border-yellow-500/30 bg-yellow-500/5 p-4">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-yellow-500" />
          <p className="text-sm text-yellow-200">
            {needsAttention.length} order{needsAttention.length === 1 ? "" : "s"} need
            {needsAttention.length === 1 ? "s" : ""} manual attention — payment was received but a
            line item couldn&apos;t be fulfilled.
          </p>
        </div>
      )}

      {orders.length === 0 ? (
        <p className="text-sm text-muted">No orders yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {orders.map((order) => (
            <Card as="li" key={order.id}>
              <Link href={`/admin/orders/${order.id}`} className="focus-ring block">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm">
                      {order.customerEmail ?? "—"}{" "}
                      <span
                        className={`tracked-label ml-2 ${
                          order.status === "REFUND_NEEDED" ? "text-yellow-400" : "text-muted"
                        }`}
                      >
                        {STATUS_LABEL[order.status]}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {order.items.length} item{order.items.length === 1 ? "" : "s"} ·{" "}
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-sm">
                    {formatPriceCents(order.totalCents, order.currency)}
                  </span>
                </div>
              </Link>
            </Card>
          ))}
        </ul>
      )}
    </div>
  );
}
