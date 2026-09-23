import { describe, it, expect } from "vitest";
import { safeJsonLd } from "./json-ld";

describe("safeJsonLd", () => {
  it("escapes < so a </script> in embedded data can't close the surrounding script tag", () => {
    const payload = { description: "a description with </script><script>alert(1)</script>" };
    const output = safeJsonLd(payload);

    expect(output).not.toContain("</script>");
    expect(output).toContain("\\u003c/script");
  });

  it("round-trips to the original data once parsed back", () => {
    const payload = { title: "Diamantes 3Designs", tags: ["<b>", "normal"] };
    expect(JSON.parse(safeJsonLd(payload))).toEqual(payload);
  });

  it("is a no-op for data with no < at all", () => {
    const payload = { a: 1, b: "plain text" };
    expect(safeJsonLd(payload)).toBe(JSON.stringify(payload));
  });
});
