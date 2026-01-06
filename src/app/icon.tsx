import { ImageResponse } from "next/og";

// Icon metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

// Icon generation - KudosCourts court with orange pin
export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0F766E 0%, #0D9488 100%)",
        borderRadius: "6px",
      }}
    >
      {/* Simplified court representation */}
      <div
        style={{
          width: "24px",
          height: "24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          border: "2px solid rgba(255,255,255,0.9)",
          borderRadius: "3px",
          background: "rgba(255,255,255,0.1)",
        }}
      >
        {/* Center line (horizontal - net) */}
        <div
          style={{
            position: "absolute",
            width: "100%",
            height: "2px",
            background: "white",
            top: "50%",
            transform: "translateY(-50%)",
          }}
        />
        {/* Orange pin in center */}
        <div
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #FB923C 0%, #F97316 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
          }}
        >
          <div
            style={{
              width: "3px",
              height: "3px",
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
