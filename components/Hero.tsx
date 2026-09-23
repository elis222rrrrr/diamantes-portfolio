"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "framer-motion";
import CutWord from "./CutWord";
import DotLine from "./DotLine";
import { fadeInUp } from "./motion/variants";

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function formatClock(d: Date) {
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}:${pad(d.getSeconds())}`;
}
/** Same live "system readout" clock as the Shop hero (components/ShopHero.tsx)
 * — kept as a local copy rather than a shared hook since each has its own
 * small formatting quirks and this is the only other place it's used. */
function useLiveClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    // A direct setNow() call right here is flagged as "setState
    // synchronously within an effect" (react-hooks/set-state-in-effect) —
    // deferring the first tick to a macrotask keeps the same "updates on
    // the very next tick after mount" behavior without a synchronous call
    // in the effect body itself.
    const initial = setTimeout(() => setNow(new Date()), 0);
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => {
      clearTimeout(initial);
      clearInterval(id);
    };
  }, []);
  return now;
}

const HeroModel = dynamic(() => import("./HeroModel"), { ssr: false });

/** A small "selection handle" — the corner-bracket squares design tools draw
 * around a selected element. Purely decorative here, echoing the reference
 * mockup's bounding-box handles around the 3D object. */
function Handle({ corner }: { corner: "tl" | "tr" | "bl" | "br" }) {
  const pos =
    corner === "tl"
      ? "-left-1.5 -top-1.5"
      : corner === "tr"
        ? "-right-1.5 -top-1.5"
        : corner === "bl"
          ? "-left-1.5 -bottom-1.5"
          : "-right-1.5 -bottom-1.5";
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute ${pos} h-3 w-3 border`}
      style={{ borderColor: "var(--focus-ring)", background: "var(--background)" }}
    />
  );
}

/** One corner of the outer frame border — a short L-shaped crop mark, same
 * language print/broadcast layouts use to mark a bleed area. `accent`
 * (used on just the top-left corner) tints it with the site's one accent
 * color instead of neutral white, like a camera viewfinder's "recording"
 * corner mark. */
function FrameCorner({
  corner,
  accent = false,
}: {
  corner: "tl" | "tr" | "bl" | "br";
  accent?: boolean;
}) {
  const base = `pointer-events-none absolute h-3 w-3 ${accent ? "" : "border-white/50"}`;
  const map = {
    tl: "-left-px -top-px border-l border-t",
    tr: "-right-px -top-px border-r border-t",
    bl: "-left-px -bottom-px border-l border-b",
    br: "-right-px -bottom-px border-r border-b",
  } as const;
  return (
    <span
      aria-hidden
      className={`${base} ${map[corner]}`}
      style={accent ? { borderColor: "var(--focus-ring)" } : undefined}
    />
  );
}

type FeaturedService = { title: string; description: string; href: string } | null;

type Props = {
  tagline: string;
  categories: string[];
  /** A featured service (title + short description), standing in for the
   * reference mockup's "NEW_COLLECTION.EXE" panel — text, not a photo, per
   * feedback; null when there's no active service. */
  featuredService: FeaturedService;
  /** Count of active PortfolioProject rows — a genuinely real number for
   * the status row's "> ARCHIVE:" line, not an invented/decorative one
   * (there's no visitor/session tracking in this app to show instead). */
  projectCount: number;
};

export default function Hero({ tagline, categories, featuredService, projectCount }: Props) {
  const now = useLiveClock();
  // The left sidebar's numbered list is the real category data (same prop
  // the old bottom bracket-list used) rather than an invented one, capped at
  // five lines so a long settings-driven list can't blow out the sidebar.
  const sidebarCategories = categories.slice(0, 5);

  return (
    <section id="home" className="relative flex flex-col overflow-hidden bg-black text-white">
      {/* A faint grain — the one thing that made this otherwise perfectly
          flat/vector archive-sheet look feel a little too clean, next to a
          chrome model that's meant to read as a real photographed object.
          Plain opacity + a grayscale noise tile, not a blend-mode trick:
          "overlay"/"multiply" are no-ops on a literal pure-black base (the
          overlay formula collapses to the base when base=0), so they'd
          silently do nothing in the dark theme specifically. Normal
          blending with actual light+dark speckles works in both themes
          instead — lightens against black, darkens against white. No
          z-index, so it stacks below every sibling here that has one
          (z-index:auto participates in paint order as if it were 0). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundRepeat: "repeat",
        }}
      />

      <div aria-hidden className="hero-viewport-graphic pointer-events-none absolute inset-0" />

      {/* Outer frame + crop-mark corners — the reference's "whole hero is one
          bordered archive sheet" look. Large screens only: at narrow widths
          the frame would just eat into already-tight padding. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-6 z-20 hidden border border-white/10 lg:inset-10 lg:block"
      >
        <FrameCorner corner="tl" accent />
        <FrameCorner corner="tr" />
        <FrameCorner corner="bl" />
        <FrameCorner corner="br" />

        {/* Ruler ticks along the top/bottom edges — ordinary print/broadcast
            bleed-sheet dressing, same register as the crop-mark corners.
            A repeating background gradient stands in for dozens of
            individual tick elements. */}
        {/* color-mix against var(--foreground), not a literal rgba white —
            this section's "white" is this site's usual semantic token that
            flips to near-black text/lines under the light theme (see the
            bg-black/text-white note on ProductCard.tsx); a hardcoded white
            gradient would silently vanish against light theme's white
            background exactly like that same bug has before. */}
        <div
          className="absolute inset-x-8 top-0 h-2"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, color-mix(in srgb, var(--foreground) 18%, transparent) 0, color-mix(in srgb, var(--foreground) 18%, transparent) 1px, transparent 1px, transparent 48px)",
          }}
        />
        <div
          className="absolute inset-x-8 bottom-0 h-2"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, color-mix(in srgb, var(--foreground) 18%, transparent) 0, color-mix(in srgb, var(--foreground) 18%, transparent) 1px, transparent 1px, transparent 48px)",
          }}
        />

        {/* Vertical edge micro-copy, sitting in the margin between this
            frame and the section's true edge — the small rotated running
            text print/lookbook sheets tuck into their own bleed area. */}
        <p
          className="absolute -left-8 top-1/2 origin-center -translate-x-1/2 -translate-y-1/2 -rotate-90 whitespace-nowrap font-mono text-[10px] tracking-[0.35em]"
          style={{ color: "color-mix(in srgb, var(--focus-ring) 45%, transparent)" }}
        >
          DIAMANTES DESIGNS&trade;
        </p>
        <p
          className="absolute -right-8 top-1/2 origin-center -translate-x-1/2 -translate-y-1/2 rotate-90 whitespace-nowrap font-mono text-[10px] tracking-[0.35em]"
          style={{ color: "color-mix(in srgb, var(--focus-ring) 45%, transparent)" }}
        >
          ARCHIVE NO. 2026-01
        </p>
      </div>

      {/* System status readouts — same terminal language as the Shop hero,
          top-left/top-right, plus the coordinates block bottom-right and a
          few crosshair marks. z-10 keeps all of it above the grid/glow/
          rings but still under the model + title's own z-10 content.
          Fades in on mount (not whileInView — this is above the fold from
          the first frame) ahead of the two sidebars below, for a "system
          booting up" sequence that fits the terminal language. Doesn't
          touch the h1's own immediate, unanimated paint. */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
        className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-between px-3 font-mono text-[8px] leading-relaxed text-white/50 sm:top-6 sm:px-6 sm:text-[11px] lg:px-16"
      >
        <div>
          <p>USER: GUEST</p>
          <p>&gt; ACCESS: HOME</p>
          <p>
            &gt; STATUS: <span style={{ color: "var(--focus-ring)" }}>ONLINE</span>
          </p>
          <p>&gt; LOCATION: GREECE</p>
          <p>&gt; TIME: {now ? formatClock(now) : "————.——.—— --:--:--"}</p>
          <p>
            &gt; ARCHIVE: {String(projectCount).padStart(2, "0")} PROJECT
            {projectCount === 1 ? "" : "S"}
          </p>
          <div className="mt-2 h-px w-6 bg-white/20" />
        </div>
        {/* "[ EST 2026 ]" + coordinates, top-right — replaces the old
            SYSTEM_STATUS block in that corner, matching the reference. */}
        <div className="text-right">
          <p style={{ color: "var(--focus-ring)" }}>[ EST 2026 ]</p>
          <p>GREECE</p>
          <p>37.9838&deg; N</p>
          <p>23.7275&deg; E</p>
          <div className="ml-auto mt-2 h-px w-6 bg-white/20" />
        </div>
      </motion.div>

      <span
        aria-hidden
        className="pointer-events-none absolute left-6 top-24 hidden font-mono sm:block lg:left-16"
        style={{ color: "color-mix(in srgb, var(--focus-ring) 55%, transparent)" }}
      >
        +
      </span>

      {/* Three-column archive layout: left sidebar (category index + a real
          portfolio preview + a project-type list), center (the model/title/
          tagline — the page's actual content), right sidebar (a real
          product preview + a process caption + a CTA). Side columns are
          lg+-only decoration; center content alone carries the page at
          narrower widths — actually enforced below via grid-cols-1 +
          hidden on both sidebars, not just a comment: at 76-120px wide
          these held real multi-word labels ("DIGITAL FABRICATION",
          "ENGINEERING") that had no room to sit beside the center column
          at all and just overlapped it.

          pt-24 sm:pt-40 (well past the absolute status row's own ~123px
          height, computed from its 5 text-[11px]/leading-relaxed lines +
          top-6 offset) clears it — that status block jumps from
          text-[8px] to text-[11px] at the same sm breakpoint, so the
          bigger clearance has to start there too, not at lg, or sm/tablet
          widths render the grid's content directly underneath/overlapping
          that status text. */}
      <div className="relative z-10 mx-auto grid w-full max-w-[1440px] flex-1 grid-cols-1 gap-2 px-3 pb-8 pt-24 sm:gap-4 sm:px-6 sm:pt-40 lg:grid-cols-[240px_1fr_240px] lg:gap-10 lg:px-20 lg:pb-12">
        {/* LEFT SIDEBAR — fades in after the top status row (see its own
            comment above), before the right sidebar, for that same
            sequential "booting up" feel. */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.25 }}
          className="hidden flex-col justify-between lg:flex"
        >
          <div className="font-mono text-[11px] leading-relaxed text-white/50">
            <p style={{ color: "var(--focus-ring)" }}>[ 01 ]</p>
            <div className="mt-2 space-y-1 text-white/40">
              {sidebarCategories.map((item) => (
                <p key={item}>| {item}</p>
              ))}
            </div>
            <div className="mt-3 h-px w-6 bg-white/20" />
          </div>

          <Link
            href="/shop"
            className="focus-ring group border border-white/12 p-3 transition hover:border-white/30"
          >
            <div className="flex items-center justify-between font-mono text-[10px] text-white/35">
              {/* Genuinely rendered text, not a stray comment — eslint's
                  react/jsx-no-comment-textnodes heuristic can't tell the
                  difference from a plain JSXText node, so this is wrapped
                  as a string expression instead to satisfy it without an
                  eslint-disable. */}
              <span style={{ color: "var(--focus-ring)" }}>{"// FIRST_DROP"}</span>
              <span>002</span>
            </div>
            <p className="mt-3 text-sm font-medium text-white/85 transition group-hover:text-white">
              SHOP
            </p>
            <span
              className="mt-3 inline-block font-mono text-[10px]"
              style={{ color: "var(--focus-ring)" }}
            >
              CHECK THE SHOP +
            </span>
          </Link>

          <div className="font-mono text-[11px] leading-relaxed">
            <p className="text-white/50">PROJECTS [01-04]</p>
            <div className="mt-2 space-y-1 text-white/40">
              <p>+ WEARABLES</p>
              <p>+ OBJECTS</p>
              <p>+ MATERIAL STUDIES</p>
              <p>+ CUSTOM COMMISSIONS</p>
            </div>
          </div>
        </motion.div>

        {/* CENTER COLUMN */}
        <div className="flex flex-col items-center justify-center text-center">
          <p className="text-lg tracking-[0.3em] text-white/60">一軸工業</p>
          <p className="tracked-label mt-2 text-white/50">CREATIVE TECHNOLOGY STUDIO</p>
          <div className="mt-3 h-px w-6 bg-white/20" />

          {/* The studio's 3D form — lazy-mounted client-side only, so it
              never competes with the h1 below for LCP. Selection-handle
              squares + XYZ/figure captions dress it up as an "inspected
              object" per the reference, without changing the model itself. */}
          <div className="relative mt-4 h-[230px] w-full max-w-[560px] sm:mt-8 sm:h-[360px] lg:h-[520px]">
            {/* The bounding-box outline the 4 corner Handles sit on —
                without it they read as four unrelated floating squares
                rather than one selected object's box. */}
            <div
              className="absolute inset-[8%] border border-dashed"
              style={{ borderColor: "color-mix(in srgb, var(--focus-ring) 20%, transparent)" }}
            >
              <Handle corner="tl" />
              <Handle corner="tr" />
              <Handle corner="bl" />
              <Handle corner="br" />
            </div>
            <div aria-hidden className="pointer-events-none absolute inset-0 animate-float">
              <HeroModel />
            </div>

            {/* Top corners get their own annotations too, mirroring the
                bottom two — a fully-captioned bounding box on all four
                corners reads as a genuine technical drawing/inspection
                sheet rather than two labels that happen to be there. */}
            <p className="pointer-events-none absolute left-0 top-0 hidden font-mono text-[11px] leading-relaxed text-white/35 sm:block">
              MATERIAL:
              <br />
              CHROME ALLOY
            </p>
            <p className="pointer-events-none absolute right-0 top-0 hidden text-right font-mono text-[11px] leading-relaxed text-white/35 sm:block">
              SCALE 1:1
            </p>

            <p className="pointer-events-none absolute bottom-0 left-0 hidden font-mono text-[11px] leading-relaxed text-white/35 sm:block">
              X: 0.00
              <br />
              Y: 0.00
              <br />
              Z: 0.00
            </p>
            <div className="pointer-events-none absolute bottom-0 right-0 hidden text-right font-mono text-[11px] leading-relaxed text-white/35 sm:block">
              <p>[ FIG. 01 ]</p>
              <p>DIAMANTES_CORE V.01</p>
              <p>{"// 3D MODEL"}</p>
            </div>
          </div>

          <DotLine label="MODEL" side="left" className="mt-8" flash accent />

          {/* Deliberately not inside the whileInView-animated block below: this
              h1 is the page's LCP element, and gating it behind an
              IntersectionObserver + JS fade-in measurably added several seconds
              to LCP under real mobile throttling (Lighthouse mobile run, see
              ARCHITECTURE.md's Quality section) — it must paint immediately. */}
          {/* lg:self-start pulls just the wordmark to the column's left
              edge (per feedback) instead of centered under the model —
              everything else in this column (kanji line, model, tagline,
              DotLines) stays centered as before. The negative margin then
              pulls it further still, past its own column's start and the
              grid gap, so it lines up with the left sidebar's own text
              instead of stopping at the (still fairly inset) column edge —
              "more to the edge" per feedback. Below lg there's rarely room
              for that asymmetry to read well, so it stays centered there.

              Both the margin and the text size step in at xl, not lg: the
              center column is only ~300px wide at 1024-1279px (240px
              sidebars + this grid's own padding/gaps eat most of it), too
              narrow for the full -280px pull or an 8xl "DIAMANTES" without
              wrapping into — and overlapping — the left sidebar's caption
              underneath it. xl+ has the ~560px+ column this was designed
              for. */}
          <h1
            className="mt-4 self-center text-[clamp(1.25rem,7vw,6rem)] leading-[0.95] sm:mt-6 sm:text-5xl md:text-6xl lg:self-start lg:text-left lg:text-7xl xl:-ml-[280px] xl:text-8xl"
            style={{ fontFamily: "var(--font-orbitron)", color: "var(--foreground)" }}
          >
            {/* whitespace-nowrap per word: each CutWord is a run of
                individually-spanned letters with no actual space
                characters between them, but adjacent inline-block boxes
                still carry an implicit soft-wrap opportunity — without
                this, a narrow flex/grid column (e.g. the ~300px center
                column at the 1024-1279px breakpoint) wraps mid-word
                ("DIAMA"/"NTES") instead of overflowing past its column,
                which the <br/> between words already handles on purpose. */}
            <span className="whitespace-nowrap">
              <CutWord
                text="DIAMANTES"
                cuts={[6]}
                lowCuts={[2, 4]}
                smallCuts={[8]}
                bottomCuts={[8]}
                lowSquares={[2, 4]}
              />
            </span>
            <br />
            <span className="whitespace-nowrap">
              <CutWord text="DESIGNS" cuts={[0, 5]} squares={[0]} />
              <sup className="ml-1 align-super text-base tracking-normal text-white/50 lg:text-xl">
                &reg;
              </sup>
            </span>
          </h1>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="w-full"
          >
            <div className="mt-6 flex items-center justify-between">
              <DotLine label="DESIGN" side="left" flash accent />
              {/* A stacked process caption with a circle+dot indicator,
                  matching the reference's bottom-right cluster. */}
              <div className="hidden items-center gap-3 sm:flex">
                <span
                  aria-hidden
                  className="relative flex h-2.5 w-2.5 shrink-0 items-center justify-center rounded-full border"
                  style={{ borderColor: "var(--focus-ring)" }}
                >
                  <span
                    className="dot-flash h-1 w-1 rounded-full"
                    style={{ background: "var(--focus-ring)" }}
                  />
                </span>
                <div className="font-mono text-[11px] leading-tight tracking-[0.1em] text-white/50">
                  <p>DESIGN / DEVELOP</p>
                  <p>FABRICATE / ELEVATE</p>
                </div>
              </div>
            </div>

            <p className="tracked-label mt-8 text-center text-white/60">
              {tagline}
              <span style={{ color: "var(--focus-ring)" }}>_</span>
            </p>
            <div className="mx-auto mt-3 h-px w-6 bg-white/20" />
          </motion.div>
        </div>

        {/* RIGHT SIDEBAR — shows the studio's featured service (text, not a
            photo — see featuredService's own comment). The left sidebar's
            portfolio-preview card was removed per feedback; this panel is
            unaffected either way, since it only ever reads featuredService.

            Last to fade in of the three (status row, then left sidebar,
            then this one) — same boot-sequence delay pattern. */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
          className="hidden flex-col justify-between lg:flex"
        >
          {featuredService && (
            <div className="translate-y-8">
              <div className="border border-white/12 p-3">
                <div className="flex items-center justify-between font-mono text-[10px] text-white/35">
                  <span>{"// STUDIO_FOCUS"}</span>
                  <span>
                    001 <span style={{ color: "var(--focus-ring)" }}>&#9632;</span>-
                  </span>
                </div>
                <Link href={featuredService.href} className="focus-ring group mt-3 block">
                  <p className="text-sm font-medium text-white/85 transition group-hover:text-white">
                    {featuredService.title}
                  </p>
                  <p className="mt-1.5 font-mono text-[11px] leading-relaxed text-white/40">
                    {featuredService.description}
                  </p>
                  <span
                    className="mt-3 inline-block font-mono text-[10px]"
                    style={{ color: "var(--focus-ring)" }}
                  >
                    VIEW STUDIO +
                  </span>
                </Link>
              </div>
            </div>
          )}

          <div className="text-right font-mono text-[11px] leading-relaxed text-white/40">
            <p style={{ color: "var(--focus-ring)" }}>[ 02 ]</p>
            <p>RESEARCH &rarr; PROTOTYPE &rarr; PRODUCE</p>
          </div>

          {/* Dashed box + solid corner squares — the same "selected
              object" bounding-box language as the Handle/dashed-frame
              around the 3D model above, applied to this CTA instead of a
              plain rounded pill. */}
          <Link
            href="/shop"
            className="focus-ring group relative flex items-center justify-between gap-3 border border-dashed px-4 py-3 font-mono text-xs tracking-[0.15em] text-white/70 transition hover:text-white"
            style={{ borderColor: "color-mix(in srgb, var(--foreground) 50%, transparent)" }}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute -left-[3px] -top-[3px] h-1.5 w-1.5"
              style={{ background: "var(--foreground)" }}
            />
            <span
              aria-hidden
              className="pointer-events-none absolute -right-[3px] -top-[3px] h-1.5 w-1.5"
              style={{ background: "var(--foreground)" }}
            />
            <span
              aria-hidden
              className="pointer-events-none absolute -bottom-[3px] -left-[3px] h-1.5 w-1.5"
              style={{ background: "var(--foreground)" }}
            />
            <span
              aria-hidden
              className="pointer-events-none absolute -bottom-[3px] -right-[3px] h-1.5 w-1.5"
              style={{ background: "var(--foreground)" }}
            />
            EXPLORE
            <span aria-hidden className="transition group-hover:translate-x-1">
              &rarr;
            </span>
          </Link>
        </motion.div>
      </div>

      <a
        href="#portfolio"
        className="focus-ring relative z-10 mx-auto mb-6 flex flex-col items-center gap-3 text-muted transition hover:text-white/80"
      >
        <span className="h-8 w-px bg-white/20" />
        <span className="tracked-label">[ SCROLL TO EXPLORE ]</span>
      </a>

      {/* Bottom meta strip — copyright + legal, dressing the hero as the
          full "one archive sheet" from the reference. Terms/Privacy have no
          real pages yet (same "#" placeholder Footer.tsx already uses for
          them); Contact does, so it's a real link. */}
      <div className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-col gap-3 px-6 pb-6 font-mono text-[10px] leading-relaxed text-white/30 sm:flex-row sm:items-end sm:justify-between lg:px-20">
        <p>
          &copy; 2026 DIAMANTES DESIGNS
          <br />
          ALL RIGHTS RESERVED.
        </p>
        <div className="flex items-center gap-6">
          <a href="#" className="focus-ring transition hover:text-white/60">
            TERMS
          </a>
          <a href="#" className="focus-ring transition hover:text-white/60">
            PRIVACY
          </a>
          <Link href="/contact" className="focus-ring transition hover:text-white/60">
            CONTACT
          </Link>
          <span aria-hidden style={{ color: "var(--focus-ring)" }}>
            +
          </span>
        </div>
      </div>
    </section>
  );
}
