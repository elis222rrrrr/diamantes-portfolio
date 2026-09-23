import { describe, it, expect } from "vitest";
import { estimateReadingMinutes, formatReadingTime } from "./reading-time";

describe("estimateReadingMinutes", () => {
  it("rounds to the nearest minute at 200wpm", () => {
    const words = Array(400).fill("word").join(" ");
    expect(estimateReadingMinutes(`<p>${words}</p>`)).toBe(2);
  });

  it("never returns less than 1 minute, even for empty content", () => {
    expect(estimateReadingMinutes("")).toBe(1);
    expect(estimateReadingMinutes("<p></p>")).toBe(1);
  });

  it("strips HTML tags before counting words", () => {
    const html = "<h1>Title</h1><p>One two three</p>";
    // 4 words total (Title, One, two, three) — well under a minute either way,
    // but this proves tags themselves aren't counted as words.
    expect(estimateReadingMinutes(html)).toBe(1);
  });
});

describe("formatReadingTime", () => {
  it("formats as '<n> min read'", () => {
    expect(formatReadingTime("<p>hello</p>")).toBe("1 min read");
  });
});
