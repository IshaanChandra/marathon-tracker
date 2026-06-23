import { ImageResponse } from "next/og";

export const alt = "Ishaan Chandra — Road to the 2026 NYC Marathon";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Empire-styled share card. Static facts only (race date, not countdown) so it never goes stale. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px 96px",
          background: "linear-gradient(135deg, #0e1322 0%, #18203a 100%)",
          color: "#e6eaf5",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 32,
            letterSpacing: 6,
            color: "#93b4ff",
            textTransform: "uppercase",
          }}
        >
          Ishaan Chandra
        </div>
        <div style={{ display: "flex", alignItems: "baseline", marginTop: 12 }}>
          <span style={{ fontSize: 150, fontWeight: 800, color: "#ffffff" }}>NYC</span>
          <span style={{ fontSize: 150, fontWeight: 800, color: "#fb923c", marginLeft: 28 }}>
            26.2
          </span>
        </div>
        <div style={{ display: "flex", fontSize: 38, color: "#aab6d6", marginTop: 16 }}>
          Road to the NYC Marathon · Nov 1, 2026 · Goal sub-4:00
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 48,
            width: 720,
            height: 10,
            borderRadius: 5,
            background: "#232c4d",
          }}
        >
          <div
            style={{
              display: "flex",
              width: 280,
              height: 10,
              borderRadius: 5,
              background: "linear-gradient(90deg, #93b4ff, #fb923c)",
            }}
          />
        </div>
      </div>
    ),
    { ...size },
  );
}
