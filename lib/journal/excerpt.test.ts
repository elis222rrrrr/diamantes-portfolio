import { describe, it, expect } from "vitest";
import { getExcerpt } from "./excerpt";

describe("getExcerpt", () => {
  it("prefers a manual excerpt when set", () => {
    expect(getExcerpt("<p>Ignored body</p>", "Manual excerpt")).toBe("Manual excerpt");
  });

  it("falls back to stripped, truncated content when no manual excerpt is set", () => {
    const result = getExcerpt("<h1>Title</h1><p>Some plain body text.</p>", null);
    expect(result).toBe("Title Some plain body text.");
  });

  it("truncates long content at a word boundary with an ellipsis", () => {
    const longText = Array(50).fill("word").join(" ");
    const result = getExcerpt(`<p>${longText}</p>`, undefined);
    expect(result.length).toBeLessThanOrEqual(161); // 160 + the ellipsis char
    expect(result.endsWith("…")).toBe(true);
    expect(result).not.toContain("  ");
  });

  it("treats an empty-string manual excerpt as unset", () => {
    const result = getExcerpt("<p>Fallback text</p>", "   ");
    expect(result).toBe("Fallback text");
  });
});
