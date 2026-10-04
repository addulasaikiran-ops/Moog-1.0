import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Moog 1.0 — Private Temporary Sharing";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "#0a0a0b",
          color: "#f2efe8",
          fontFamily: "Arial",
        }}
      >
        <div style={{ display: "flex", fontSize: 34, letterSpacing: "-1px" }}>
          moog
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", fontSize: 64, fontWeight: 600, letterSpacing: "-3px" }}>
            Private temporary sharing.
          </div>
          <div style={{ display: "flex", fontSize: 28, color: "#aaa6a0" }}>
            Text, code, and photos. Expiring links. No account required.
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 20, color: "#77736e" }}>
          MOOG 1.0
        </div>
      </div>
    ),
    { ...size },
  );
}
