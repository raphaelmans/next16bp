import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Script from "next/script";
import { appRoutes } from "@/common/app-routes";
import PlaceDetailClient from "@/features/discovery/place-detail/components/place-detail-client";
import { env } from "@/lib/env";
import { getPlaceDetailsByIdOrSlug } from "@/lib/shared/lib/place-details.server";
import { isUuid } from "@/lib/slug";

const appUrl = env.NEXT_PUBLIC_APP_URL ?? "https://kudoscourts.com";

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

const buildMetadataDescription = (
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

const toAbsoluteUrl = (value?: string | null) => {
  if (!value) return undefined;
  return value.startsWith("http") ? value : new URL(value, appUrl).toString();
};

const toNumber = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) return undefined;
  const parsed = Number.parseFloat(value.toString());
  return Number.isFinite(parsed) ? parsed : undefined;
};

export async function generatePlaceDetailMetadata(
  placeIdOrSlug: string,
): Promise<Metadata> {
  const fallbackPath = appRoutes.places.detail(placeIdOrSlug);
  let canonicalPath = fallbackPath;

  let title = "Court details";
  let description = "View court details on KudosCourts - Philippines.";
  let imageUrl: string | undefined;

  try {
    const placeDetails = await getPlaceDetailsByIdOrSlug(placeIdOrSlug);
    const place = placeDetails.place;
    const sports = placeDetails.sports
      .map((sport) => sport.name)
      .filter(Boolean);

    title = place.name;
    description = buildMetadataDescription(
      place,
      placeDetails.courts.length,
      sports,
    );
    canonicalPath = appRoutes.places.detail(place.slug ?? place.id);
    imageUrl = toAbsoluteUrl(
      placeDetails.photos?.[0]?.url ?? placeDetails.organizationLogoUrl,
    );
  } catch {
    // Keep fallback metadata when place lookup fails.
  }

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

export async function renderPlaceDetailPage(placeIdOrSlug: string) {
  try {
    const placeDetails = await getPlaceDetailsByIdOrSlug(placeIdOrSlug);
    const place = placeDetails.place;
    const slug = place.slug;

    if (slug && isUuid(placeIdOrSlug) && slug !== placeIdOrSlug) {
      redirect(appRoutes.places.detail(slug));
    }

    const canonicalPath = appRoutes.places.detail(slug ?? place.id);
    const canonicalUrl = new URL(canonicalPath, appUrl).toString();

    const imageUrls = placeDetails.photos
      .map((photo) => photo.url)
      .filter((url): url is string => Boolean(url));
    const sameAs = [
      placeDetails.contactDetail?.websiteUrl,
      placeDetails.contactDetail?.facebookUrl,
      placeDetails.contactDetail?.instagramUrl,
    ]
      .map((value) => value?.trim())
      .filter((value): value is string => Boolean(value));
    const sports = placeDetails.sports
      .map((sport) => sport.name)
      .filter(Boolean);
    const amenityFeatures = placeDetails.amenities
      .map((amenity) => amenity.name?.trim())
      .filter((name): name is string => Boolean(name))
      .map((name) => ({
        "@type": "LocationFeatureSpecification",
        name,
      }));
    const latitude = toNumber(place.latitude);
    const longitude = toNumber(place.longitude);
    const geo =
      typeof latitude === "number" && typeof longitude === "number"
        ? {
            "@type": "GeoCoordinates",
            latitude,
            longitude,
          }
        : undefined;
    const courtCount = placeDetails.courts.length;
    const courtCountLabel = `${courtCount} court${courtCount === 1 ? "" : "s"}`;
    const locationLabel = [place.city, place.province]
      .map((value) => value?.trim())
      .filter(Boolean)
      .join(", ");
    const description = locationLabel
      ? `${place.name} in ${locationLabel} with ${courtCountLabel}. Book with KudosCourts.`
      : `${place.name} with ${courtCountLabel}. Book with KudosCourts.`;

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "SportsActivityLocation",
      "@id": `${canonicalUrl}#sports-activity-location`,
      name: place.name,
      url: canonicalUrl,
      description,
      address: {
        "@type": "PostalAddress",
        streetAddress: place.address,
        addressLocality: place.city,
        addressRegion: place.province,
        addressCountry: place.country,
      },
      ...(geo ? { geo } : {}),
      ...(sports.length > 0 ? { sport: sports } : {}),
      ...(imageUrls.length > 0 ? { image: imageUrls } : {}),
      ...(sameAs.length > 0 ? { sameAs } : {}),
      ...(amenityFeatures.length > 0
        ? { amenityFeature: amenityFeatures }
        : {}),
      ...(placeDetails.contactDetail?.phoneNumber?.trim()
        ? { telephone: placeDetails.contactDetail.phoneNumber.trim() }
        : {}),
    };

    const breadcrumbStructuredData = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: appUrl,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Courts",
          item: new URL(appRoutes.courts.base, appUrl).toString(),
        },
        {
          "@type": "ListItem",
          position: 3,
          name: place.name,
          item: canonicalUrl,
        },
      ],
    };

    return (
      <>
        <Script id="place-structured-data" type="application/ld+json">
          {JSON.stringify(structuredData)}
        </Script>
        <Script id="place-breadcrumbs" type="application/ld+json">
          {JSON.stringify(breadcrumbStructuredData)}
        </Script>
        <PlaceDetailClient placeIdOrSlug={placeIdOrSlug} />
      </>
    );
  } catch {
    return notFound();
  }
}
