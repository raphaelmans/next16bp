import { ImageResponse } from "next/og";
import { OG_BRAND } from "@/common/og-brand";

const FEATURE_POINTS = [
  "Search by city",
  "Browse sports",
  "Read player reviews",
];

export const alt = "One platform for every sports court in the Philippines.";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

function BrandMark({ size = 86 }: { size?: number }) {
  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "24px",
        overflow: "hidden",
        boxShadow: "0 20px 55px rgba(3, 14, 13, 0.3)",
        display: "flex",
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
  );
}

function FeaturePill({ label }: { label: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "12px 18px",
        borderRadius: "999px",
        background: "rgba(255,255,255,0.12)",
        border: "1px solid rgba(255,255,255,0.1)",
        color: "#FAF9F7",
        fontSize: "20px",
        fontWeight: 700,
      }}
    >
      {label}
    </div>
  );
}

export default function TwitterImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        background:
          "linear-gradient(135deg, #041A18 0%, #0A2D2A 34%, #0C4D47 68%, #0D9488 100%)",
        fontFamily: "system-ui, sans-serif",
        padding: "36px",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-110px",
          left: "760px",
          width: "260px",
          height: "260px",
          borderRadius: "999px",
          background: "rgba(251, 146, 60, 0.2)",
        }}
      />
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          borderRadius: "34px",
          padding: "34px",
          border: "1px solid rgba(255,255,255,0.12)",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)",
          boxShadow: "0 30px 90px rgba(0,0,0,0.24)",
        }}
      >
        <div
          style={{
            display: "flex",
            width: "58%",
            height: "100%",
            flexDirection: "column",
            justifyContent: "space-between",
            paddingRight: "24px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "26px",
              }}
            >
              <BrandMark />
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  marginLeft: "16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    fontSize: "18px",
                    fontWeight: 700,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: "rgba(250, 249, 247, 0.66)",
                  }}
                >
                  KudosCourts
                </div>
                <div
                  style={{
                    display: "flex",
                    fontSize: "20px",
                    fontWeight: 600,
                    color: "#E7E5E4",
                  }}
                >
                  The court discovery platform
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                fontSize: "72px",
                lineHeight: 1,
                letterSpacing: "-0.05em",
                fontWeight: 900,
                color: "#FFFBF5",
                marginBottom: "18px",
                maxWidth: "560px",
              }}
            >
              One platform. Every court.
            </div>

            <div
              style={{
                display: "flex",
                fontSize: "28px",
                lineHeight: 1.35,
                color: "rgba(250, 249, 247, 0.84)",
                maxWidth: "570px",
                marginBottom: "28px",
              }}
            >
              Every sports court in the Philippines, discoverable in seconds.
              Search by city, sport, reviews, and availability.
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              {FEATURE_POINTS.map((point) => (
                <FeaturePill key={point} label={point} />
              ))}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              fontSize: "22px",
              fontWeight: 600,
              color: "rgba(255,255,255,0.76)",
            }}
          >
            Free for courts who want visibility and full control.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            width: "42%",
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              width: "100%",
              height: "100%",
              flexDirection: "column",
              borderRadius: "28px",
              background: "#FAF9F7",
              padding: "26px",
              boxShadow: "0 24px 48px rgba(2, 12, 11, 0.28)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    fontSize: "18px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.18em",
                    color: "#6B7C78",
                    marginBottom: "8px",
                  }}
                >
                  Why players search
                </div>
                <div
                  style={{
                    display: "flex",
                    fontSize: "34px",
                    fontWeight: 900,
                    letterSpacing: "-0.04em",
                    color: "#0C3B37",
                  }}
                >
                  One search. Every court.
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                width: "100%",
                flexDirection: "column",
                borderRadius: "24px",
                background: "#F2EEEA",
                padding: "20px",
                marginBottom: "18px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: "24px",
                  fontWeight: 800,
                  color: "#163B37",
                  marginBottom: "12px",
                }}
              >
                Search courts. Read reviews. Check availability.
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: "20px",
                  lineHeight: 1.45,
                  color: "#45615D",
                }}
              >
                Skip scattered Facebook pages and separate reservation sites for
                each court.
              </div>
            </div>

            <div
              style={{
                display: "flex",
                marginTop: "auto",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "18px 16px",
                  borderRadius: "22px",
                  background: "#0F766E",
                  color: "#F8FAFC",
                  fontSize: "20px",
                  fontWeight: 800,
                }}
              >
                Player-first
              </div>
              <div
                style={{
                  display: "flex",
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "18px 16px",
                  borderRadius: "22px",
                  background:
                    "linear-gradient(135deg, #FB923C 0%, #F97316 100%)",
                  color: "#FFF7ED",
                  fontSize: "20px",
                  fontWeight: 800,
                }}
              >
                Free for courts
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    {
      ...size,
    },
  );
}
