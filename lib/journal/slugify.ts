/** Turns a title/name into a URL-safe slug — lowercase, alphanumeric, single hyphens. */
export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip accents (e.g. "café" -> "cafe")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
