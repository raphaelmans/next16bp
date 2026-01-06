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
      {/* Background pattern - subtle court lines */}
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: 0.1,
        }}
      >
        <div
          style={{
            width: "500px",
            height: "500px",
            border: "16px solid white",
            borderRadius: "24px",
            position: "relative",
            display: "flex",
          }}
        />
      </div>

      {/* Logo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "24px",
        }}
      >
        {/* Court icon */}
        <div
          style={{
            width: "100px",
            height: "100px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            border: "6px solid rgba(255,255,255,0.9)",
            borderRadius: "16px",
            background: "rgba(255,255,255,0.15)",
          }}
        >
          {/* Net line */}
          <div
            style={{
              position: "absolute",
              width: "100%",
              height: "5px",
              background: "white",
              top: "50%",
              transform: "translateY(-50%)",
            }}
          />
          {/* Orange pin */}
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #FB923C 0%, #F97316 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            }}
          >
            <div
              style={{
                width: "14px",
                height: "14px",
                borderRadius: "50%",
                background: "white",
              }}
            />
          </div>
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
        Find pickleball courts near you and book your next game in seconds
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
