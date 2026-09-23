"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { fadeInUp } from "./motion/variants";
import BracketLink from "./ui/BracketLink";

type Service = { id: string; slug: string; title: string; description: string; accent: string };

function pad(n: number) {
  return String(n + 1).padStart(2, "0");
}

type Props = {
  as?: "h1" | "h2";
  services: Service[];
  /** "list" (default) is the real /services page's own layout — full-width
   * rows. "grid" is the homepage-only teaser (per feedback: it was showing
   * the exact same layout as the full page, just truncated to 3, which
   * didn't read as a genuinely different preview) — bordered cards in a
   * row instead of stacked rows, so the homepage and the real Studio page
   * are visually distinct, not just different lengths of the same thing. */
  variant?: "list" | "grid";
};

export default function ServicesSection({ as: Heading = "h2", services, variant = "list" }: Props) {
  return (
    <section id="services" className="bg-black text-white">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fadeInUp}
        className="section-container"
      >
        <div className="mb-14 flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="tracked-label text-white/40">
              <span style={{ color: "var(--focus-ring)" }}>[ 03 ]</span> STUDIO
            </p>
            <div className="mt-3 h-px w-6 bg-white/20" />
            {/* No subtitle here — skills/ability framing only, not a
                paid-service pitch (per feedback): this section showcases
                capability/past work, not a commissioned-work offering the
                business isn't currently licensed to sell. */}
            <Heading className="section-heading mt-4">Capabilities</Heading>
          </div>
        </div>

        {variant === "grid" ? (
          // Compact pill row (per feedback, replacing an earlier bordered-
          // card grid attempt) — titles only, no descriptions, no index
          // numbers: the smallest, simplest possible homepage teaser,
          // distinct from the real /services page's full-width list rows.
          <div className="flex flex-wrap gap-3">
            {services.map((service) => (
              <BracketLink
                key={service.id}
                href={`/services/${service.slug}`}
                className="tracked-label px-5 py-3"
              >
                {service.title}
              </BracketLink>
            ))}
          </div>
        ) : (
          // A plain text list, not the image/gradient-tile grid used
          // elsewhere (Portfolio/Journal/Cart) — these services have no
          // photo to anchor a tile to, and a row of empty gradient boxes
          // read as broken/placeholder imagery rather than a deliberate
          // design choice. Index numbers carry the same archive-index
          // language as the Hero's own [ 01 ] captions instead.
          <div className="border-t border-white/10">
            {services.map((service, i) => (
              <Link
                key={service.id}
                href={`/services/${service.slug}`}
                className="focus-ring group flex items-center justify-between gap-6 border-b border-white/10 py-6"
              >
                <div className="flex items-start gap-4 sm:items-center sm:gap-8">
                  <span className="tracked-label shrink-0" style={{ color: "var(--focus-ring)" }}>
                    [ {pad(i)} ]
                  </span>
                  <div>
                    <p className="text-lg transition group-hover:text-white/80 sm:text-xl">
                      {service.title}
                    </p>
                    <p className="tracked-label mt-1 text-muted">{service.description}</p>
                  </div>
                </div>
                <ArrowUpRight
                  size={18}
                  className="shrink-0 text-white/40 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white"
                />
              </Link>
            ))}
          </div>
        )}
      </motion.div>
    </section>
  );
}
