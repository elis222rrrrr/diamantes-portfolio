import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // 10%, not 100%: every page view was sending a full trace, which eats
  // the free plan's monthly span quota for no extra insight at this traffic.
  tracesSampleRate: 0.1,
  // Visitors whose browser can't start WebGL (no GPU, GPU blocklisted, too
  // many contexts on iOS Safari) just don't see the 3D model — the page
  // itself still works. This one message was ~950 events a week, most of
  // the free error quota, which would crowd out real errors.
  ignoreErrors: ["Error creating WebGL context"],
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
