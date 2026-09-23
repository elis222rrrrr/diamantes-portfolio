"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { fadeInUp } from "./motion/variants";
import ProjectGrid, { type Project } from "./ProjectGrid";

type Props = {
  as?: "h1" | "h2";
  projects: Project[];
};

export default function PortfolioSection({ as: Heading = "h2", projects }: Props) {
  return (
    <section id="portfolio" className="bg-black text-white">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fadeInUp}
        className="section-container"
      >
        <div className="mb-14 flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            {/* Bracket-numbered eyebrow + tick divider — the same
                archive-index language the Hero establishes ([ 01 ], the
                tick marks under its captions), threaded down into the
                rest of the homepage instead of stopping at the fold. */}
            <p className="tracked-label text-white/40">
              <span style={{ color: "var(--focus-ring)" }}>[ 01 ]</span> PORTFOLIO
            </p>
            <div className="mt-3 h-px w-6 bg-white/20" />
            <Heading className="section-heading mt-4">Portfolio</Heading>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
              Exploring the intersection of technology, materials and form. Selected work from our
              studio.
            </p>
            <Link
              href="/portfolio"
              className="focus-ring tracked-label mt-6 inline-flex items-center gap-2 text-white/70 transition hover:text-white"
            >
              View all projects
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* The real Portfolio grid's own component — this used to be three
            hardcoded placeholder cards ("Cyber Organic", "Parametric
            Shell", "Mechanical Part") that didn't link anywhere real. */}
        <ProjectGrid projects={projects} />
      </motion.div>
    </section>
  );
}
