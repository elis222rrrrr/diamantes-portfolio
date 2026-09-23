import { describe, it, expect } from "vitest";
import { slugify } from "./slugify";

describe("slugify", () => {
  it("lowercases and hyphenates spaces", () => {
    expect(slugify("Studio Updates")).toBe("studio-updates");
  });

  it("strips accents", () => {
    expect(slugify("Café Launch")).toBe("cafe-launch");
  });

  it("collapses non-alphanumeric runs into a single hyphen", () => {
    expect(slugify("Hello, World!!  Really?")).toBe("hello-world-really");
  });

  it("trims leading/trailing hyphens", () => {
    expect(slugify("  -Leading and trailing-  ")).toBe("leading-and-trailing");
  });
});
