import { ImageResponse } from "next/og";
import { appRoutes } from "@/common/app-routes";
import { createServerCaller } from "@/lib/shared/infra/trpc/server";

export const alt = "KudosCourts court";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

const buildLocationLabel = (place: {
  city: string;
  province: string;
  address: string;
}) => {
  const parts = [place.city, place.province].filter(Boolean);
  if (parts.length > 0) {
    return parts.join(", ");
  }
  return place.address;
};

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const fallbackPath = appRoutes.places.detail(id);

  let title = "Court details";
  let subtitle = "Discover. Reserve. Play.";

  try {
    const caller = await createServerCaller(fallbackPath);
    const placeDetails = await caller.place.getByIdOrSlug({
      placeIdOrSlug: id,
    });
    const place = placeDetails.place;
    title = place.name;
    subtitle = buildLocationLabel(place);
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
        background: "linear-gradient(135deg, #0F766E 0%, #0D9488 100%)",
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
            <rect width="375" height="375" fill="#0d9488" />
            <g fill="#fafaf9" transform="translate(99.06738 280.162856)">
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
          marginBottom: "16px",
          lineHeight: 1.1,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: "32px",
          fontWeight: 600,
          color: "rgba(255,255,255,0.9)",
          marginBottom: "24px",
        }}
      >
        {subtitle}
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
          background: "linear-gradient(90deg, #FB923C 0%, #F97316 100%)",
        }}
      />
    </div>,
    {
      ...size,
    },
  );
}
