/** Renders a word with a horizontal "cut" through a handful of chosen
 * letters — a --background-colored bar across just that glyph, same
 * blend-with-the-page trick as the title's earlier full-width diagonal
 * stripes, but scoped to specific letters (per feedback: not every
 * letter, and a straight horizontal cut rather than a diagonal one).
 * `squares` adds a small solid-black square centered on a letter instead —
 * a distinct accent mark, not a cut.
 *
 * Shared between the homepage Hero's "DIAMANTES"/"DESIGNS" title and
 * ContactPanel's "START A PROJECT / TODAY." heading — originally a local
 * function inside Hero.tsx, extracted here once a second caller needed it. */
export default function CutWord({
  text,
  cuts = [],
  lowCuts = [],
  smallCuts = [],
  bottomCuts = [],
  squares = [],
  lowSquares = [],
}: {
  text: string;
  cuts?: number[];
  /** Same cut as `cuts`, just a bit further down the glyph. */
  lowCuts?: number[];
  /** A thinner cut positioned higher on the glyph, for a letter that
   * shouldn't get the same mid-height treatment as the rest. */
  smallCuts?: number[];
  /** Same thin cut, positioned near the bottom instead of the top. */
  bottomCuts?: number[];
  squares?: number[];
  /** Same square as `squares`, repositioned to sit inside a `lowCuts` bar
   * instead of the default mid-height one. */
  lowSquares?: number[];
}) {
  return (
    <>
      {text.split("").map((ch, i) => (
        <span key={i} className="relative inline-block">
          {ch}
          {cuts.includes(i) && (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0"
              style={{ top: "42%", height: "16%", background: "var(--background)" }}
            />
          )}
          {lowCuts.includes(i) && (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0"
              style={{ top: "46%", height: "16%", background: "var(--background)" }}
            />
          )}
          {smallCuts.includes(i) && (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0"
              style={{ top: "20%", height: "8%", background: "var(--background)" }}
            />
          )}
          {bottomCuts.includes(i) && (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0"
              style={{ top: "74%", height: "8%", background: "var(--background)" }}
            />
          )}
          {/* Sits inside the cut bar's own gap (top: 42-58%), not
              centered on the letter — a solid-black square on top of an
              already-solid-black glyph would just be invisible.
              bg-[#000] (literal), not bg-black: this site's bg-black is a
              semantic theme token (resolves to WHITE under the current
              light theme, since it inverts alongside text-white/border-
              white everywhere else) — the exact bug already hit twice
              before on this site, silently rendering this invisible. */}
          {squares.includes(i) && (
            <span
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#000000]"
              style={{ width: "16%", height: "16%" }}
            />
          )}
          {lowSquares.includes(i) && (
            <span
              aria-hidden
              className="pointer-events-none absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#000000]"
              style={{ top: "54%", width: "60%", height: "16%" }}
            />
          )}
        </span>
      ))}
    </>
  );
}
