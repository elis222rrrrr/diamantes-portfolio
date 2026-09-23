"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { isSlotAvailable, isWithinBookingWindow } from "@/lib/booking/slots";
import { createBookingRecord } from "@/lib/booking/repository";
import { publishEvent } from "@/lib/events";
import { runJobWorker } from "@/lib/jobs/worker";
import { checkBookingRateLimit } from "@/lib/rate-limit";

const bookingSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().toLowerCase().email().max(255),
  notes: z.string().trim().max(2000).optional(),
  start: z.string().datetime(),
});

export type BookingState = { error: string } | null;

export async function createBooking(
  _prevState: BookingState,
  formData: FormData
): Promise<BookingState> {
  const ipAddress = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  if (await checkBookingRateLimit(ipAddress)) {
    return { error: "Too many attempts. Please try again later." };
  }

  const parsed = bookingSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    notes: formData.get("notes") || undefined,
    start: formData.get("start"),
  });

  if (!parsed.success) {
    return { error: "Please check your details and try again." };
  }

  const { name, email, notes, start } = parsed.data;
  const startDate = new Date(start);

  if (!isWithinBookingWindow(startDate)) {
    return { error: "Please choose a date within the next 60 days." };
  }

  // Re-derive availability server-side — never trust a slot the client's page
  // rendered earlier, since that page could be stale.
  if (!(await isSlotAvailable(startDate))) {
    return { error: "That slot is no longer available, please pick another." };
  }

  const result = await createBookingRecord({ start: startDate, name, email, notes });
  if (!result.ok) {
    return { error: "That slot was just taken, please pick another." };
  }

  const { manageToken } = result;

  await publishEvent({
    type: "booking.created",
    email,
    name,
    start: startDate.toISOString(),
    manageToken,
  });
  after(() => runJobWorker());

  redirect(`/contact/book/manage/${manageToken}?justBooked=1`);
}
