import { ImageResponse } from "next/og";
import { OG_BRAND, OG_GRADIENTS } from "@/common/og-brand";
import { buildLocationLabel, humanizeSlug } from "@/common/seo-helpers";
import { getPlaceDetailsForCourtRoute } from "@/lib/modules/discovery/server/court-detail-page";

export const alt = "KudosCourts court";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ placeId: string; courtId: string }>;
}) {
  const { placeId, courtId } = await params;

  let venueName = humanizeSlug(placeId);
  let courtLine = "Court details";
  let locationLine = "Discover. Reserve. Play.";

  try {
    const placeDetails = await getPlaceDetailsForCourtRoute(placeId);
    const place = placeDetails.place;
    venueName = place.name;
    locationLine = buildLocationLabel(place) || locationLine;

    const court = placeDetails.courts.find((c) => c.court.id === courtId);
    if (court) {
      const sportName = court.sport.name;
      courtLine = sportName
        ? `${court.court.label} \u2013 ${sportName}`
        : court.court.label;
    }
  } catch {}

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
      }}
    >
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

      <div
        style={{
          fontSize: "72px",
          fontWeight: 800,
          letterSpacing: "-2px",
          marginBottom: "12px",
          lineHeight: 1.1,
        }}
      >
        {venueName}
      </div>
      <div
        style={{
          fontSize: "36px",
          fontWeight: 700,
          color: "rgba(255,255,255,0.95)",
          marginBottom: "12px",
        }}
      >
        {courtLine}
      </div>
      <div
        style={{
          fontSize: "28px",
          fontWeight: 600,
          color: "rgba(255,255,255,0.85)",
          marginBottom: "24px",
        }}
      >
        {locationLine}
      </div>
      <div
        style={{
          fontSize: "22px",
          color: "rgba(255,255,255,0.85)",
        }}
      >
        Book courts on KudosCourts
      </div>

      <div
        style={{
          position: "absolute",
          bottom: "0",
          left: "0",
          right: "0",
          height: "8px",
          background: OG_GRADIENTS.accentBar,
        }}
      />
    </div>,
    {
      ...size,
    },
  );
}
