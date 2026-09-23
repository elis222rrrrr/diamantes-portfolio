"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { fadeInUp } from "./motion/variants";

export default function StudioBand() {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={fadeInUp}
      className="grid grid-cols-[0.85fr_1.15fr] bg-black text-white lg:grid-cols-2"
    >
      <div
        aria-hidden
        className="relative min-h-[240px] overflow-hidden lg:min-h-[360px]"
        style={{ backgroundColor: "#ffffff" }}
      >
        <Image
          // The Puffer garment render — a transparent-background cutout, not
          // a full-bleed studio photo, so this uses object-contain (like
          // ProductCard's product cutouts) rather than object-cover, which
          // would zoom/crop a subject that doesn't fill its own frame.
          // e_trim/e_upscale are Cloudinary URL transforms applied once and
          // cached as a derived asset: e_trim removes the source PNG's excess
          // white margin, e_upscale is Cloudinary's AI upscaler taking the
          // ~211×208 trimmed crop up to ~844×832 for a sharper result at this
          // banner's display size than the original small export had.
          //
          // Much less padding below lg: this column is narrower than the
          // desktop side-by-side design assumed (kept side-by-side at
          // every width per feedback, not just lg+), so the same generous
          // padding would shrink an already-small image down further.
          src="https://res.cloudinary.com/mklxo4lx/image/upload/e_trim/e_upscale/v1790084579/portfolio/e6zwyzwdmwmiavmdgppj.png"
          alt="Puffer jacket render"
          fill
          className="object-contain p-4 sm:p-8 lg:p-32"
        />
      </div>

      {/* py-24 is meant to vertically center this column against the image
          beside it — kept smaller below lg since that column is
          proportionally narrower there (0.85fr vs. 1.15fr, not an even
          split like lg's), so its content naturally runs a bit taller. */}
      <div className="flex flex-col justify-center gap-4 px-4 py-6 sm:gap-6 sm:px-6 sm:py-10 lg:px-12 lg:py-24">
        {/* Bracket-numbered eyebrow + tick divider — same archive-index
            language as the Hero's own [ 01 ]/[ 02 ] captions. */}
        <div>
          <p className="tracked-label text-white/40">
            <span style={{ color: "var(--focus-ring)" }}>[ 03 ]</span> STUDIO
          </p>
          <div className="mt-3 h-px w-6 bg-white/20" />
        </div>

        <h2 className="section-heading leading-tight">Design</h2>

        <p className="max-w-md text-xs leading-relaxed text-muted sm:text-sm">
          Diamantes 3Designs is a creative technology studio in Greece, working across 3D fashion,
          digital fabrication, CAD and product design, from a full 3D-printed fashion collection to
          sculptural jewelry cast in sterling silver.
        </p>

        {/* .tracked-label's own font-size/letter-spacing (0.65rem/0.15em)
            are overridden smaller below sm — with "Start a project" in
            play, not just "About us", that tracking alone was wide enough
            to force these two onto separate lines even after the
            grid-column and gap shrinks above. */}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 sm:gap-x-8">
          <Link
            href="/about"
            className="focus-ring tracked-label inline-flex w-fit items-center gap-1 text-[9px] tracking-[0.06em] text-white/70 transition hover:text-white sm:gap-2 sm:text-[0.65rem] sm:tracking-[0.15em]"
          >
            About us
            <ArrowRight size={12} className="sm:hidden" />
            <ArrowRight size={14} className="hidden sm:block" />
          </Link>
          <Link
            href="/services"
            className="focus-ring tracked-label inline-flex w-fit items-center gap-1 text-[9px] tracking-[0.06em] text-white/70 transition hover:text-white sm:gap-2 sm:text-[0.65rem] sm:tracking-[0.15em]"
          >
            {/* "Start a project" doesn't fit beside "About us" in this
                column's ~150px width below sm even at this row's smallest
                readable size — shortened there only; sm+ (where the
                column is wide enough) keeps the full phrase. */}
            <span className="sm:hidden">Start</span>
            <span className="hidden sm:inline">Start a project</span>
            <ArrowRight size={12} className="sm:hidden" />
            <ArrowRight size={14} className="hidden sm:block" />
          </Link>
        </div>
      </div>
    </motion.section>
  );
}
