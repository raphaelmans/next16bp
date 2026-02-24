import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Script from "next/script";
import { Suspense } from "react";
import { appRoutes } from "@/common/app-routes";
import { toDialablePhone } from "@/common/phone";
import { Container } from "@/components/layout";
import { getPlaceVerificationDisplay } from "@/features/discovery/helpers";
import { PlaceDetailAvailabilityStudioSlot } from "@/features/discovery/place-detail/components/place-detail-availability-studio-slot";
import {
  PlaceDetailCourtsServerSection,
  PlaceDetailCourtsServerSectionFallback,
} from "@/features/discovery/place-detail/components/sections/place-detail-courts-server-section";
import { PlaceDetailHeroServerSection } from "@/features/discovery/place-detail/components/sections/place-detail-hero-server-section";
import { PlaceDetailListingHelpSection } from "@/features/discovery/place-detail/components/sections/place-detail-listing-help-section";
import {
  PlaceDetailVenueServerSection,
  PlaceDetailVenueServerSectionFallback,
} from "@/features/discovery/place-detail/components/sections/place-detail-venue-server-section";
import {
  getPlaceCoreSectionData,
  getPlaceCourtsSectionData,
  getPlaceVenueSectionData,
} from "@/features/discovery/place-detail/server/place-detail-section-data";
import { env } from "@/lib/env";
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
  const courtLabel = formatCourtCount(courtCount);
  const sportsLabel =
    sports.length > 0 ? ` for ${sports.slice(0, 3).join(", ")}` : " for sports";

  if (locationLabel) {
    return `Book ${courtLabel}${sportsLabel} at ${place.name} in ${locationLabel}, Philippines.`;
  }

  return `Book ${courtLabel}${sportsLabel} at ${place.name} on KudosCourts Philippines.`;
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
    const coreData = await getPlaceCoreSectionData(placeIdOrSlug);
    const placeDetails = coreData.placeDetails;
    const place = placeDetails.place;
    const sports = placeDetails.sports
      .map((sport) => sport.name)
      .filter(Boolean);

    const locationLabel = buildLocationLabel(place);
    title = locationLabel
      ? `${place.name} (${locationLabel})`
      : `${place.name} | Venue details`;
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
    const coreData = await getPlaceCoreSectionData(placeIdOrSlug);
    const place = coreData.place;
    const placeDetails = coreData.placeDetails;
    const slug = place.slug;

    if (slug && isUuid(placeIdOrSlug) && slug !== placeIdOrSlug) {
      redirect(appRoutes.places.detail(slug));
    }

    const canonicalId = slug ?? place.id;
    const canonicalPath = appRoutes.places.detail(canonicalId);
    const canonicalUrl = new URL(canonicalPath, appUrl).toString();

    const courtsSectionPromise = getPlaceCourtsSectionData(canonicalId);
    const venueSectionPromise = getPlaceVenueSectionData(canonicalId);

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
    const locationLabel = [placeDetails.place.city, placeDetails.place.province]
      .map((value) => value?.trim())
      .filter(Boolean)
      .join(", ");
    const description = locationLabel
      ? `${placeDetails.place.name} in ${locationLabel} with ${courtCountLabel}. Book with KudosCourts.`
      : `${placeDetails.place.name} with ${courtCountLabel}. Book with KudosCourts.`;

    const mapUrl =
      typeof latitude === "number" && typeof longitude === "number"
        ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
        : undefined;

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "SportsActivityLocation",
      "@id": `${canonicalUrl}#sports-activity-location`,
      name: placeDetails.place.name,
      url: canonicalUrl,
      description,
      address: {
        "@type": "PostalAddress",
        streetAddress: placeDetails.place.address,
        addressLocality: placeDetails.place.city,
        addressRegion: placeDetails.place.province,
        addressCountry: placeDetails.place.country,
      },
      ...(mapUrl ? { hasMap: mapUrl } : {}),
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
          name: placeDetails.place.name,
          item: canonicalUrl,
        },
      ],
    };

    const {
      isBookable,
      isCurated,
      showBooking,
      showVerificationBadge,
      showBookingVerificationUi,
      verificationMessage,
      verificationDescription,
      verificationStatusVariant,
    } = getPlaceVerificationDisplay({
      placeType: place.placeType,
      verificationStatus: place.verification?.status,
      reservationsEnabled: place.verification?.reservationsEnabled,
    });

    const hasCoordinates =
      typeof place.latitude === "number" &&
      Number.isFinite(place.latitude) &&
      typeof place.longitude === "number" &&
      Number.isFinite(place.longitude);
    const placeIdParam = place.extGPlaceId?.trim() ?? "";
    const mapQuery = `${place.name} ${place.address} ${place.city}`;
    const destinationParam = hasCoordinates
      ? `&destination=${place.latitude},${place.longitude}`
      : "";
    const directionsUrl = placeIdParam
      ? `https://www.google.com/maps/dir/?api=1${destinationParam}&destination_place_id=${encodeURIComponent(placeIdParam)}`
      : hasCoordinates
        ? `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;
    const openInMapsQuery = hasCoordinates
      ? `${place.latitude},${place.longitude}`
      : mapQuery;
    const openInMapsUrl = placeIdParam
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(openInMapsQuery)}&query_place_id=${encodeURIComponent(placeIdParam)}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(openInMapsQuery)}`;

    const phoneNumber = place.contactDetail?.phoneNumber?.trim();
    const dialablePhone = phoneNumber ? toDialablePhone(phoneNumber) : "";
    const callHref = dialablePhone
      ? `tel:${dialablePhone}`
      : phoneNumber
        ? `tel:${phoneNumber}`
        : "";
    const hasCallCta = Boolean(callHref);

    return (
      <>
        <Script id="place-structured-data" type="application/ld+json">
          {JSON.stringify(structuredData).replace(/</g, "\\u003c")}
        </Script>
        <Script id="place-breadcrumbs" type="application/ld+json">
          {JSON.stringify(breadcrumbStructuredData).replace(/</g, "\\u003c")}
        </Script>

        <Container className="pt-4 sm:pt-6">
          <PlaceDetailHeroServerSection
            place={place}
            showBooking={showBooking}
            showVerificationBadge={showVerificationBadge}
            isCurated={isCurated}
            directionsUrl={directionsUrl}
            hasCallCta={hasCallCta}
            callHref={callHref}
          />

          {showBooking && (
            <>
              <div id="availability-studio" className="sr-only">
                Availability Studio
              </div>
              <div className="mt-4 grid gap-6 pb-[70vh] lg:mt-6 lg:grid-cols-3 lg:pb-24">
                <PlaceDetailAvailabilityStudioSlot
                  place={place}
                  isBookable={isBookable}
                  analyticsPlaceId={place.id}
                  placeSlugOrId={canonicalId}
                  mapQuery={mapQuery}
                  directionsUrl={directionsUrl}
                  openInMapsUrl={openInMapsUrl}
                  showBookingVerificationUi={showBookingVerificationUi}
                  verificationMessage={verificationMessage}
                  verificationDescription={verificationDescription}
                  verificationStatusVariant={verificationStatusVariant}
                />
              </div>
            </>
          )}

          <div className="mt-6 grid gap-6 pb-8 lg:grid-cols-2 lg:pb-16">
            <Suspense fallback={<PlaceDetailCourtsServerSectionFallback />}>
              <PlaceDetailCourtsServerSection
                dataPromise={courtsSectionPromise}
                showBookingVerificationUi={showBookingVerificationUi}
                verificationMessage={verificationMessage}
                verificationDescription={verificationDescription}
                verificationStatusVariant={verificationStatusVariant}
              />
            </Suspense>

            <Suspense fallback={<PlaceDetailVenueServerSectionFallback />}>
              <PlaceDetailVenueServerSection
                dataPromise={venueSectionPromise}
              />
            </Suspense>
          </div>

          {!showBooking && (
            <div className="mt-6 pb-8 lg:pb-16">
              <PlaceDetailListingHelpSection
                placeId={place.id}
                placeIdOrSlug={canonicalId}
                isCurated={isCurated}
                claimStatus={place.claimStatus}
              />
            </div>
          )}
        </Container>
      </>
    );
  } catch {
    return notFound();
  }
}
