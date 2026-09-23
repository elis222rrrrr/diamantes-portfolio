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
      className="grid bg-black text-white lg:grid-cols-2"
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
          src="https://res.cloudinary.com/mklxo4lx/image/upload/e_trim/e_upscale/v1790084579/portfolio/e6zwyzwdmwmiavmdgppj.png"
          alt="Puffer jacket render"
          fill
          className="object-contain p-16 sm:p-24 lg:p-32"
        />
      </div>

      {/* py-24 is meant to vertically center this column against the image
          beside it on desktop — at mobile widths, where the grid stacks
          into two separate rows instead, that same top padding reads as a
          large dead gap between the image and this text, so it only
          applies from lg up; py-10 covers mobile/tablet instead. */}
      <div className="flex flex-col justify-center gap-6 px-6 py-10 lg:px-12 lg:py-24">
        {/* Bracket-numbered eyebrow + tick divider — same archive-index
            language as the Hero's own [ 01 ]/[ 02 ] captions. */}
        <div>
          <p className="tracked-label text-white/40">
            <span style={{ color: "var(--focus-ring)" }}>[ 03 ]</span> STUDIO
          </p>
          <div className="mt-3 h-px w-6 bg-white/20" />
        </div>

        <h2 className="section-heading leading-tight">Design</h2>

        <p className="max-w-md text-sm leading-relaxed text-muted">
          Diamantes 3Designs is a creative technology studio in Greece, working across 3D fashion,
          digital fabrication, CAD and product design, from a full 3D-printed fashion collection to
          sculptural jewelry cast in sterling silver.
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-x-8 gap-y-3">
          <Link
            href="/about"
            className="focus-ring tracked-label inline-flex w-fit items-center gap-2 text-white/70 transition hover:text-white"
          >
            About us
            <ArrowRight size={14} />
          </Link>
          <Link
            href="/services"
            className="focus-ring tracked-label inline-flex w-fit items-center gap-2 text-white/70 transition hover:text-white"
          >
            Start a project
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </motion.section>
  );
}
