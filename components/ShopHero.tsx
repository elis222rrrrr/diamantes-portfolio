"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatClock(d: Date) {
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}:${pad(d.getSeconds())}`;
}

/** A "system readout" ticking clock — genuinely live, not a static prop.
 * Renders a placeholder until mount (server has no client clock) to avoid a
 * hydration mismatch. */
function useLiveClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    // Same fix as Hero.tsx's identical hook — see that file's comment.
    const initial = setTimeout(() => setNow(new Date()), 0);
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => {
      clearTimeout(initial);
      clearInterval(id);
    };
  }, []);
  return now;
}

type Props = {
  objectCount: number;
  lastUpdate: Date;
};

/** The Shop page's hero — a "system archive" terminal readout. Site nav
 * above this is untouched; bg-black/text-white below follow the site's own
 * light/dark toggle like the rest of the page. Blue accents throughout
 * reuse --focus-ring, the one non-grayscale color already in this site's
 * palette, rather than introducing a new one.
 *
 * Kept deliberately compact — every gap here is intentionally tight
 * (tighter than default Tailwind spacing would suggest) so the text
 * column wraps up quickly and the section ends well before the product
 * grid, rather than the generous whitespace a normal hero would use. The
 * orbital arcs are sized as a % of the object's own "stage" box and live
 * inside it, not the outer hero wrapper — an earlier pass sized them
 * against the whole hero, which decoupled them from the object the moment
 * it got a negative margin to bleed past its grid column, so they stopped
 * visually orbiting it at all. */
export default function ShopHero({ objectCount, lastUpdate }: Props) {
  const now = useLiveClock();

  return (
    // No overflow-hidden here anymore — the object is meant to bleed past
    // this section's own box (its top spike breaking above the hero
    // content, closer to the nav), same as the reference. The grid-line
    // background below doesn't need clipping (it's inset-0 against this
    // same wrapper, so it never extends past it regardless).
    //
    // -mx-6/-mx-12 cancels .section-container's own side padding (1.5rem/
    // 3rem) specifically for the hero, then px-4/px-6 adds back a much
    // smaller gutter — the wide status rows and object were leaving a big
    // empty margin next to the browser edge otherwise. The product grid
    // below keeps the normal .section-container padding, unaffected.
    <div className="relative -mx-6 px-4 lg:-mx-12 lg:px-6">
      {/* Thin technical grid lines */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
        }}
      />

      {/* A faint horizontal scanline drifting slowly down the section —
          ambient "CRT monitor" texture, not a loading indicator. The outer
          div gives the animated line a real pixel height to travel across
          (a % `top` keyframe needs a sized containing block, not an auto-
          height one) and clips it so it can't bleed into the nav or the
          product grid below. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 hidden h-[600px] overflow-hidden lg:block"
      >
        <div className="scanline absolute inset-x-0 h-px bg-white/10" />
      </div>

      {/* Scattered "+" crosshairs — small technical-diagram marks, same
          spirit as the grid lines, positioned to match the reference
          (below the nav, by the caption text, and out past the object). */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-6 top-10 hidden font-mono text-white/25 sm:block lg:left-10"
      >
        +
      </span>
      <span
        aria-hidden
        className="pointer-events-none absolute left-[44%] top-24 hidden font-mono text-white/20 lg:block"
      >
        +
      </span>
      <span
        aria-hidden
        className="pointer-events-none absolute right-[26%] top-20 hidden font-mono text-white/20 lg:block"
      >
        +
      </span>
      <span
        aria-hidden
        className="pointer-events-none absolute right-6 top-32 hidden font-mono text-white/25 lg:block"
      >
        +
      </span>

      {/* The one decorative line — a single continuous, genuinely organic
          stroke (a hand-drawn sweep, not a rigid multi-segment technical
          path) starting under PORTFOLIO in the nav, curving down and
          across under the object, then back up along its right side.
          Kept to just a few long, gentle bezier segments rather than many
          short ones so the curvature stays smooth throughout instead of
          reading as jointed/mechanical. */}
      <svg
        aria-hidden
        viewBox="0 0 1000 600"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-x-0 -top-24 hidden h-[560px] w-full text-white/25 lg:block"
      >
        <path
          d="M270,0 C360,130 430,275 520,368 C610,455 740,470 830,400 C870,368 878,310 850,270 C830,242 838,220 870,225"
          fill="none"
          strokeLinecap="round"
          stroke="currentColor"
          strokeWidth="1"
        />
      </svg>

      <div className="relative pb-1 pt-2 lg:pb-1 lg:pt-3">
        {/* System status row — z-10 so it stays readable over the object,
            which at this size/angle can swing up into this corner. */}
        {/* Fluid (clamp()-based) type from here down instead of jumping
            between fixed base/sm/lg sizes: those discrete jumps left an
            awkward middle ground (tablet-ish widths, ~600-900px) where the
            grid/margins were still using values tuned for a ~390px phone
            while text had already jumped up to its "sm" size, causing the
            object to overlap status text that fit fine at either true
            endpoint. Scaling continuously with viewport width means every
            width in between is *also* tuned, not just the two or three
            breakpoints someone happened to test. */}
        {/* Both status blocks stay on the left now, side by side — moved
            off the right side entirely (per feedback) since no amount of
            z-index/outline styling on SYSTEM_STATUS actually solved it
            crossing the object at some widths without either shrinking
            the object or moving the text off the object's side of the
            page for good. */}
        <div className="relative z-10 mb-1 flex flex-wrap items-start gap-8 font-mono text-[clamp(7px,1.3vw,11px)] leading-relaxed text-white/50">
          <div>
            <p>USER: GUEST</p>
            <p>&gt; ACCESS: SHOP</p>
            <p>&gt; STATUS: ONLINE</p>
            <p>&gt; TIME: {now ? formatClock(now) : "————.——.—— --:--:--"}</p>
          </div>
          <div>
            <p className="text-white/70">SYSTEM_STATUS:</p>
            <p>&gt; SHOP ONLINE</p>
            <p>&gt; INVENTORY: ACTIVE</p>
            <p>&gt; MODE: EXPERIMENTAL</p>
          </div>
        </div>

        <div className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] items-center gap-3">
          {/* Left: headline / archive index */}
          <div className="relative z-10">
            {/* --font-orbitron, not font-mono: matches the homepage Hero's
                own "DIAMANTES DESIGNS" h1 and .section-heading (see
                globals.css) — one consistent big-display-heading face
                across Hero/Shop/homepage instead of Shop's title being
                in the body's plain monospace on its own. */}
            <h1
              className="text-[clamp(3.5rem,8vw,6rem)] leading-[0.95] tracking-tight"
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              SHOP
              <span className="blink-cursor" style={{ color: "var(--focus-ring)" }}>
                _
              </span>
            </h1>
            <p className="mt-1 font-mono text-[clamp(0.625rem,1.6vw,0.875rem)] tracking-[0.12em] text-white/60">
              OBJECTS FOR AN UNDEFINED FUTURE
              <span style={{ color: "var(--focus-ring)" }}>_</span>
            </p>

            <div className="mt-1 pt-1 font-mono text-[clamp(7px,1.3vw,11px)] leading-relaxed text-white/40">
              <p>ARCHIVE / {lastUpdate.getFullYear()}</p>
              <p>
                {String(objectCount).padStart(2, "0")} OBJECT{objectCount === 1 ? "" : "S"}{" "}
                AVAILABLE
              </p>
              <p>
                LAST UPDATE: {lastUpdate.getFullYear()}.{pad(lastUpdate.getMonth() + 1)}.
                {pad(lastUpdate.getDate())}
              </p>
            </div>
          </div>

          {/* Right: the hero chrome object, this studio's own render, not a
              stock/generic asset — a single self-contained "stage" so the
              orbital arcs and caption stay anchored to the object itself,
              wherever it ends up sitting/bleeding on the page. Sized well
              past the reach of its own grid column and pulled up with a
              big negative top margin so it visibly breaks out of the hero,
              same as the reference.

              z-[60] + pointer-events-none: Nav (components/Nav.tsx) has an
              explicit z-50 of its own (for its mobile-menu overlay), which
              otherwise paints OVER this even though the object is
              positioned higher up the page — it was rendering "behind" the
              nav bar instead of floating above/through it. pointer-events-
              none keeps the now-higher-stacked object from swallowing
              clicks on the nav links it visually overlaps.

              translate-x nudges it further right so its silhouette clears
              the SERVICES nav link instead of crossing over it.

              Width/margins/translate are fluid (calc()/clamp() custom
              properties, not plain base/lg breakpoint jumps) below lg, so
              there's no untested middle ground the way discrete
              breakpoints left one before — but at lg and up this reverts
              to the *exact* original fixed desktop values (not a
              continuation of the same curve): the curve's own width
              growth rate is deliberately capped well below what it'd take
              to reach the original 46rem by 1440px, because reaching it
              that fast made the object wide enough at ~700-900px to grow
              into the SYSTEM_STATUS text on the right. A plain lg:
              Tailwind class can't win against these inline custom
              properties (inline declarations always outrank stylesheet
              rules, regardless of breakpoint), so the override has to
              happen at the custom-property level instead, via the
              <style> block below — the actual margin/width/transform
              properties just consume whichever value currently wins. */}
          <style>{`
            .shop-hero-stage {
              --stage-w: clamp(200px, 45vw, 46rem);
              --stage-mr: clamp(-64px, calc(-12px - (100vw - 390px) * 0.0495), -12px);
              --stage-mt: clamp(-270px, calc(-16px - (100vw - 390px) * 1), -16px);
              --stage-tx: clamp(4px, calc(4px + (100vw - 390px) * 0.0495), 64px);
            }
            @media (min-width: 1024px) {
              .shop-hero-stage {
                --stage-w: 46rem;
                --stage-mr: -4rem;
                --stage-mt: -14rem;
                --stage-tx: 4rem;
              }
            }
          `}</style>
          <div
            className="shop-hero-stage relative z-[60] aspect-[16/11] pointer-events-none lg:h-[33rem]"
            style={{
              width: "var(--stage-w)",
              marginRight: "var(--stage-mr)",
              marginTop: "var(--stage-mt)",
              transform: "translateX(var(--stage-tx))",
            }}
          >
            {/* Caption sits to the object's left, vertically centered —
                matching the reference — rather than centered underneath. */}
            <p className="pointer-events-none absolute left-0 top-1/2 hidden w-32 -translate-y-1/2 font-mono text-[11px] leading-relaxed text-white/30 lg:block">
              [ EXPERIMENTAL
              <br />
              MATERIALS
              <br />
              DIGITAL FABRICATION ]
              <br />[ &amp; BEYOND ]
            </p>

            <Image
              src="https://res.cloudinary.com/mklxo4lx/image/upload/v1789314379/site/shop/hero-chrome-object.png"
              alt=""
              fill
              className="object-contain"
              sizes="(min-width: 1024px) 900px, 90vw"
              priority
            />
          </div>

          {/* Mobile-only caption, centered underneath the object since
              there's no room for it beside the object at that width — a
              genuine sibling of the "stage" box above, not a child of it:
              the object <Image> is `fill` (position: absolute), which
              takes it out of normal document flow entirely, so a caption
              INSIDE that same box would render at the box's own top
              (its only in-flow content) and overlap the image's top
              instead of actually sitting below it. */}
          <p className="col-span-2 text-center font-mono text-[clamp(9px,1.3vw,11px)] text-white/30 lg:hidden">
            [ EXPERIMENTAL MATERIALS / DIGITAL FABRICATION &amp; BEYOND ]
          </p>
        </div>
      </div>
    </div>
  );
}
