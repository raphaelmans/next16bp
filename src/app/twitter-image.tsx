import { ImageResponse } from "next/og";
import { OG_BRAND, OG_GRADIENTS } from "@/common/og-brand";

// Twitter/X Image metadata - 1200x630 for summary_large_image card
export const alt =
  "KudosCourts - Court discovery + free reservation system for venues.";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

// Twitter Image generation - Optimized for Twitter/X cards
export default function TwitterImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        background: OG_GRADIENTS.tealBg,
        fontFamily: "system-ui, sans-serif",
        padding: "60px 80px",
      }}
    >
      {/* Left side - Text content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          flex: 1,
        }}
      >
        {/* Brand name */}
        <div
          style={{
            fontSize: "64px",
            fontWeight: 800,
            color: "white",
            letterSpacing: "-2px",
            marginBottom: "16px",
          }}
        >
          KUDOSCOURTS
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: "32px",
            fontWeight: 600,
            color: "rgba(255,255,255,0.95)",
            marginBottom: "24px",
          }}
        >
          Discover. Reserve. Play.
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: "22px",
            color: "rgba(255,255,255,0.85)",
            maxWidth: "500px",
            lineHeight: 1.5,
          }}
        >
          Find sports courts in the Philippines and reserve time faster. Free
          reservation system for venues.
        </div>

        {/* CTA hint */}
        <div
          style={{
            marginTop: "32px",
            padding: "12px 24px",
            background: OG_GRADIENTS.accentBar,
            borderRadius: "8px",
            fontSize: "18px",
            fontWeight: 600,
            color: "white",
          }}
        >
          List your venue — Free
        </div>
      </div>

      {/* Right side - Logo/Court */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginLeft: "40px",
        }}
      >
        <div
          style={{
            width: "280px",
            height: "280px",
            borderRadius: "64px",
            overflow: "hidden",
            boxShadow: "0 18px 50px rgba(0,0,0,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
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
      </div>

      {/* Bottom accent bar */}
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
    {
      ...size,
    },
  );
}
