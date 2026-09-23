import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// Nonce-based CSP would require every page to render dynamically (no static
// generation/PPR), which would work against the marketing pages' own
// performance goals — so this is a static policy without nonces. That means
// script-src needs 'unsafe-inline' for Next's own hydration; everything else
// (object-src, frame-ancestors, base-uri, connect-src, img-src) is still
// meaningfully restricted to known origins.
//
// 'unsafe-eval' is added to script-src only outside production: React's dev
// mode uses eval() for Fast Refresh/stack-trace reconstruction (confirmed via
// the browser console during testing — Next's dev error overlay itself
// tripped on this before the isDev check was added). "React will never use
// eval() in production mode" per React's own warning, so prod stays strict.
const isDev = process.env.NODE_ENV !== "production";
// Google Analytics (GA4) additions: gtag.js is loaded from googletagmanager.com
// and reports back to google-analytics.com — only reached at all once a
// visitor accepts the cookie-consent banner (components/CookieConsent.tsx,
// components/GoogleAnalytics.tsx), but the CSP has to allow the origins
// regardless of that runtime check.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://www.googletagmanager.com${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  // blob: is for the Journal admin's crop-before-upload flow
  // (components/journal/FeaturedImageEditor.tsx) — the picked file is shown
  // via URL.createObjectURL() before it's ever uploaded anywhere.
  "img-src 'self' data: blob: https://res.cloudinary.com https://www.google-analytics.com",
  // Portfolio project detail pages can embed a short <video> clip
  // (components/PortfolioVideo — Cloudinary-hosted); media-src isn't
  // covered by img-src, and falls back to default-src (blocking it) if
  // left unset.
  "media-src 'self' https://res.cloudinary.com",
  "font-src 'self'",
  // blob: is for three.js's GLTFLoader, which fetches embedded glb textures
  // (e.g. PortfolioModelViewer's ceo-assistant-robot.glb) via an internally
  // created blob: URL rather than a direct data: URI.
  "connect-src 'self' blob: https://*.ingest.de.sentry.io https://*.sentry.io https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // Off because React's dev-only double-mount (mount→unmount→remount, to
  // surface impure effects) corrupts WebGL context creation in the Hero's
  // <Canvas> (components/HeroModel.tsx) — confirmed via a real browser: dev
  // mode fetched the model 4 times and hit "THREE.WebGLRenderer: Context
  // Lost", while an identical production build fetched it twice and
  // rendered correctly. Production behavior is unaffected either way, since
  // Strict Mode's extra checks never run there regardless of this setting.
  reactStrictMode: false,
  // Minimal, self-contained production output for the Docker image — only
  // the files actually needed at runtime, not the full node_modules tree.
  // Vercel sets its own VERCEL env var during build (not just at runtime);
  // skip "standalone" there, since it's a self-hosting-only setting and
  // Vercel's docs explicitly warn it can cause files that a serverless
  // function reads at runtime (e.g. app/icon.tsx's readFileSync of
  // public/logo-mark.png) to go missing from that function's bundle —
  // confirmed directly: the icon route returned an empty 200 in
  // production but worked fine locally, where this never applied.
  output: process.env.VERCEL ? undefined : "standalone",
  images: {
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
    // Next 16 requires an explicit allowlist (default is [75] only) — 90 is
    // used by ProjectGrid/ProductGallery for fine-detail photography (e.g.
    // the Portfolio's circuit-pattern renders), where 75 introduced visible
    // compression artifacts.
    qualities: [75, 90],
  },
  experimental: {
    serverActions: {
      // Default is 1MB; raised for the contact form's file attachment.
      // The app-level file-size check is tighter (8MB) since this limit
      // covers the raw multipart body, not just the file bytes.
      bodySizeLimit: "10mb",
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      // public/models/*.glb (and the baked env cubemap PNGs beside them) are
      // static build assets checked into the repo, never admin-editable at
      // runtime (unlike Cloudinary-hosted media) — Next's default static
      // file serving otherwise sends `Cache-Control: public, max-age=0` for
      // everything under /public, forcing a revalidation round-trip on
      // every single visit to a 3D-model page even though the file at this
      // exact URL never changes. If a model ever needs to change, change
      // its filename (as this session's iPad swap did) so it gets a new
      // URL instead of invalidating this cache.
      {
        source: "/models/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
  // The shop used to live at /drops — permanent redirects keep any existing
  // bookmarks/links/search-engine results working after the rename to /shop.
  async redirects() {
    return [
      { source: "/drops", destination: "/shop", permanent: true },
      { source: "/drops/:slug", destination: "/shop/:slug", permanent: true },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: "diamantes3designs",
  // No SENTRY_AUTH_TOKEN is configured yet, so source-map upload is skipped —
  // error tracking/tracing still works via the DSN alone; add an auth token
  // later (from sentry.io/settings/auth-tokens) to enable readable stack
  // traces in the Sentry dashboard.
  silent: true,
});
