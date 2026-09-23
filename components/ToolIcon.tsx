import type { ToolId } from "@/lib/portfolio/tools";
import { TOOL_LABELS } from "@/lib/portfolio/tools";

// Brand-colored monogram badges, not full logo reproductions — precisely
// redrawing each app's actual trademarked mark (Blender's pinwheel icon,
// Rhino's rhino-head glyph) risked looking like a crude knockoff at this
// size, and carries more trademark exposure than a simple, honest "software
// used" badge needs to. Photoshop's is the real mark either way (its icon
// *is* the "Ps" monogram + blue gradient), so that one reads as fully
// authentic; the rest use each brand's real color with an initial, in the
// same spirit as the tasteful-monogram convention lots of "built with"
// strips use.
const TOOL_STYLE: Record<ToolId, { bg: string; mark: string; fontSize: number }> = {
  blender: { bg: "#EA7600", mark: "B", fontSize: 18 },
  rhino: { bg: "#0B0B0B", mark: "R", fontSize: 18 },
  clo3d: { bg: "#1A1A1A", mark: "CLO", fontSize: 11 },
  photoshop: { bg: "url(#d3d-ps-gradient)", mark: "Ps", fontSize: 15 },
};

type Props = {
  tool: ToolId;
  size?: number;
};

/** A single small square "software used" badge — see TOOL_STYLE above for
 * why these are brand-colored monograms rather than full logo redraws.
 * Rendered from PortfolioProject.tools (lib/portfolio/tools.ts) on the
 * Portfolio detail page. */
export default function ToolIcon({ tool, size = 36 }: Props) {
  const { bg, mark, fontSize } = TOOL_STYLE[tool];
  const label = TOOL_LABELS[tool];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      role="img"
      aria-label={label}
      className="shrink-0"
    >
      <title>{label}</title>
      {tool === "photoshop" && (
        <defs>
          <linearGradient id="d3d-ps-gradient" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#001E36" />
            <stop offset="1" stopColor="#31A8FF" />
          </linearGradient>
        </defs>
      )}
      <rect width="36" height="36" rx="8" fill={bg} />
      <text
        x="18"
        y="18"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={fontSize}
        fontWeight={600}
        fontFamily="var(--font-sans), Arial, Helvetica, sans-serif"
        fill="#ffffff"
        letterSpacing="0.02em"
      >
        {mark}
      </text>
    </svg>
  );
}
