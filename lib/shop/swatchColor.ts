// Maps a ProductVariant's free-text color name to an actual swatch color for
// the small circle selectors on the shop detail page. Free text (not an
// enum) because that's how ProductVariant.color is stored — admins type
// whatever they like (e.g. "Matte Black") — so this matches on substrings
// rather than requiring an exact name.
const KNOWN_COLORS: Record<string, string> = {
  silver: "#c7cdd3",
  chrome: "#c7cdd3",
  white: "#f5f5f3",
  ivory: "#f5f0e6",
  black: "#161616",
  charcoal: "#2b2b2d",
  gold: "#d4af6a",
  brass: "#b08d57",
  bronze: "#8c6239",
  copper: "#b56a4a",
  rose: "#e0b3b3",
  maroon: "#7e0011",
  red: "#a83232",
  blue: "#3a5a8c",
  navy: "#1e2a44",
  green: "#3f6b4a",
  gray: "#8a8a8c",
  grey: "#8a8a8c",
  clear: "#eef2f2",
  resin: "#d9c9a3",
};

/** A swatch's own fill needs a light/dark check so the "selected" checkmark
 * drawn over it stays visible either way. */
export function isLightSwatch(hex: string): boolean {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
}

export function swatchColorFor(name: string): string {
  const key = name.trim().toLowerCase();
  if (KNOWN_COLORS[key]) return KNOWN_COLORS[key];
  for (const [needle, hex] of Object.entries(KNOWN_COLORS)) {
    if (key.includes(needle)) return hex;
  }
  // Unrecognized custom color name — a neutral mid-gray rather than
  // guessing wrong.
  return "#9a9a9c";
}
