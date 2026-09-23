import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export const size = { width: 48, height: 48 };
export const contentType = "image/png";

/** The browser-tab favicon — the same logo-mark.png used in Nav.tsx, centered
 * on a square black canvas (the mark itself is tall/narrow — 238×483 — so it
 * can't just be dropped in as-is without distortion at favicon sizes). A
 * generated icon (rather than a static favicon.ico) is what lets this reuse
 * the actual PNG asset instead of hand-producing a separate square icon
 * file. */
export default function Icon() {
  const logo = readFileSync(join(process.cwd(), "public/logo-mark.png"));
  const logoDataUrl = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#000000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse (satori) renders its own <img>, not next/image */}
      <img src={logoDataUrl} alt="" height="88%" style={{ objectFit: "contain" }} />
    </div>,
    { ...size }
  );
}
