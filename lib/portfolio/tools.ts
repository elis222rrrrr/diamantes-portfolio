// The fixed set of "software used" badges a Portfolio project can show (see
// PortfolioProject.tools in prisma/schema.prisma) — deliberately a closed
// list, not free text, so every id always maps to a real icon in
// components/ToolIcon.tsx. Add a new tool by extending both files together.
export const TOOL_IDS = ["blender", "rhino", "clo3d", "photoshop"] as const;

export type ToolId = (typeof TOOL_IDS)[number];

export function isToolId(value: string): value is ToolId {
  return (TOOL_IDS as readonly string[]).includes(value);
}

export const TOOL_LABELS: Record<ToolId, string> = {
  blender: "Blender",
  rhino: "Rhino",
  clo3d: "CLO3D",
  photoshop: "Adobe Photoshop",
};
