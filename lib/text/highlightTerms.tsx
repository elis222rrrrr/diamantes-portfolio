import type { ReactNode } from "react";

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Splits `text` on every occurrence of any of `terms` and wraps each match
 * in <strong> font-semibold, leaving the rest as plain text — mirrors the
 * reference copy's own style: proper nouns (the game/character's names) sit
 * bolded inline within an otherwise regular-weight sentence, rather than the
 * whole paragraph carrying one uniform weight. */
export function highlightTerms(text: string, terms: string[]): ReactNode[] {
  const cleanTerms = [...new Set(terms.filter((t) => t.trim().length > 0))];
  if (cleanTerms.length === 0) return [text];
  const pattern = new RegExp(`(${cleanTerms.map(escapeRegExp).join("|")})`, "g");
  return text.split(pattern).map((part, i) =>
    cleanTerms.includes(part) ? (
      <strong key={i} className="font-semibold">
        {part}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}
