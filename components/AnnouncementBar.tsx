import type { CSSProperties } from "react";
import Link from "next/link";

// Same scrolling-ticker technique as the Footer's "running code" strip
// (see Footer.tsx's tickerTokens comment and .terminal-ticker in
// globals.css), reused here for a promo message instead of the system-
// status readout. { accent: true } tokens render in the site's one
// accent color.
const announcementTokens: { text: string; accent?: boolean }[] = [
  { text: "NEW DROP AVAILABLE", accent: true },
  { text: "  > now live in the shop  > " },
  { text: "WORLDWIDE SHIPPING", accent: true },
  { text: "  > designer accessories, made in Greece  > " },
];

export default function AnnouncementBar() {
  return (
    <Link
      href="/shop"
      className="focus-ring block w-full overflow-hidden border-b border-white/10 bg-black py-2 text-white"
    >
      <span className="sr-only">New drop available, now live in the shop. Worldwide shipping.</span>
      <div
        aria-hidden="true"
        style={{ "--ticker-copies": 8 } as CSSProperties}
        className="terminal-ticker flex w-max whitespace-nowrap font-mono text-[11px] tracking-[0.05em] text-white/60"
      >
        {[0, 1, 2, 3, 4, 5, 6, 7].map((copy) => (
          <span key={copy} className="inline-flex flex-none">
            {announcementTokens.map((token, i) =>
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
    </Link>
  );
}
