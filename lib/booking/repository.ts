import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const SLOT_MINUTES = 30;

function isSlotTakenError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

// --- Bookings ---

export type CreateBookingInput = {
  start: Date;
  name: string;
  email: string;
  notes?: string;
};

export type BookingResult = { ok: true; manageToken: string } | { ok: false; reason: "slot_taken" };

/** Translates the DB's unique-constraint race (the actual double-booking guard) into a domain-shaped result. */
export async function createBookingRecord(input: CreateBookingInput): Promise<BookingResult> {
  try {
    const booking = await prisma.booking.create({
      data: {
        start: input.start,
        end: new Date(input.start.getTime() + SLOT_MINUTES * 60000),
        name: input.name,
        email: input.email,
        notes: input.notes,
      },
    });
    return { ok: true, manageToken: booking.manageToken };
  } catch (error) {
    if (isSlotTakenError(error)) return { ok: false, reason: "slot_taken" };
    throw error;
  }
}

export function findBookingByToken(token: string) {
  return prisma.booking.findUnique({ where: { manageToken: token } });
}

export async function deleteBookingByToken(token: string): Promise<void> {
  await prisma.booking.deleteMany({ where: { manageToken: token } });
}

export async function cancelBookingById(id: string): Promise<void> {
  await prisma.booking.delete({ where: { id } });
}

export type RescheduleResult = { ok: true } | { ok: false; reason: "slot_taken" };

/** Delete-old + create-new in one transaction, preserving the same manageToken. */
export async function rescheduleBookingRecord(
  token: string,
  newStart: Date,
  details: { name: string; email: string; notes: string | null }
): Promise<RescheduleResult> {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.booking.delete({ where: { manageToken: token } });
      await tx.booking.create({
        data: {
          start: newStart,
          end: new Date(newStart.getTime() + SLOT_MINUTES * 60000),
          name: details.name,
          email: details.email,
          notes: details.notes,
          manageToken: token,
        },
      });
    });
    return { ok: true };
  } catch (error) {
    if (isSlotTakenError(error)) return { ok: false, reason: "slot_taken" };
    throw error;
  }
}

export function listUpcomingBookings() {
  return prisma.booking.findMany({
    where: { start: { gte: new Date() } },
    orderBy: { start: "asc" },
  });
}

// --- Availability rules ---

export function listAvailabilityRules() {
  return prisma.availabilityRule.findMany({
    orderBy: [{ dayOfWeek: "asc" }, { startMinute: "asc" }],
  });
}

export function createAvailabilityRuleRecord(data: {
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
}) {
  return prisma.availabilityRule.create({ data });
}

export async function deleteAvailabilityRuleRecord(id: string): Promise<void> {
  await prisma.availabilityRule.delete({ where: { id } });
}

// --- Blocked dates ---

export function listBlockedDates() {
  return prisma.blockedDate.findMany({ orderBy: { date: "asc" } });
}

export function createBlockedDateRecord(data: {
  date: Date;
  startMinute: number | null;
  endMinute: number | null;
  reason: string | null;
}) {
  return prisma.blockedDate.create({ data });
}

export async function deleteBlockedDateRecord(id: string): Promise<void> {
  await prisma.blockedDate.delete({ where: { id } });
}
