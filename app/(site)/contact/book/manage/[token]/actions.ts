"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { isSlotAvailable, isWithinBookingWindow } from "@/lib/booking/slots";
import {
  findBookingByToken,
  deleteBookingByToken,
  rescheduleBookingRecord,
} from "@/lib/booking/repository";
import { publishEvent } from "@/lib/events";
import { runJobWorker } from "@/lib/jobs/worker";
import { checkBookingRateLimit } from "@/lib/rate-limit";

export async function cancelBooking(token: string): Promise<void> {
  await deleteBookingByToken(token);
  redirect(`/contact/book/manage/${token}?cancelled=1`);
}

const rescheduleSchema = z.object({
  token: z.string().trim().min(1),
  newStart: z.string().datetime(),
});

export type RescheduleState = { error: string } | null;

export async function rescheduleBooking(
  _prevState: RescheduleState,
  formData: FormData
): Promise<RescheduleState> {
  const ipAddress = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  if (await checkBookingRateLimit(ipAddress)) {
    return { error: "Too many attempts. Please try again later." };
  }

  const parsed = rescheduleSchema.safeParse({
    token: formData.get("token"),
    newStart: formData.get("newStart"),
  });
  if (!parsed.success) {
    return { error: "Please pick a valid time and try again." };
  }
  const { token, newStart: newStartIso } = parsed.data;

  const existing = await findBookingByToken(token);
  if (!existing) {
    return { error: "This booking could not be found, it may have already been cancelled." };
  }

  const newStart = new Date(newStartIso);
  if (!isWithinBookingWindow(newStart)) {
    return { error: "Please choose a date within the next 60 days." };
  }

  if (!(await isSlotAvailable(newStart))) {
    return { error: "That slot is no longer available, your original booking is unchanged." };
  }

  const result = await rescheduleBookingRecord(token, newStart, {
    name: existing.name,
    email: existing.email,
    notes: existing.notes,
  });
  if (!result.ok) {
    return { error: "That slot is no longer available, your original booking is unchanged." };
  }

  await publishEvent({
    type: "booking.rescheduled",
    email: existing.email,
    name: existing.name,
    start: newStart.toISOString(),
    manageToken: token,
  });
  after(() => runJobWorker());

  redirect(`/contact/book/manage/${token}?rescheduled=1`);
}
