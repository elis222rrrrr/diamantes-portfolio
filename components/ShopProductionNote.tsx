import { Printer, Sparkles, ScanSearch, PackageOpen } from "lucide-react";

// The whole "ZERO WASTE" callout — flag, diagonal lead-out, hatch mark,
// ring, and terminal crosshair — as ONE svg instead of separate pieces
// stitched together with CSS. Every earlier attempt to align a big flag
// SVG against separately-scaled flex/CSS elements (a plain line, a small
// crosshair SVG with its own box) kept landing a few pixels off, because
// each piece scaled independently. Baking everything into one wide,
// uniformly-scaled viewBox (w-full h-auto — width fills the container,
// height derives from the same aspect ratio, so nothing distorts) means
// every coordinate is fixed relative to every other one, by construction —
// there's no cross-element alignment left to get wrong. The one accepted
// trade-off: at very wide viewports the crosshair sits at a fixed fraction
// of the container width rather than pinned to its literal right edge.
function ZeroWasteGraphic() {
  return (
    <svg
      viewBox="0 0 1200 120"
      className="h-24 w-full sm:h-28"
      style={{ color: "var(--eco-accent)" }}
      aria-hidden="true"
    >
      {/* Flag */}
      <path d="M14 10 H230 L262 40 L230 70 H14 Q0 70 0 56 V24 Q0 10 14 10 Z" fill="currentColor" />
      <text
        x="26"
        y="47"
        fill="#ffffff"
        fontSize="20"
        fontWeight="800"
        letterSpacing="0.04em"
        fontFamily="var(--font-mono), monospace"
      >
        ZERO WASTE
      </text>

      {/* Diagonal lead-out from the tip, continuing right (not doubling
          back left), then the line resuming after the text gap. */}
      <path
        d="M262 40 L330 105 H440 M760 105 H1145"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />

      {/* Hatch mark, sitting on the line */}
      <path
        d="M358 113 L368 97 M370 113 L380 97 M382 113 L392 97"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />

      {/* Ring, sitting on the line */}
      <circle cx="415" cy="105" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />

      {/* Terminal crosshair/target reticle */}
      <line x1="1160" y1="93" x2="1160" y2="117" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M1144 99 h-6 v6 M1176 99 h6 v6 M1144 111 h-6 v-6 M1176 111 h6 v-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <rect x="1156" y="101" width="8" height="8" fill="currentColor" />
    </svg>
  );
}

const STEPS = [
  { n: "01", label: "BUILD", title: "3D PRINTING", days: "5-7 DAYS", Icon: Printer },
  { n: "02", label: "FINISH", title: "SURFACE FINISHING", days: "5-7 DAYS", Icon: Sparkles },
  { n: "03", label: "CHECK", title: "QUALITY CONTROL", days: "3-4 DAYS", Icon: ScanSearch },
  { n: "04", label: "COMPLETE", title: "PACK + DISPATCH", days: "7 DAYS", Icon: PackageOpen },
];

// No borders/boxes — steps just sit in open space, all on the same row.
export default function ShopProductionNote() {
  return (
    <div className="mt-16">
      {/* Bleeds past .section-container's own side padding (1.5rem, 3rem
          at lg — see globals.css) so the graphic reaches wider than the
          rest of the page's content column on both sides. */}
      <div className="relative -mx-6 lg:-mx-12">
        <ZeroWasteGraphic />
        {/* Real HTML text over the svg, not baked into it — keeps it
            selectable/readable for screen readers (the svg itself is
            aria-hidden). Positioned by the same percentages as the
            matching coordinates inside ZeroWasteGraphic's 1200×120
            viewBox, so it lines up with the gap left in the drawn line.
            That gap is a fixed ~23% of the container's width, which only
            fits this whole nowrap caption once the container itself is
            wide enough (roughly lg+) — below that it has nowhere to go
            and runs off the right edge, so it's hidden on narrower
            screens rather than clipped/overflowing. */}
        <p
          className="absolute hidden whitespace-nowrap px-1 font-mono text-xs text-muted lg:block"
          style={{ left: "40%", top: "87.5%", transform: "translateY(-50%)" }}
        >
          MADE TO ORDER / ONLY WHAT IS NEEDED
        </p>
      </div>
      <div className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step) => (
          <div key={step.n}>
            <p className="tracked-label text-muted">
              {step.n} / {step.label}
            </p>
            <div className="mt-4 mb-2 text-white/70">
              <step.Icon size={28} strokeWidth={1.25} />
            </div>
            <p className="mt-2 font-mono text-sm font-semibold text-white">{step.title}</p>
            <p className="mt-1 font-mono text-[11px] text-white/45">{step.days}</p>
          </div>
        ))}
      </div>
      <p className="mt-8 text-right font-mono text-sm font-semibold text-white">
        TOTAL: 20-25 DAYS
      </p>
    </div>
  );
}
