"use client";

import { useActionState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import FormError from "@/components/ui/FormError";
import { subscribeToNewsletter } from "@/app/(site)/newsletter/subscribe-actions";

const navigation = [
  { label: "Portfolio", href: "/portfolio" },
  { label: "Shop", href: "/shop" },
  { label: "Track Order", href: "/orders/track" },
  { label: "Studio", href: "/services" },
  { label: "Contact", href: "/contact" },
];

const legal = [
  { label: "Terms & Conditions", href: "/terms-conditions" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Shipping & Returns", href: "/shipping-returns" },
];

const studio = [
  { label: "About Us", href: "/about" },
  { label: "Journal", href: "/journal" },
];

// The Footer's "running code" ticker — decorative, same register as the
// Hero's/ShopHero's own system-status readouts, not a real build log.
// { accent: true } tokens render in the site's one accent color, mirroring
// how "ONLINE"/"OK"-type values get picked out elsewhere on the site.
const tickerTokens: { text: string; accent?: boolean }[] = [
  { text: "> initializing render pipeline... " },
  { text: "OK", accent: true },
  { text: "  > loading assets: 1100/1100  > shader compile: 0.42s  > status: " },
  { text: "nominal", accent: true },
  { text: "  > build: diamantes3designs.core  > uptime: " },
  { text: "stable", accent: true },
  { text: "  " },
];

type Props = {
  instagramUrl: string;
  tiktokUrl: string;
};

export default function Footer({ instagramUrl, tiktokUrl }: Props) {
  const [state, formAction, pending] = useActionState(subscribeToNewsletter, {});

  return (
    <footer className="border-t border-white/10 bg-black px-6 py-16 text-white lg:px-12">
      <div className="mx-auto grid max-w-[var(--content-width)] gap-12 lg:grid-cols-[1.2fr_1fr_1fr_1fr_1.4fr]">
        <div>
          <p className="text-lg font-light">Diamantes Designs</p>
          {/* Plain text, no chip/box and no chrome-gradient-clip effect —
              both read as an unwanted colored box/tint per feedback, so
              this is now the same bare tracked-label treatment the
              Instagram/TikTok links just below already use. */}
          <p className="tracked-label mt-2 text-white/70">Creative Technology Studio</p>
          <p className="mt-2 text-sm text-muted">Based in Greece. Shipping worldwide.</p>

          <div className="mt-8 flex items-center gap-5 text-muted">
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring tracked-label transition hover:text-white"
            >
              Instagram
            </a>
            <a
              href={tiktokUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring tracked-label transition hover:text-white"
            >
              TikTok
            </a>
          </div>
        </div>

        <div>
          <p className="tracked-label mb-5 text-muted">Navigation</p>
          <ul className="flex flex-col gap-3">
            {navigation.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="focus-ring text-sm text-white/60 transition hover:text-white"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="tracked-label mb-5 text-muted">Legal</p>
          <ul className="flex flex-col gap-3">
            {legal.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  className="focus-ring text-sm text-white/60 transition hover:text-white"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="tracked-label mb-5 text-muted">Studio</p>
          <ul className="flex flex-col gap-3">
            {studio.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  className="focus-ring text-sm text-white/60 transition hover:text-white"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="tracked-label mb-5 text-muted">Newsletter</p>
          <p className="mb-5 text-sm leading-relaxed text-muted">
            Stay updated on new arrivals, projects and studio news.
          </p>

          {state.success ? (
            <p role="status" className="text-sm text-white/60">
              You&apos;re subscribed, thank you.
            </p>
          ) : (
            <form action={formAction} className="flex flex-col gap-3">
              <div className="flex items-center gap-4">
                {/* 4×3 dot grid, decorative — matches the reference's own
                    "system readout" flourish, same register as the rest of
                    the site's terminal/HUD styling. */}
                <div className="grid shrink-0 grid-cols-4 gap-1" aria-hidden="true">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <span key={i} className="h-1 w-1 rounded-full bg-white" />
                  ))}
                </div>

                <label htmlFor="footer-newsletter-email" className="sr-only">
                  Email address
                </label>
                <input
                  required
                  id="footer-newsletter-email"
                  type="email"
                  name="email"
                  placeholder="Your email"
                  className="focus-ring min-w-0 flex-1 border-none bg-transparent font-mono text-sm text-white placeholder:text-white/70 focus:outline-none"
                />

                {/* Square-bracket arrow, not a filled pill button — matches
                    the site's own bracket-label convention ([ MENU ],
                    [ 01_CART ] in Nav) better than the reference's rounded
                    parentheses. */}
                <button
                  type="submit"
                  aria-label="Subscribe"
                  disabled={pending}
                  className="focus-ring flex shrink-0 items-center gap-0.5 text-white transition hover:text-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-white"
                >
                  <span aria-hidden="true" className="text-2xl font-light leading-none">
                    [
                  </span>
                  <ArrowRight size={16} />
                  <span aria-hidden="true" className="text-2xl font-light leading-none">
                    ]
                  </span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <span className="tracked-label text-white">Stay updated</span>
                <span className="h-px flex-1 bg-white" />
                <span className="h-1.5 w-1.5 shrink-0 bg-white" />
              </div>

              <FormError error={state.error} />
            </form>
          )}
        </div>
      </div>

      {/* A persistent "running code" strip — see tickerTokens' own comment.
          overflow-hidden clips the two duplicated copies to one line;
          whitespace-nowrap stops them from wrapping onto a second line at
          narrow widths, which would break the -50% loop math. */}
      <div
        aria-hidden="true"
        className="mx-auto mt-16 max-w-[var(--content-width)] overflow-hidden border-t border-white/10 py-4"
      >
        <div
          style={{ "--ticker-copies": 4 } as CSSProperties}
          className="terminal-ticker flex w-max whitespace-nowrap font-mono text-[11px] tracking-[0.05em] text-white/25"
        >
          {[0, 1, 2, 3].map((copy) => (
            <span key={copy}>
              {tickerTokens.map((token, i) =>
                token.accent ? (
                  <span key={i} style={{ color: "var(--focus-ring)" }}>
                    {token.text}
                  </span>
                ) : (
                  <span key={i}>{token.text}</span>
                )
              )}
            </span>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-6 flex max-w-[var(--content-width)] flex-col gap-3 text-xs text-muted lg:flex-row lg:items-center lg:justify-between">
        <p>© {new Date().getFullYear()} Diamantes Designs. All rights reserved.</p>
        <p>Designed & developed by Diamantes Designs</p>
      </div>
    </footer>
  );
}
