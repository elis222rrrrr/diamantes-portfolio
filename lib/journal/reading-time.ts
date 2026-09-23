const WORDS_PER_MINUTE = 200;

/** Strips HTML tags down to plain text — good enough for a word count, not for display. */
function stripHtml(html: string): string {
  return html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Estimated reading time in whole minutes (minimum 1) from an article's HTML content. */
export function estimateReadingMinutes(html: string): number {
  const text = stripHtml(html);
  if (!text) return 1;
  const words = text.split(" ").filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

/** "3 min read" — the label every article card/detail page actually displays. */
export function formatReadingTime(html: string): string {
  const minutes = estimateReadingMinutes(html);
  return `${minutes} min read`;
}
