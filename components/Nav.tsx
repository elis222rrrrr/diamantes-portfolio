"use client";

import { useRef, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useCart } from "@/lib/cart/CartContext";
import ThemeToggle from "./ThemeToggle";

// Shown in the desktop bar row — the shorter, most-browsed set. Contact is
// still reachable, just from the fullscreen menu below. Numbered/bracketed
// "system nav" style (matching the Shop hero's own terminal aesthetic) — n
// is the index label (01_, 02_, ...), not a route.
const barLinks = [
  { label: "PORTFOLIO", href: "/portfolio", n: "01" },
  { label: "SHOP", href: "/shop", n: "02" },
  { label: "STUDIO", href: "/services", n: "03" },
];

// Shown in the fullscreen menu overlay only — the complete set, including
// HOME (redundant in the bar row itself, since the logo already links home)
// and the one link dropped from the bar row above. Memberships removed
// (per feedback) — no functional membership feature exists behind it.
const menuLinks = [
  { label: "HOME", href: "/" },
  ...barLinks,
  { label: "CONTACT", href: "/contact" },
];

const studioLinks = [
  { label: "About Us", href: "/about" },
  { label: "Journal", href: "/journal" },
];

const legalLinks = [
  { label: "Terms & Conditions", href: "/terms-conditions" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Shipping & Returns", href: "/shipping-returns" },
];

export default function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const { itemCount } = useCart();
  const pathname = usePathname();

  useFocusTrap(menuOpen, overlayRef, closeMenu);

  return (
    <header className="relative z-50 w-full bg-black text-white">
      <div className="grid grid-cols-3 items-center py-6">
        <span aria-hidden />
        <Link
          href="/"
          aria-label="Diamantes 3Designs home"
          className="focus-ring justify-self-center"
        >
          <span
            aria-hidden="true"
            className="chrome-logo-mark inline-block"
            style={{ width: 40, height: 81 }}
          />
        </Link>
        <div className="justify-self-end px-6">
          <ThemeToggle />
        </div>
      </div>

      {/* Phone only: condensed bar — full width, not capped to
          --content-width, so its top/bottom border and the divider
          between the two buttons reach the actual screen edge instead of
          stopping short on any viewport wider than the site's normal
          content column. Bracketed/numbered "system nav" text instead of
          icons, matching the Shop hero's terminal aesthetic — still
          bg-black/text-white (this site's own toggle-aware tokens), not
          the reference's hardcoded black.

          Switches at md (768px), not lg (1024px): plenty of real laptops
          — especially with Windows display scaling above 100%, common for
          readability — end up with an effective CSS viewport under
          1024px, which left them stuck on this phone-only bar despite
          being a full laptop screen. md still reliably excludes actual
          phones (virtually all phone viewports are under 768px in
          portrait) while including any laptop/tablet-landscape width. */}
      <nav className="flex items-center justify-between divide-x divide-white/10 border-y border-white/10 font-mono text-[11px] tracking-[0.15em] md:hidden">
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={menuOpen}
          aria-label="Open menu"
          className="focus-ring flex flex-1 items-center justify-center py-5 text-white/70 transition hover:text-white"
        >
          [ MENU ]
        </button>

        <Link
          href="/cart"
          aria-label={`View bag${itemCount > 0 ? `, ${itemCount} item${itemCount === 1 ? "" : "s"}` : ""}`}
          className="focus-ring flex flex-1 items-center justify-center py-5 text-white/70 transition hover:text-white"
        >
          [ {itemCount}_CART ]
        </Link>
      </nav>

      {/* Laptop and up (md, 768px+): full row — same full-bleed reasoning
          as the phone bar above, so its column dividers and top/bottom
          border reach the real screen edge on wide viewports instead of
          stopping at --content-width with blank margin flanking them. The
          current page's link gets a bracketed border box (matching the
          reference's "[03_SHOP]"); the others stay plain numbered text. */}
      <nav className="hidden grid-cols-5 divide-x divide-white/10 border-y border-white/10 font-mono text-xs tracking-[0.15em] md:grid">
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={menuOpen}
          aria-label="Open menu"
          className="focus-ring flex items-center justify-center py-5 text-white/70 transition hover:text-white"
        >
          [ MENU ]
        </button>

        {barLinks.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className="focus-ring flex items-center justify-center py-5 text-white/70 transition hover:text-white"
            >
              {active ? (
                <span style={{ color: "var(--focus-ring)" }}>
                  [ {item.n}_{item.label} ]
                </span>
              ) : (
                `${item.n}_${item.label}`
              )}
            </Link>
          );
        })}

        <Link
          href="/cart"
          aria-label={`View bag${itemCount > 0 ? `, ${itemCount} item${itemCount === 1 ? "" : "s"}` : ""}`}
          className="focus-ring flex items-center justify-center py-5 text-white/70 transition hover:text-white"
        >
          [ {itemCount}_CART ]
        </Link>
      </nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            ref={overlayRef}
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-[60] flex flex-col overflow-y-auto bg-black text-white"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-6 lg:px-12">
              <span className="tracked-label text-white/50">Diamantes 3Designs</span>
              <button
                type="button"
                onClick={closeMenu}
                aria-label="Close menu"
                className="focus-ring text-white/70 transition hover:text-white"
              >
                <X size={22} />
              </button>
            </div>

            <div className="grid flex-1 grid-cols-1 gap-12 px-6 py-12 lg:grid-cols-3 lg:px-12">
              <div>
                <p className="tracked-label mb-6 text-white/50">Navigation</p>
                <ul className="flex flex-col gap-4">
                  {menuLinks.map((item) => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        onClick={closeMenu}
                        className="focus-ring text-2xl font-light uppercase tracking-wide text-white/80 transition hover:text-white"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="tracked-label mb-6 text-white/50">Studio</p>
                <ul className="flex flex-col gap-4">
                  {studioLinks.map((item) => (
                    <li key={item.label}>
                      <a
                        href={item.href}
                        className="focus-ring text-lg text-white/60 transition hover:text-white"
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="tracked-label mb-6 text-white/50">Legal</p>
                <ul className="flex flex-col gap-4">
                  {legalLinks.map((item) => (
                    <li key={item.label}>
                      <a
                        href={item.href}
                        className="focus-ring text-lg text-white/60 transition hover:text-white"
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
