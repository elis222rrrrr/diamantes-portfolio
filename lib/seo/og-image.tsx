import { ImageResponse } from "next/og";

export const ogImageSize = {
  width: 1200,
  height: 630,
};

export const ogImageContentType = "image/png";

export function buildOgImage(title: string, tagline?: string) {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#000000",
        color: "#ffffff",
      }}
    >
      <div
        style={{
          fontSize: 24,
          letterSpacing: 12,
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.4)",
          marginBottom: 32,
          display: "flex",
        }}
      >
        Diamantes 3Designs
      </div>
      <div
        style={{
          fontSize: 96,
          fontWeight: 300,
          lineHeight: 1,
          textAlign: "center",
          display: "flex",
        }}
      >
        {title}
      </div>
      {tagline && (
        <div
          style={{
            fontSize: 22,
            marginTop: 32,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.5)",
            display: "flex",
          }}
        >
          {tagline}
        </div>
      )}
    </div>,
    { ...ogImageSize }
  );
}
