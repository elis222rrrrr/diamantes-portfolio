"use client";

import dynamic from "next/dynamic";

// `ssr: false` is only allowed inside a Client Component (Next.js docs:
// app/02-guides/lazy-loading.md) — this wrapper exists so the Server
// Component page can import a plain component instead of calling
// next/dynamic itself.
const PortfolioModelViewer = dynamic(() => import("@/components/PortfolioModelViewer"), {
  ssr: false,
});

export default PortfolioModelViewer;
