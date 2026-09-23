import { describe, it, expect } from "vitest";
import {
  athensToUtc,
  clampBookingWeek,
  toDateParam,
  parseDateParam,
  addDays,
  formatDayLabel,
  isWithinBookingBuffer,
  MAX_BOOKING_WEEK,
  BOOKING_BUFFER_MINUTES,
} from "./slots";

describe("athensToUtc", () => {
  it("applies EET (UTC+2) in winter", () => {
    // 10:00 Athens-local on a January date, no DST in effect.
    const instant = athensToUtc({ year: 2026, month: 1, day: 15 }, 10 * 60);
    expect(instant.toISOString()).toBe("2026-01-15T08:00:00.000Z");
  });

  it("applies EEST (UTC+3) in summer", () => {
    // Same wall-clock time, but in July DST is in effect — proves this isn't
    // a hardcoded offset; it has to actually resolve DST for the given date.
    const instant = athensToUtc({ year: 2026, month: 7, day: 15 }, 10 * 60);
    expect(instant.toISOString()).toBe("2026-07-15T07:00:00.000Z");
  });
});

describe("clampBookingWeek", () => {
  it("clamps negative values to 0", () => {
    expect(clampBookingWeek(-5)).toBe(0);
  });

  it("clamps values beyond the booking window to MAX_BOOKING_WEEK", () => {
    expect(clampBookingWeek(999)).toBe(MAX_BOOKING_WEEK);
  });

  it("truncates a fractional week to a whole number", () => {
    expect(clampBookingWeek(2.9)).toBe(2);
  });

  it("falls back to 0 for a non-finite input", () => {
    expect(clampBookingWeek(NaN)).toBe(0);
    expect(clampBookingWeek(Infinity)).toBe(0);
  });
});

describe("toDateParam / parseDateParam", () => {
  it("round-trips a date through the URL param format", () => {
    const date = { year: 2026, month: 3, day: 5 };
    expect(parseDateParam(toDateParam(date))).toEqual(date);
  });

  it("zero-pads single-digit month/day", () => {
    expect(toDateParam({ year: 2026, month: 1, day: 9 })).toBe("2026-01-09");
  });

  it("falls back to today (Athens) for a missing or malformed param", () => {
    const today = parseDateParam(undefined);
    expect(parseDateParam("not-a-date")).toEqual(today);
  });
});

describe("addDays", () => {
  it("rolls over a month boundary", () => {
    expect(addDays({ year: 2026, month: 1, day: 30 }, 3)).toEqual({
      year: 2026,
      month: 2,
      day: 2,
    });
  });

  it("rolls over a year boundary", () => {
    expect(addDays({ year: 2025, month: 12, day: 30 }, 5)).toEqual({
      year: 2026,
      month: 1,
      day: 4,
    });
  });
});

describe("formatDayLabel", () => {
  it("formats as D/M", () => {
    expect(formatDayLabel({ year: 2026, month: 7, day: 21 })).toBe("21/7");
  });
});

describe("isWithinBookingBuffer", () => {
  const bookingStart = Date.UTC(2026, 6, 21, 14, 0); // 14:00
  const bufferMs = BOOKING_BUFFER_MINUTES * 60_000; // 4 hours

  it("blocks a slot shortly after an existing booking", () => {
    const thirtyMinLater = bookingStart + 30 * 60_000;
    expect(isWithinBookingBuffer(thirtyMinLater, [bookingStart])).toBe(true);
  });

  it("allows the slot exactly at the buffer boundary (4 hours later)", () => {
    expect(isWithinBookingBuffer(bookingStart + bufferMs, [bookingStart])).toBe(false);
  });

  it("allows a slot before the booking", () => {
    const thirtyMinBefore = bookingStart - 30 * 60_000;
    expect(isWithinBookingBuffer(thirtyMinBefore, [bookingStart])).toBe(false);
  });

  it("allows the booking's own instant (handled separately, not as a buffer case)", () => {
    expect(isWithinBookingBuffer(bookingStart, [bookingStart])).toBe(false);
  });

  it("checks against every existing booking, not just the first", () => {
    const earlierBooking = bookingStart - 6 * 60 * 60_000; // well clear of its own buffer
    const withinLaterBookingsBuffer = bookingStart + 60 * 60_000; // 1h after the 14:00 booking
    expect(isWithinBookingBuffer(withinLaterBookingsBuffer, [earlierBooking, bookingStart])).toBe(
      true
    );
  });
});
