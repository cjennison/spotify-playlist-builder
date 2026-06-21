import { ImageResponse } from "next/og";
import { DISC_SVG, svgDataUri, SITE_NAME } from "@/lib/brand";

export const alt = "Blendlist — AI-curated Spotify playlists that blend tastes";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          color: "#f3f5f7",
          backgroundColor: "#0e1117",
          backgroundImage:
            "linear-gradient(135deg, rgba(29,185,84,0.30), rgba(14,17,23,0) 55%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 22,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundImage: "linear-gradient(135deg, #4bd680, #0a8d3b)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img width={70} height={70} src={svgDataUri(DISC_SVG)} alt="" />
          </div>
          <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: -1 }}>
            {SITE_NAME}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              fontSize: 76,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -2,
              maxWidth: 900,
            }}
          >
            <span style={{ marginRight: 18 }}>Two libraries.</span>
            <span style={{ color: "#4bd680" }}>One perfect playlist.</span>
          </div>
          <div style={{ fontSize: 30, color: "#99a1b0", maxWidth: 820 }}>
            AI blends the artists two or more people love into one Spotify
            playlist.
          </div>
        </div>

        <div style={{ display: "flex", gap: 14, fontSize: 24, color: "#cdd2db" }}>
          <span
            style={{
              padding: "8px 18px",
              borderRadius: 999,
              border: "1px solid #2a2f3a",
            }}
          >
            Music-theory blends
          </span>
          <span
            style={{
              padding: "8px 18px",
              borderRadius: 999,
              border: "1px solid #2a2f3a",
            }}
          >
            Shared discoveries
          </span>
          <span
            style={{
              padding: "8px 18px",
              borderRadius: 999,
              border: "1px solid #2a2f3a",
            }}
          >
            One-click to Spotify
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
