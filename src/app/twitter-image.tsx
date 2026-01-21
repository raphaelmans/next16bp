import { ImageResponse } from "next/og";

// Twitter/X Image metadata - 1200x630 for summary_large_image card
export const alt = "KudosCourts - Discover. Reserve. Play.";
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
        background: "linear-gradient(135deg, #0F766E 0%, #0D9488 100%)",
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
          Find pickleball and other sports courts near you and book in seconds.
          The unified platform for players.
        </div>

        {/* CTA hint */}
        <div
          style={{
            marginTop: "32px",
            padding: "12px 24px",
            background: "linear-gradient(135deg, #FB923C 0%, #F97316 100%)",
            borderRadius: "8px",
            fontSize: "18px",
            fontWeight: 600,
            color: "white",
          }}
        >
          Join the Waitlist
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
        {/* Court icon - larger version */}
        <div
          style={{
            width: "280px",
            height: "280px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            border: "12px solid rgba(255,255,255,0.9)",
            borderRadius: "32px",
            background: "rgba(255,255,255,0.12)",
          }}
        >
          {/* Top kitchen line */}
          <div
            style={{
              position: "absolute",
              width: "100%",
              height: "8px",
              background: "rgba(255,255,255,0.7)",
              top: "28%",
            }}
          />
          {/* Net line */}
          <div
            style={{
              position: "absolute",
              width: "100%",
              height: "10px",
              background: "white",
              top: "50%",
              transform: "translateY(-50%)",
            }}
          />
          {/* Bottom kitchen line */}
          <div
            style={{
              position: "absolute",
              width: "100%",
              height: "8px",
              background: "rgba(255,255,255,0.7)",
              bottom: "28%",
            }}
          />
          {/* Vertical center line */}
          <div
            style={{
              position: "absolute",
              width: "6px",
              height: "100%",
              background: "rgba(255,255,255,0.4)",
              left: "50%",
              transform: "translateX(-50%)",
            }}
          />
          {/* Orange pin */}
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #FB923C 0%, #F97316 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
              boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "white",
              }}
            />
          </div>
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
          background: "linear-gradient(90deg, #FB923C 0%, #F97316 100%)",
        }}
      />
    </div>,
    {
      ...size,
    },
  );
}
