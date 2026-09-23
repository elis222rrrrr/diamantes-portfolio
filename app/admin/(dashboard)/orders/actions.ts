"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireRoleForAction } from "@/lib/auth/session";
import { markOrderShipped, markOrderCancelled } from "@/lib/shop/repository";
import { findOrderById } from "@/lib/shop/repository";
import { recordAudit } from "@/lib/audit/repository";
import { publishEvent } from "@/lib/events";
import { after } from "next/server";
import { runJobWorker } from "@/lib/jobs/worker";

const MANAGE_ROLES = ["OWNER", "ADMIN"] as const;

const trackingSchema = z.object({
  trackingNumber: z.string().trim().min(1).max(200),
});

export type ActionState = { error: string } | null;

export async function markShippedAction(
  orderId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireRoleForAction([...MANAGE_ROLES]);

  const parsed = trackingSchema.safeParse({ trackingNumber: formData.get("trackingNumber") });
  if (!parsed.success) {
    return { error: "Please enter a tracking number." };
  }

  const shipped = await markOrderShipped(orderId, parsed.data.trackingNumber);
  if (!shipped) {
    return { error: "Only paid orders can be marked as shipped." };
  }
  const order = await findOrderById(orderId);
  if (order?.customerEmail) {
    await publishEvent({
      type: "order.status.changed",
      email: order.customerEmail,
      trackingToken: order.trackingToken,
      status: "FULFILLED",
      trackingNumber: parsed.data.trackingNumber,
    });
    after(() => runJobWorker());
  }
  await recordAudit({
    actorId: user.id,
    action: "order.shipped",
    targetId: orderId,
    metadata: { trackingNumber: parsed.data.trackingNumber },
  });
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  return null;
}

export async function cancelOrderAction(orderId: string): Promise<void> {
  const user = await requireRoleForAction([...MANAGE_ROLES]);
  const cancelled = await markOrderCancelled(orderId);
  if (!cancelled) return;
  const order = await findOrderById(orderId);
  if (order?.customerEmail) {
    await publishEvent({
      type: "order.status.changed",
      email: order.customerEmail,
      trackingToken: order.trackingToken,
      status: "CANCELLED",
    });
    after(() => runJobWorker());
  }
  await recordAudit({ actorId: user.id, action: "order.cancelled_by_admin", targetId: orderId });
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
}
