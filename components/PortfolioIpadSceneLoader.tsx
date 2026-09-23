"use client";

import dynamic from "next/dynamic";

// `ssr: false` is only allowed inside a Client Component (Next.js docs:
// app/02-guides/lazy-loading.md) — this wrapper exists so PortfolioHero
// (also a Client Component, but one next/dynamic itself would still need
// this same indirection for) gets a plain component to render.
const IpadHeroScene = dynamic(() => import("@/components/three/IpadHeroScene"), {
  ssr: false,
});

export default IpadHeroScene;
