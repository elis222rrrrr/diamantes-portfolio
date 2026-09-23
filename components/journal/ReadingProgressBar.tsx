"use client";

import { useEffect, useRef } from "react";

/** A fixed top-of-viewport bar (styled via .journal-progress-bar in
 * globals.css) that fills as the reader scrolls through the article body.
 * Reads/writes a CSS variable directly on scroll rather than React state, so
 * a fast scroll doesn't trigger a re-render on every frame. */
export default function ReadingProgressBar() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function updateProgress() {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
      barRef.current?.style.setProperty(
        "--journal-progress",
        String(Math.min(1, Math.max(0, progress)))
      );
    }

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, []);

  return <div ref={barRef} className="journal-progress-bar" aria-hidden="true" />;
}
