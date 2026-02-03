import type { Metadata } from "next";
import { appRoutes } from "@/common/app-routes";
import { env } from "@/lib/env";
import { getPlaceDetailsByIdOrSlug } from "@/lib/shared/lib/place-details.server";

export { default } from "../../places/[placeId]/page";

type CourtPageParams = {
  id: string;
};

const formatCourtCount = (count: number) =>
  `${count} court${count === 1 ? "" : "s"}`;

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

const buildDescription = (
  place: { name: string; city: string; province: string; address: string },
  courtCount: number,
  sports: string[],
) => {
  const locationLabel = buildLocationLabel(place);
  const sportLabel = sports.length > 0 ? `Sports: ${sports.join(", ")}` : "";
  return [
    place.name,
    locationLabel,
    "Philippines",
    formatCourtCount(courtCount),
    sportLabel,
  ]
    .filter(Boolean)
    .join(" | ");
};

const appUrl = env.NEXT_PUBLIC_APP_URL ?? "https://kudoscourts.com";

const toAbsoluteUrl = (value?: string | null) => {
  if (!value) return undefined;
  return value.startsWith("http") ? value : new URL(value, appUrl).toString();
};

export async function generateMetadata({
  params,
}: {
  params: Promise<CourtPageParams>;
}): Promise<Metadata> {
  const { id } = await params;

  const fallbackPath = appRoutes.places.detail(id);
  let canonicalPath = fallbackPath;

  let title = "Court details";
  let description = "View court details on KudosCourts — Philippines.";
  let imageUrl: string | undefined;

  try {
    const placeDetails = await getPlaceDetailsByIdOrSlug(id);
    const place = placeDetails.place;
    const sports = placeDetails.sports
      .map((sport) => sport.name)
      .filter(Boolean);

    title = place.name;
    description = buildDescription(place, placeDetails.courts.length, sports);
    canonicalPath = appRoutes.places.detail(place.slug ?? place.id);
    imageUrl = toAbsoluteUrl(
      placeDetails.photos?.[0]?.url ?? placeDetails.organizationLogoUrl,
    );
  } catch {}

  const openGraphImages = imageUrl
    ? [{ url: imageUrl, alt: `${title} photo` }]
    : undefined;
  const twitterImages = imageUrl ? [imageUrl] : undefined;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title,
      description,
      url: canonicalPath,
      siteName: "KudosCourts",
      type: "website",
      images: openGraphImages,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: twitterImages,
    },
  };
}
