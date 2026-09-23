"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";

type Props = {
  images: { url: string }[];
  alt: string;
  /** An optional video slide (e.g. a Portfolio project's render-animation
   * clip), captioned with `label` under the frame while it's the active
   * slide. Leads the slide order by default — first thing visible on page
   * load — unless `videoFirst` is set false, putting it after `images`
   * instead. */
  video?: { url: string; label: string };
  /** false puts the video slide after `images` rather than before —
   * per-project override for a piece where a still cover shot should be
   * the first thing visible instead of the clip. Defaults to true. */
  videoFirst?: boolean;
  /** A variant's full photo set (e.g. the color currently selected in
   * AddToCartButton) — replaces `images` entirely as the browsable slide
   * set while set. `null`/`undefined`/empty means no color is selected, so
   * the gallery falls back to `images`. */
  overrideImages?: string[] | null;
};

type Slide = { type: "video"; url: string; label: string } | { type: "image"; url: string };

// Minimum drag/swipe distance (px) before it counts as a swipe rather than a
// tap/click — below this, a pointer-up is treated as "click to advance".
const SWIPE_THRESHOLD = 50;
// Minimum time between two wheel-driven slide changes — a single physical
// scroll gesture fires many small wheel events, and without this a light
// flick of the trackpad would blow past several slides at once.
const WHEEL_COOLDOWN_MS = 350;

export default function ProductGallery({
  images,
  alt,
  video,
  overrideImages,
  videoFirst = true,
}: Props) {
  const [active, setActive] = useState(0);
  // Starts square (matches the old fixed frame) and snaps to the real
  // aspect ratio once the active slide loads — the frame itself then fits
  // each slide, rather than forcing every one into a square and
  // letterboxing whatever doesn't match (product photos are square so this
  // is a no-op for Shop; portfolio lookbook panels are often landscape).
  const [aspectRatio, setAspectRatio] = useState(1);

  const overrideKey = overrideImages && overrideImages.length > 0 ? overrideImages.join("|") : null;
  // Jump back to the first slide whenever a *different* color is picked (or
  // the color is cleared), adjusted during render rather than an effect —
  // see https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes.
  const [prevOverrideKey, setPrevOverrideKey] = useState(overrideKey);
  if (overrideKey !== prevOverrideKey) {
    setPrevOverrideKey(overrideKey);
    setActive(0);
  }

  const baseImages = overrideKey ? overrideImages!.map((url) => ({ url })) : images;
  const videoSlide: Slide[] = video
    ? [{ type: "video" as const, url: video.url, label: video.label }]
    : [];
  const imageSlides: Slide[] = baseImages.map((image) => ({
    type: "image" as const,
    url: image.url,
  }));
  const slides: Slide[] = videoFirst
    ? [...videoSlide, ...imageSlides]
    : [...imageSlides, ...videoSlide];

  // Drag/swipe + wheel-scroll navigation — kept as refs rather than state
  // since neither needs to trigger a re-render, just read at the next event.
  const dragStartX = useRef<number | null>(null);
  const didDrag = useRef(false);
  const lastWheelAt = useRef(0);
  // Read by the wheel listener below (attached once per mounted container,
  // so it can't close over a fresh `slides.length` each render) — kept
  // current on every render via a layout effect (mutating a ref directly in
  // the render body itself is flagged as "Cannot access refs during
  // render" — react-hooks/refs), which runs synchronously after render but
  // before paint/event handlers, so it's always up to date by the next
  // wheel event.
  const slideCountRef = useRef(slides.length);
  useLayoutEffect(() => {
    slideCountRef.current = slides.length;
  }, [slides.length]);
  const wheelCleanupRef = useRef<(() => void) | null>(null);

  function goTo(index: number) {
    setActive(((index % slides.length) + slides.length) % slides.length);
  }
  function advance(delta: number) {
    setActive((prev) => {
      const count = slideCountRef.current;
      return (((prev + delta) % count) + count) % count;
    });
  }

  function handlePointerDown(e: React.PointerEvent) {
    dragStartX.current = e.clientX;
    didDrag.current = false;
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function handlePointerMove(e: React.PointerEvent) {
    if (dragStartX.current === null) return;
    if (Math.abs(e.clientX - dragStartX.current) >= SWIPE_THRESHOLD) {
      didDrag.current = true;
    }
  }
  function handlePointerUp(e: React.PointerEvent) {
    if (dragStartX.current === null) return;
    const delta = e.clientX - dragStartX.current;
    dragStartX.current = null;
    if (Math.abs(delta) >= SWIPE_THRESHOLD) {
      advance(delta < 0 ? 1 : -1);
      return;
    }
    // Not a swipe — a tap/click on the image itself, which browses forward
    // as an explicit alternative to swiping or scrolling.
    if (!didDrag.current) advance(1);
  }

  // A native (non-passive) listener, not React's onWheel — React attaches
  // wheel handlers as passive by default, which silently ignores
  // preventDefault() and lets the page scroll underneath the gallery at the
  // same time the slide changes. Only a real DOM listener with
  // { passive: false } can actually stop that.
  //
  // Attached via a callback ref rather than useEffect(..., []): this
  // product's `images` prop starts out empty (its photos live entirely on
  // the color variant, filled in a moment later by AddToCartButton's own
  // effect), so the very first render takes the "no slides yet" branch
  // below with no container div at all. A mount-effect would run once
  // against that still-null ref and never fire again once the real
  // container appears on the next render. A callback ref instead fires
  // exactly when a container actually mounts, no matter which render that
  // happens on.
  const setContainerRef = useCallback((el: HTMLDivElement | null) => {
    wheelCleanupRef.current?.();
    wheelCleanupRef.current = null;
    if (!el) return;
    function onWheel(e: WheelEvent) {
      if (slideCountRef.current < 2) return;
      // Prioritize genuinely vertical scroll intent over a trackpad's
      // incidental horizontal jitter, but respond to either axis — this is
      // a "scroll to change angle" gallery, not a fixed-axis slider.
      const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (Math.abs(delta) < 12) return;
      e.preventDefault();
      const now = Date.now();
      if (now - lastWheelAt.current < WHEEL_COOLDOWN_MS) return;
      lastWheelAt.current = now;
      advance(delta > 0 ? 1 : -1);
    }
    el.addEventListener("wheel", onWheel, { passive: false });
    wheelCleanupRef.current = () => el.removeEventListener("wheel", onWheel);
  }, []);

  if (slides.length === 0) {
    return <div className="relative aspect-square w-full" />;
  }

  const activeSlide = slides[active] ?? slides[0];

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={setContainerRef}
        className="relative w-full touch-pan-y select-none"
        style={{ aspectRatio }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div className="relative h-full w-full">
          {activeSlide.type === "video" ? (
            <video
              key={activeSlide.url}
              src={activeSlide.url}
              // autoPlay+loop turns this into a self-playing clip instead of a
              // static frame that needs a manual click to see move. muted is
              // required by every browser for autoplay to be allowed at all;
              // playsInline stops iOS Safari from hijacking it into
              // fullscreen.
              autoPlay
              loop
              muted
              playsInline
              controls
              className="h-full w-full object-contain"
              onLoadedMetadata={(e) => {
                const el = e.currentTarget;
                if (el.videoWidth && el.videoHeight) {
                  setAspectRatio(el.videoWidth / el.videoHeight);
                }
              }}
            />
          ) : (
            <Image
              key={activeSlide.url}
              src={activeSlide.url}
              alt={alt}
              fill
              className="pointer-events-none object-contain"
              sizes="(min-width: 1024px) 50vw, 100vw"
              quality={90}
              priority
              onLoad={(e) => {
                const img = e.currentTarget;
                if (img.naturalWidth && img.naturalHeight) {
                  setAspectRatio(img.naturalWidth / img.naturalHeight);
                }
              }}
            />
          )}
        </div>

        {slides.length > 1 && (
          // No card/box behind these — just the images themselves, sitting
          // directly on the page like the main render. A pale product photo
          // (this studio's silver/white pieces especially) can fade to
          // nearly nothing against a light page at low opacity, so the
          // active one is marked with a thin underline rather than leaning
          // on opacity contrast alone; no dot/counter row either. Scrolls on
          // its own when there are more thumbnails than fit. Pointer events
          // are stopped from bubbling so a thumbnail tap doesn't also
          // register as a click-to-advance on the main image underneath.
          <div
            className="absolute inset-y-0 right-0 flex max-w-16 flex-col items-center justify-center gap-3 overflow-y-auto py-3 sm:max-w-20"
            onPointerDown={(e) => e.stopPropagation()}
            onPointerMove={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
          >
            {slides.map((slide, index) => (
              <button
                key={slide.url + index}
                type="button"
                onClick={() => goTo(index)}
                aria-label={
                  slide.type === "video" ? `Play ${slide.label}` : `View image ${index + 1}`
                }
                aria-current={index === active}
                className={`focus-ring group flex shrink-0 flex-col items-center gap-1.5`}
              >
                <span
                  className={`relative h-12 w-12 transition sm:h-16 sm:w-16 ${
                    index === active ? "opacity-100" : "opacity-60 group-hover:opacity-90"
                  }`}
                >
                  {slide.type === "video" ? (
                    <span className="flex h-full w-full items-center justify-center text-neutral-500">
                      <Play size={16} fill="currentColor" />
                    </span>
                  ) : (
                    <Image src={slide.url} alt="" fill className="object-contain" sizes="64px" />
                  )}
                </span>
                <span
                  className={`h-px w-5 rounded-full transition ${
                    index === active ? "bg-black/70" : "bg-transparent"
                  }`}
                  aria-hidden
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {activeSlide.type === "video" && (
        <p className="tracked-label text-neutral-500">{activeSlide.label}</p>
      )}
    </div>
  );
}
