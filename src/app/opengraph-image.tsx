import { ImageResponse } from "next/og";

// OG Image metadata - 1200x630 is the standard for Facebook/LinkedIn
export const alt = "KudosCourts - Discover. Reserve. Play.";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

// OG Image generation
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
        background: "linear-gradient(135deg, #0F766E 0%, #0D9488 100%)",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            width: "120px",
            height: "120px",
            borderRadius: "28px",
            overflow: "hidden",
            boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
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
          >
            <title>KudosCourts</title>
            <rect width="375" height="375" fill="#0d9488" />
            <g fill="#fafaf9" transform="translate(99.06738 280.162856)">
              <path d="M 124.1875 0 L 52.4375 -92.328125 L 121.921875 -177.125 L 170.59375 -177.125 L 92.328125 -85.046875 L 92.328125 -101.109375 L 173.109375 0 Z M 17.0625 0 L 17.0625 -177.125 L 56.453125 -177.125 L 56.453125 0 Z M 17.0625 0 " />
            </g>
          </svg>
        </div>
      </div>

      {/* Brand name */}
      <div
        style={{
          fontSize: "72px",
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
          fontSize: "36px",
          fontWeight: 600,
          color: "rgba(255,255,255,0.9)",
          marginBottom: "32px",
        }}
      >
        Discover. Reserve. Play.
      </div>

      {/* Description */}
      <div
        style={{
          fontSize: "24px",
          color: "rgba(255,255,255,0.8)",
          maxWidth: "700px",
          textAlign: "center",
          lineHeight: 1.4,
        }}
      >
        Find pickleball and other sports courts near you and book in seconds
      </div>

      {/* Bottom accent bar */}
      <div
        style={{
          position: "absolute",
          bottom: "0",
          left: "0",
          right: "0",
          height: "8px",
          background: "linear-gradient(90deg, #FB923C 0%, #F97316 100%)",
        }}
      />
    </div>,
    {
      ...size,
    },
  );
}
