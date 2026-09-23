"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { findOrderByTrackingToken } from "@/lib/shop/repository";

export type TrackOrderState = { error: string } | null;

const trackingSchema = z.object({
  code: z.string().trim().min(1).max(100),
});

export async function trackOrder(
  _prevState: TrackOrderState,
  formData: FormData
): Promise<TrackOrderState> {
  const parsed = trackingSchema.safeParse({ code: formData.get("code") });
  if (!parsed.success) return { error: "Enter your order code." };

  const order = await findOrderByTrackingToken(parsed.data.code);
  if (!order) return { error: "We could not find an order with that code." };

  redirect(`/orders/track/${order.trackingToken}`);
}
