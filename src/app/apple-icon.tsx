import { ImageResponse } from "next/og";

// Apple icon metadata - 180x180 for Apple devices
export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

// Apple icon generation - KudosCourts court with orange pin
export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0F766E 0%, #0D9488 100%)",
        borderRadius: "36px",
      }}
    >
      {/* Court representation */}
      <div
        style={{
          width: "140px",
          height: "140px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          border: "8px solid rgba(255,255,255,0.9)",
          borderRadius: "16px",
          background: "rgba(255,255,255,0.1)",
        }}
      >
        {/* Top kitchen line */}
        <div
          style={{
            position: "absolute",
            width: "100%",
            height: "4px",
            background: "rgba(255,255,255,0.85)",
            top: "30%",
          }}
        />
        {/* Center line (horizontal - net) */}
        <div
          style={{
            position: "absolute",
            width: "100%",
            height: "6px",
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
            height: "4px",
            background: "rgba(255,255,255,0.85)",
            bottom: "30%",
          }}
        />
        {/* Vertical center line */}
        <div
          style={{
            position: "absolute",
            width: "3px",
            height: "100%",
            background: "rgba(255,255,255,0.5)",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        />
        {/* Orange pin in center */}
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #FB923C 0%, #F97316 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          }}
        >
          <div
            style={{
              width: "18px",
              height: "18px",
              borderRadius: "50%",
              background: "white",
            }}
          />
        </div>
      </div>
    </div>,
    {
      ...size,
    },
  );
}
