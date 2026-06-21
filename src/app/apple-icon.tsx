import { ImageResponse } from "next/og";
import { DISC_SVG, svgDataUri } from "@/lib/brand";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundImage: "linear-gradient(135deg, #4bd680, #0a8d3b)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img width={132} height={132} src={svgDataUri(DISC_SVG)} alt="" />
      </div>
    ),
    { ...size }
  );
}
