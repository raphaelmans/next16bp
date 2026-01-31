import { notFound, redirect } from "next/navigation";
import Script from "next/script";
import { appRoutes } from "@/common/app-routes";
import { env } from "@/lib/env";
import { createServerCaller } from "@/lib/shared/infra/trpc/server";
import { isUuid } from "@/lib/slug";
import PlaceDetailClient from "./place-detail-client";

export { generateMetadata } from "../../courts/[id]/page";

type PlaceDetailPageProps = {
  params: Promise<{ placeId: string }>;
};

const appUrl = env.NEXT_PUBLIC_APP_URL ?? "https://kudoscourts.com";

const toNumber = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) return undefined;
  const parsed = Number.parseFloat(value.toString());
  return Number.isFinite(parsed) ? parsed : undefined;
};

export default async function PlaceDetailPage({
  params,
}: PlaceDetailPageProps) {
  const { placeId } = await params;

  try {
    const caller = await createServerCaller(appRoutes.places.detail(placeId));
    const placeDetails = await caller.place.getByIdOrSlug({
      placeIdOrSlug: placeId,
    });
    const place = placeDetails.place;
    const slug = place.slug;

    if (slug && isUuid(placeId) && slug !== placeId) {
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
        <PlaceDetailClient />
      </>
    );
  } catch {
    return notFound();
  }
}
