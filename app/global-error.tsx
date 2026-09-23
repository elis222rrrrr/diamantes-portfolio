"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black px-6 text-center text-white">
        <p className="text-xs uppercase tracking-[0.35em] text-white/40">Error</p>
        <h1 className="text-2xl font-light">Something went wrong</h1>
        <p className="max-w-sm text-sm text-white/50">
          Please try again. If the problem continues, get in touch.
        </p>
        {/* This replaces the root layout entirely when it renders, so it
            never gets globals.css (imported only in app/layout.tsx) — no
            var(--foreground)/text-foreground here, just compiled Tailwind
            utilities, same corner-bracket shape as BracketButton/
            CartActionButton elsewhere but self-contained. */}
        <button
          type="button"
          onClick={() => reset()}
          className="relative mt-4 px-6 py-3 text-xs uppercase tracking-[0.2em] text-white/70 transition hover:text-white"
        >
          <span
            aria-hidden
            className="absolute left-0 top-0 h-3 w-3 border-l-2 border-t-2 border-current"
          />
          <span
            aria-hidden
            className="absolute right-0 top-0 h-3 w-3 border-r-2 border-t-2 border-current"
          />
          <span
            aria-hidden
            className="absolute bottom-0 left-0 h-3 w-3 border-b-2 border-l-2 border-current"
          />
          <span
            aria-hidden
            className="absolute bottom-0 right-0 h-3 w-3 border-b-2 border-r-2 border-current"
          />
          Try again
        </button>
      </body>
    </html>
  );
}
