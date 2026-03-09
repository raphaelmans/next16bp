import { ImageResponse } from "next/og";
import { OG_BRAND, OG_GRADIENTS } from "@/common/og-brand";

export const alt =
  "KudosCourts — Discover sports courts across the Philippines";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: OG_GRADIENTS.tealBg,
        fontFamily: "system-ui, sans-serif",
        color: "white",
        textAlign: "center",
        padding: "0 80px",
        position: "relative",
      }}
    >
      {/* Brand mark */}
      <div
        style={{
          width: "100px",
          height: "100px",
          borderRadius: "28px",
          overflow: "hidden",
          boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
          display: "flex",
          marginBottom: "32px",
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 375 375"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <rect width="375" height="375" fill={OG_BRAND.teal} />
          <g
            fill={OG_BRAND.background}
            transform="translate(99.06738 280.162856)"
          >
            <path d="M 124.1875 0 L 52.4375 -92.328125 L 121.921875 -177.125 L 170.59375 -177.125 L 92.328125 -85.046875 L 92.328125 -101.109375 L 173.109375 0 Z M 17.0625 0 L 17.0625 -177.125 L 56.453125 -177.125 L 56.453125 0 Z M 17.0625 0 " />
          </g>
        </svg>
      </div>

      {/* Headline */}
      <div
        style={{
          fontSize: "72px",
          fontWeight: 800,
          letterSpacing: "-2px",
          lineHeight: 1.1,
          marginBottom: "20px",
        }}
      >
        One platform. Every court.
      </div>

      {/* Subtitle */}
      <div
        style={{
          fontSize: "30px",
          fontWeight: 500,
          color: "rgba(255,255,255,0.85)",
          maxWidth: "700px",
        }}
      >
        Discover sports courts across the Philippines
      </div>

      {/* Domain */}
      <div
        style={{
          position: "absolute",
          bottom: "28px",
          display: "flex",
          fontSize: "22px",
          fontWeight: 600,
          color: "rgba(255,255,255,0.6)",
          letterSpacing: "0.05em",
        }}
      >
        kudoscourts.ph
      </div>

      {/* Accent bar */}
      <div
        style={{
          position: "absolute",
          bottom: "0",
          left: "0",
          right: "0",
          height: "6px",
          background: OG_GRADIENTS.accentBar,
        }}
      />
    </div>,
    { ...size },
  );
}
