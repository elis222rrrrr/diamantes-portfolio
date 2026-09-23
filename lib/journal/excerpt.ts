const EXCERPT_LENGTH = 160;

/** Strips HTML tags down to plain text. */
function stripHtml(html: string): string {
  return html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Truncates plain text to a whole-word boundary at or before `maxLength`, appending "…". */
function truncateAtWord(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/** The manual `excerpt` if the admin set one, otherwise auto-derived from the start of `content`. */
export function getExcerpt(content: string, manualExcerpt?: string | null): string {
  if (manualExcerpt && manualExcerpt.trim() !== "") return manualExcerpt.trim();
  return truncateAtWord(stripHtml(content), EXCERPT_LENGTH);
}
