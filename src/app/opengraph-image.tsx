import { ImageResponse } from "next/og";
import { OG_BRAND } from "@/common/og-brand";

const CITY_TAGS = ["Manila", "Cebu", "Davao"];
const SPORT_TAGS = ["Badminton", "Basketball", "Tennis"];

export const alt =
  "KudosCourts lets players find sports courts in the Philippines by city, sport, reviews, and amenities.";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

function BrandMark({ size = 92 }: { size?: number }) {
  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "26px",
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

function DiscoveryTag({
  label,
  tone = "dark",
}: {
  label: string;
  tone?: "dark" | "light" | "accent";
}) {
  const toneStyles =
    tone === "light"
      ? {
          background: "rgba(250, 249, 247, 0.14)",
          border: "1px solid rgba(250, 249, 247, 0.18)",
          color: "#F5F5F4",
        }
      : tone === "accent"
        ? {
            background: "linear-gradient(135deg, #FB923C 0%, #F97316 100%)",
            border: "1px solid rgba(255,255,255,0.18)",
            color: "#FFF7ED",
          }
        : {
            background: "#0F2E2B",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#F5F5F4",
          };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "10px 16px",
        borderRadius: "999px",
        fontSize: "20px",
        fontWeight: 700,
        letterSpacing: "-0.02em",
        ...toneStyles,
      }}
    >
      {label}
    </div>
  );
}

function InsightRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "18px 0",
        borderTop: "1px solid rgba(11, 44, 41, 0.12)",
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: "20px",
          fontWeight: 600,
          color: "#36524E",
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: "flex",
          fontSize: "22px",
          fontWeight: 800,
          color: "#0C3B37",
          textAlign: "right",
        }}
      >
        {value}
      </div>
    </div>
  );
}

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        background:
          "linear-gradient(135deg, #041A18 0%, #0A2D2A 36%, #0D5C55 72%, #0D9488 100%)",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-140px",
          right: "-100px",
          width: "360px",
          height: "360px",
          borderRadius: "999px",
          background: "rgba(251, 146, 60, 0.22)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-180px",
          left: "-120px",
          width: "420px",
          height: "420px",
          borderRadius: "999px",
          background: "rgba(13, 148, 136, 0.18)",
        }}
      />

      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          margin: "34px",
          padding: "38px",
          borderRadius: "34px",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.05) 100%)",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 30px 90px rgba(0,0,0,0.22)",
          backdropFilter: "blur(14px)",
        }}
      >
        <div
          style={{
            display: "flex",
            width: "61%",
            height: "100%",
            flexDirection: "column",
            justifyContent: "space-between",
            paddingRight: "28px",
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
                marginBottom: "28px",
              }}
            >
              <BrandMark />
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  marginLeft: "18px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    fontSize: "18px",
                    fontWeight: 700,
                    letterSpacing: "0.22em",
                    color: "rgba(250, 249, 247, 0.68)",
                    textTransform: "uppercase",
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
                  Player-first court discovery
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                fontSize: "76px",
                lineHeight: 1,
                letterSpacing: "-0.05em",
                fontWeight: 900,
                color: "#FFFBF5",
                marginBottom: "22px",
                maxWidth: "620px",
              }}
            >
              Find sports courts in seconds
            </div>

            <div
              style={{
                display: "flex",
                fontSize: "28px",
                lineHeight: 1.35,
                color: "rgba(250, 249, 247, 0.86)",
                maxWidth: "620px",
                marginBottom: "32px",
              }}
            >
              Search by city, sport, real player reviews, and amenities. Check
              availability on courts that keep it updated.
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "14px",
              }}
            >
              <DiscoveryTag label="Cities players search" tone="accent" />
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
                marginBottom: "14px",
              }}
            >
              {CITY_TAGS.map((tag) => (
                <DiscoveryTag key={tag} label={tag} tone="light" />
              ))}
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              {SPORT_TAGS.map((tag) => (
                <DiscoveryTag key={tag} label={tag} />
              ))}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: "22px",
              fontWeight: 600,
              color: "rgba(255,255,255,0.78)",
            }}
          >
            Free for court owners who want more visibility and full control.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            width: "39%",
            height: "100%",
            alignItems: "stretch",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              width: "100%",
              flexDirection: "column",
              borderRadius: "28px",
              background: "#FAF9F7",
              padding: "28px",
              boxShadow: "0 24px 48px rgba(2, 12, 11, 0.28)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "24px",
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
                  Search snapshot
                </div>
                <div
                  style={{
                    display: "flex",
                    fontSize: "32px",
                    fontWeight: 900,
                    color: "#0C3B37",
                    letterSpacing: "-0.04em",
                  }}
                >
                  Courts near you
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: "102px",
                  padding: "12px 14px",
                  borderRadius: "18px",
                  background: "#0F766E",
                  color: "#F8FAFC",
                  fontSize: "18px",
                  fontWeight: 800,
                }}
              >
                Live
              </div>
            </div>

            <div
              style={{
                display: "flex",
                width: "100%",
                flexDirection: "column",
                borderRadius: "24px",
                background: "#F2EEEA",
                padding: "22px 22px 0",
                marginBottom: "22px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "18px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    fontSize: "24px",
                    fontWeight: 800,
                    color: "#1F3C39",
                  }}
                >
                  Makati • Badminton
                </div>
                <div
                  style={{
                    display: "flex",
                    fontSize: "18px",
                    fontWeight: 800,
                    color: "#F97316",
                  }}
                >
                  14 courts
                </div>
              </div>

              <InsightRow label="Reviews" value="Real player feedback" />
              <InsightRow label="Amenities" value="Parking, showers, lights" />
              <InsightRow label="Availability" value="Shown when updated" />
            </div>

            <div
              style={{
                display: "flex",
                width: "100%",
                justifyContent: "space-between",
                marginTop: "auto",
              }}
            >
              <DiscoveryTag label="No lock-in" tone="accent" />
              <DiscoveryTag label="Free for courts" tone="dark" />
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
