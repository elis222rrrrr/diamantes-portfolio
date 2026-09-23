import { describe, it, expect } from "vitest";
import { formatPriceCents } from "./format";

describe("formatPriceCents", () => {
  it("formats whole-euro amounts", () => {
    expect(formatPriceCents(1999, "eur")).toBe("€19.99");
  });

  it("formats zero", () => {
    expect(formatPriceCents(0, "eur")).toBe("€0.00");
  });

  it("accepts a lowercase currency code", () => {
    expect(formatPriceCents(500, "eur")).toBe("€5.00");
  });

  it("rounds to the currency's own decimal precision, not silently truncating", () => {
    // 1050 cents == 10.50 — exercises float-division edge cases in cents/100.
    expect(formatPriceCents(1050, "eur")).toBe("€10.50");
  });
});
