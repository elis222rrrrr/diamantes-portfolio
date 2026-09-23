import "server-only";

import { fromZonedTime, toZonedTime, formatInTimeZone } from "date-fns-tz";
import { prisma } from "@/lib/prisma";

export const TIME_ZONE = "Europe/Athens";
export const SLOT_MINUTES = 30;
// After an existing booking, the next slots stay hidden until this much time
// has passed — a business decision (prep/travel time between calls), not a
// technical limit. The first slot shown after a booking is exactly this far
// later, if it's otherwise open.
export const BOOKING_BUFFER_MINUTES = 4 * 60;
// How far ahead the date picker (new booking + reschedule) lets someone pick
// a day — a business decision (how far out the studio is comfortable
// scheduling), not a technical limit.
export const BOOKING_WINDOW_DAYS = 60;
// The date picker shows one week at a time (arrows move between weeks)
// rather than a flat list of BOOKING_WINDOW_DAYS buttons.
export const MAX_BOOKING_WEEK = Math.ceil(BOOKING_WINDOW_DAYS / 7) - 1;

export function isWithinBookingWindow(instant: Date): boolean {
  const today = getAthensToday();
  const windowEnd = athensToUtc(addDays(today, BOOKING_WINDOW_DAYS), 0);
  return instant.getTime() < windowEnd.getTime();
}

/** Short "D/M" button label for a calendar date (e.g. "21/7"). */
export function formatDayLabel(date: DateParts): string {
  return `${date.day}/${date.month}`;
}

/** Clamps a week offset (from the `week` search param) into the bookable window. */
export function clampBookingWeek(week: number): number {
  if (!Number.isFinite(week)) return 0;
  return Math.min(Math.max(Math.trunc(week), 0), MAX_BOOKING_WEEK);
}

export type DateParts = { year: number; month: number; day: number }; // month is 1-12

/** Converts an Athens wall-clock date + minutes-since-midnight into the equivalent UTC instant. */
export function athensToUtc(date: DateParts, minutesSinceMidnight: number): Date {
  const hours = Math.floor(minutesSinceMidnight / 60);
  const minutes = minutesSinceMidnight % 60;
  const wallClock = new Date(date.year, date.month - 1, date.day, hours, minutes, 0, 0);
  return fromZonedTime(wallClock, TIME_ZONE);
}

/**
 * Formats a UTC instant as an Athens-local "HH:mm" string, for display only.
 * Uses `formatInTimeZone` (not `toZonedTime` + a native formatter) deliberately —
 * `toZonedTime`'s output is only safe to read via date-fns's own plain-getter-based
 * `format`, not `Intl`-based methods like `toLocaleTimeString`, which resolve the
 * timezone independently and would silently double up depending on the server's TZ.
 */
export function formatAthensTime(instant: Date): string {
  return formatInTimeZone(instant, TIME_ZONE, "HH:mm");
}

/** Formats a UTC instant as an Athens-local "EEE d MMM" date string, for display only. */
export function formatAthensDate(instant: Date): string {
  return formatInTimeZone(instant, TIME_ZONE, "EEE d MMM");
}

/** Today's date, expressed in Athens-local terms (not the server's own timezone). */
export function getAthensToday(): DateParts {
  const zoned = toZonedTime(new Date(), TIME_ZONE);
  return { year: zoned.getFullYear(), month: zoned.getMonth() + 1, day: zoned.getDate() };
}

/** Formats DateParts as a "YYYY-MM-DD" string, for use in URL search params. */
export function toDateParam(date: DateParts): string {
  return `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
}

/** Parses a "YYYY-MM-DD" search param into DateParts, falling back to today (Athens) if absent/invalid. */
export function parseDateParam(value: string | undefined): DateParts {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return { year, month, day };
  }
  return getAthensToday();
}

/** Adds `n` days to an Athens calendar date. */
export function addDays(date: DateParts, n: number): DateParts {
  const d = new Date(Date.UTC(date.year, date.month - 1, date.day + n));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

function dayOfWeekFor(date: DateParts): number {
  // Day-of-week is timezone-independent once you already have the calendar date.
  return new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay();
}

function rangesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/** True once `instantMs` falls strictly between a booking and
 * `BOOKING_BUFFER_MINUTES` after it — exactly `BOOKING_BUFFER_MINUTES` later
 * is allowed, so "the first availability" lands exactly on the buffer
 * boundary rather than one slot past it. */
export function isWithinBookingBuffer(instantMs: number, bookedInstantsMs: number[]): boolean {
  const bufferMs = BOOKING_BUFFER_MINUTES * 60_000;
  return bookedInstantsMs.some(
    (bookedMs) => instantMs > bookedMs && instantMs < bookedMs + bufferMs
  );
}

/** Returns the list of open 30-minute slot start times (UTC instants) for a given Athens calendar date. */
export async function getAvailableSlots(date: DateParts): Promise<Date[]> {
  const dayOfWeek = dayOfWeekFor(date);

  const [rules, blocks, dayStartUtc, dayEndUtc] = await Promise.all([
    prisma.availabilityRule.findMany({ where: { dayOfWeek } }),
    prisma.blockedDate.findMany({
      where: { date: new Date(Date.UTC(date.year, date.month - 1, date.day)) },
    }),
    Promise.resolve(athensToUtc(date, 0)),
    Promise.resolve(athensToUtc(date, 24 * 60)),
  ]);

  if (blocks.some((b) => b.startMinute === null && b.endMinute === null)) {
    return []; // whole day blocked
  }

  // Looks back far enough to catch a booking from the tail end of the
  // previous calendar day whose buffer still bleeds into this one (e.g. a
  // 23:30 booking blocking this day's first couple of hours).
  const bufferLookbackStart = new Date(dayStartUtc.getTime() - BOOKING_BUFFER_MINUTES * 60_000);
  const existingBookings = await prisma.booking.findMany({
    where: { start: { gte: bufferLookbackStart, lt: dayEndUtc } },
    select: { start: true },
  });
  const bookedInstants = new Set(existingBookings.map((b) => b.start.getTime()));
  const bookedInstantsMs = existingBookings.map((b) => b.start.getTime());

  const candidateMinutes = new Set<number>();
  for (const rule of rules) {
    for (let m = rule.startMinute; m + SLOT_MINUTES <= rule.endMinute; m += SLOT_MINUTES) {
      candidateMinutes.add(m);
    }
  }

  const openMinutes = [...candidateMinutes].filter((minute) => {
    const slotEnd = minute + SLOT_MINUTES;

    const blocked = blocks.some((b) => {
      if (b.startMinute === null || b.endMinute === null) return false; // handled above
      return rangesOverlap(minute, slotEnd, b.startMinute, b.endMinute);
    });
    if (blocked) return false;

    const instant = athensToUtc(date, minute);
    const instantMs = instant.getTime();
    if (bookedInstants.has(instantMs)) return false;
    return !isWithinBookingBuffer(instantMs, bookedInstantsMs);
  });

  const now = Date.now();
  return openMinutes
    .sort((a, b) => a - b)
    .map((minute) => athensToUtc(date, minute))
    .filter((instant) => instant.getTime() > now);
}

export async function isSlotAvailable(instant: Date): Promise<boolean> {
  const zoned = toZonedTime(instant, TIME_ZONE);
  const date: DateParts = {
    year: zoned.getFullYear(),
    month: zoned.getMonth() + 1,
    day: zoned.getDate(),
  };
  const slots = await getAvailableSlots(date);
  return slots.some((s) => s.getTime() === instant.getTime());
}
