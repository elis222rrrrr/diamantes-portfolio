"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, type PanInfo } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import DotLine from "./DotLine";
import { fadeInUp } from "./motion/variants";
import IpadHeroScene from "./PortfolioIpadSceneLoader";

const AUTO_ADVANCE_MS = 3800;
const SWIPE_OFFSET_THRESHOLD = 60;
const SWIPE_VELOCITY_THRESHOLD = 300;

// The 3D scene (components/three/IpadHeroScene.tsx) is a FIXED shot of
// apple-pencil-ipad-pro.glb — its camera bounds are hardcoded to that
// model's own measured geometry, so this overlay's position has to be
// hardcoded right alongside it (see that file's CAMERA_BOUNDS comment).
// Change one, change both. CANVAS_ASPECT is (right-left)/(top-bottom) of
// those same bounds — the container below is locked to it so the camera
// frustum always fills it exactly, at any size, with no letterboxing drift.
const CANVAS_ASPECT = 1.2042496448557247;
const SCREEN_OVERLAY = { left: "12.0054%", right: "11.9464%", top: "18.6115%", bottom: "12.5248%" };

type FeaturedProject = {
  slug: string;
  title: string;
  category: string;
  images: string[];
};

type Props = {
  project: FeaturedProject;
};

/** The Portfolio page's hero: a featured project's lookbook shown as a
 * swipeable "catalog" inside a self-drawn, landscape iPad-Pro-style mockup
 * (no external mockup image — the whole device, including the resting
 * Apple Pencil, is CSS, matching the CSP's no-external-asset posture).
 * Auto-advances like a slideshow, but a visitor can drag/swipe through it
 * manually at any time, same gesture either way. */
export default function PortfolioHero({ project }: Props) {
  const { slug, title, category, images } = project;
  const count = images.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  // The 3D iPad loads/compiles well after this component's own HTML has
  // painted (the carousel images below have nothing waiting on the model),
  // so without this, the lookbook photos used to appear first and the
  // device popped in around them afterward — backwards from how a real
  // device photo reads. Both pieces below fade in only once this flips
  // true, with the screen overlay's transition-delay keeping the two
  // visibly sequential rather than simultaneous.
  const [ipadReady, setIpadReady] = useState(false);

  useEffect(() => {
    if (paused || count <= 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [paused, count]);

  function handleDragEnd(_: unknown, info: PanInfo) {
    setPaused(false);
    if (count <= 1) return;
    const { x } = info.offset;
    const { x: vx } = info.velocity;
    if (x < -SWIPE_OFFSET_THRESHOLD || vx < -SWIPE_VELOCITY_THRESHOLD) {
      setIndex((i) => (i + 1) % count);
    } else if (x > SWIPE_OFFSET_THRESHOLD || vx > SWIPE_VELOCITY_THRESHOLD) {
      setIndex((i) => (i - 1 + count) % count);
    }
  }

  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
        }}
      />

      <div className="relative grid items-center gap-14 text-center lg:grid-cols-[minmax(0,320px)_1fr] lg:gap-10 lg:text-left">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="flex flex-col items-center lg:items-start"
        >
          <DotLine label="Selected Work" className="mb-6" accent />
          <h1 className="section-heading">Portfolio</h1>
          <p className="mb-8 mt-4 max-w-md text-sm leading-relaxed text-muted">
            Exploring the intersection of technology, materials and form. Selected work from our
            studio.
          </p>

          <Link
            href={`/portfolio/${slug}`}
            className="focus-ring group inline-flex items-center gap-2 text-sm"
          >
            <span className="tracked-label text-white/40">Featured:</span>
            <span className="transition group-hover:text-white/80">{title}</span>
            <ArrowUpRight
              size={14}
              className="text-white/40 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white"
            />
          </Link>
          <p className="tracked-label mt-1 text-muted">{category}</p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="relative mx-auto w-full max-w-xl px-4 sm:max-w-2xl lg:mx-0 lg:max-w-3xl lg:px-0"
        >
          {/* Studio-light glow lifting the silver device off the black
              page — pure white now, no color tint (dropped the earlier
              pink stop, then the blue tint too, per feedback). */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 scale-110 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.16),transparent_75%)] blur-3xl"
          />

          {/* Real apple-pencil-ipad-pro.glb (CC-BY-4.0, credited below),
              rendered by a fixed-camera Three.js shot, with the lookbook
              carousel overlaid as HTML positioned exactly over its screen
              mesh — see CANVAS_ASPECT/SCREEN_OVERLAY above. */}
          <div className="relative mx-auto w-full" style={{ aspectRatio: CANVAS_ASPECT }}>
            <div
              className={`absolute inset-0 transition-opacity duration-700 ease-out ${
                ipadReady ? "opacity-100" : "opacity-0"
              }`}
            >
              <IpadHeroScene onReady={() => setIpadReady(true)} />
            </div>

            <div
              // force-dark: this is a physical device's screen, showing a
              // fixed-black-bezel lookbook carousel — it must always read
              // as literal black/white like a real photo, not the site's
              // self-inverting bg-black/text-white theme tokens. Without
              // it, toggling the visitor's site theme to light flips
              // --color-black to white, turning the bottom scrim below
              // (from-black/70) into a wash of white instead of a
              // darkening gradient.
              className={`force-dark absolute overflow-hidden rounded-[2%] bg-black transition-opacity duration-500 ease-out ${
                ipadReady ? "opacity-100" : "opacity-0"
              }`}
              style={{ ...SCREEN_OVERLAY, transitionDelay: ipadReady ? "350ms" : "0ms" }}
              onPointerEnter={() => setPaused(true)}
              onPointerLeave={() => setPaused(false)}
            >
              <motion.div
                drag={count > 1 ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.5}
                onDragStart={() => setPaused(true)}
                onDragEnd={handleDragEnd}
                className="h-full w-full cursor-grab touch-pan-y active:cursor-grabbing"
              >
                <div
                  className="flex h-full transition-transform duration-500 ease-out"
                  style={{ transform: `translateX(-${index * 100}%)` }}
                >
                  {images.map((url, i) => (
                    <div key={url} className="relative h-full w-full shrink-0">
                      <Image
                        src={url}
                        alt={`${title}, look ${i + 1}`}
                        fill
                        draggable={false}
                        className="pointer-events-none object-cover"
                        sizes="(min-width: 640px) 420px, 80vw"
                        quality={90}
                        priority={i === 0}
                      />
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Bottom scrim + progress, overlaid on the screen. A
                  lookbook this size (~19 looks) makes individual dots
                  unreadable at this scale, so position is shown as a
                  proportional bar plus a "look N of total" count instead —
                  same information, legible at any length. */}
              {count > 1 && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/70 to-transparent"
                />
              )}
              {count > 1 && (
                <div className="absolute inset-x-0 bottom-2 flex flex-col items-center gap-1.5 px-4 sm:bottom-3">
                  <p className="tracked-label text-white/70">
                    {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
                  </p>
                  <div className="h-0.5 w-full max-w-[140px] overflow-hidden rounded-full bg-white/20">
                    <div
                      className="h-full rounded-full bg-white transition-all duration-500 ease-out"
                      style={{ width: `${((index + 1) / count) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <p className="tracked-label mt-6 text-center text-white/40">
            Drag to slide through the collection
          </p>

          {/* CC-BY-4.0 requires crediting the author "wherever you share
              it" — this is the one place the model appears on the site. */}
          <p className="tracked-label mt-1 text-center text-white/25">
            iPad model by{" "}
            <a
              href="https://sketchfab.com/eltayerkebulan"
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring underline decoration-white/20 underline-offset-2 hover:text-white/50"
            >
              eltayerkebulan
            </a>{" "}
            (CC BY 4.0)
          </p>
        </motion.div>
      </div>
    </div>
  );
}
