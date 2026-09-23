"use client";

import { useEffect, useState } from "react";

/**
 * Returns a key that changes exactly once per genuine browser
 * back/forward-cache (bfcache) restore — not on ordinary resizes or React
 * re-renders. Use it as a `key` prop on a <Canvas> to force a full
 * unmount/remount when that happens.
 *
 * Why this is needed at all: the in-app "back to portfolio" link is a normal
 * Next.js client navigation, which correctly re-runs our size/radius-guarded
 * camera-fit effect (see ProjectCardModelPreview/PortfolioModelViewer). The
 * browser's own back/forward buttons are different — Chrome/Firefox can
 * restore the entire previous page, DOM and all, from a frozen snapshot
 * (bfcache) without re-running any React effects or firing a resize
 * observer callback, since from the browser's point of view nothing about
 * the viewport changed. The WebGL canvas/camera state is whatever it was
 * the instant the page was frozen, which is exactly the huge/laggy state
 * this was meant to fix — and nothing in our normal render/effect cycle
 * ever gets a chance to correct it. `pageshow`'s `persisted` flag is the
 * standard, purpose-built signal for detecting this one specific case.
 */
export function useBfcacheRemountKey() {
  const [key, setKey] = useState(0);
  useEffect(() => {
    function onPageShow(event: PageTransitionEvent) {
      if (event.persisted) {
        setKey((k) => k + 1);
      }
    }
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);
  return key;
}
