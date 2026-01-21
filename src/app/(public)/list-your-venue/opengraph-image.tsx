import { ImageResponse } from "next/og";

export const alt = "List your venue on KudosCourts";
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
        background: "linear-gradient(135deg, #0F766E 0%, #0D9488 100%)",
        fontFamily: "system-ui, sans-serif",
        color: "white",
        textAlign: "center",
        padding: "0 80px",
      }}
    >
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
            width: "520px",
            height: "520px",
            border: "16px solid white",
            borderRadius: "28px",
            position: "relative",
            display: "flex",
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "28px",
        }}
      >
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

      <div
        style={{
          fontSize: "68px",
          fontWeight: 800,
          letterSpacing: "-2px",
          marginBottom: "16px",
          lineHeight: 1.1,
        }}
      >
        List your venue
      </div>
      <div
        style={{
          fontSize: "32px",
          fontWeight: 600,
          color: "rgba(255,255,255,0.9)",
          marginBottom: "24px",
        }}
      >
        Get verified and start accepting bookings
      </div>
      <div
        style={{
          fontSize: "22px",
          color: "rgba(255,255,255,0.85)",
        }}
      >
        Create your organization, add a venue, and go live on KudosCourts
      </div>

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
