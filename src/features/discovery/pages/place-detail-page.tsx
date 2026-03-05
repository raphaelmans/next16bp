import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Script from "next/script";
import { Suspense } from "react";
import { appRoutes } from "@/common/app-routes";
import { toDialablePhone } from "@/common/phone";
import { buildLocationLabel, humanizeSlug } from "@/common/seo-helpers";
import { Container } from "@/components/layout";
import { Skeleton } from "@/components/ui/skeleton";
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
import { getCanonicalOrigin } from "@/lib/shared/utils/canonical-origin";
import { isUuid } from "@/lib/slug";

const appUrl = getCanonicalOrigin();

const formatCourtCount = (count: number) =>
  `${count} court${count === 1 ? "" : "s"}`;

/**
 * Return the dominant sport name when one sport covers ≥60 % of courts.
 */
const getDominantSport = (
  courts: { sportName: string }[],
): string | undefined => {
  if (courts.length === 0) return undefined;
  const counts = new Map<string, number>();
  for (const c of courts) {
    counts.set(c.sportName, (counts.get(c.sportName) ?? 0) + 1);
  }
  for (const [sport, count] of counts) {
    if (count / courts.length >= 0.6) return sport;
  }
  return undefined;
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

function PlaceDetailPageStreamFallback() {
  return (
    <Container className="py-8">
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-4 w-36" />
          </div>
        </div>

        <Skeleton className="h-64 w-full rounded-2xl" />

        <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
            <div className="flex flex-wrap gap-2 pt-2">
              <Skeleton className="h-8 w-24 rounded-full" />
              <Skeleton className="h-8 w-20 rounded-full" />
              <Skeleton className="h-8 w-28 rounded-full" />
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </Container>
  );
}

export async function generatePlaceDetailMetadata(
  placeIdOrSlug: string,
): Promise<Metadata> {
  const fallbackPath = appRoutes.places.detail(placeIdOrSlug);
  let canonicalPath = fallbackPath;

  const fallbackName = humanizeSlug(placeIdOrSlug);
  let title = fallbackName;
  let description = `View ${fallbackName} venue details, courts, and availability on KudosCourts Philippines.`;
  let imageUrl: string | undefined;

  try {
    const coreData = await getPlaceCoreSectionData(placeIdOrSlug);
    const placeDetails = coreData.placeDetails;
    const place = placeDetails.place;
    const sports = placeDetails.sports
      .map((sport) => sport.name)
      .filter(Boolean);

    const locationLabel = buildLocationLabel(place);
    const courtMappings = placeDetails.courts.map((c) => ({
      sportName: c.sport.name,
    }));
    const dominantSport = getDominantSport(courtMappings);

    // Title: include dominant sport when one exists
    if (dominantSport && locationLabel) {
      title = `${place.name} \u2013 ${dominantSport} Courts in ${locationLabel}`;
    } else if (locationLabel) {
      title = `${place.name} (${locationLabel})`;
    } else {
      title = `${place.name} | Venue details`;
    }

    // Description: base + amenities + CTA
    let desc = buildMetadataDescription(
      place,
      placeDetails.courts.length,
      sports,
    );
    const amenityNames = placeDetails.amenities
      .map((a) => a.name?.trim())
      .filter((n): n is string => Boolean(n));
    if (amenityNames.length > 0) {
      desc += ` Amenities include ${amenityNames.slice(0, 3).join(", ")}.`;
    }
    desc += " Check real-time availability and book online.";
    description = desc;

    canonicalPath = appRoutes.places.detail(place.slug ?? place.id);
    imageUrl = toAbsoluteUrl(
      placeDetails.photos?.[0]?.url ?? placeDetails.organizationLogoUrl,
    );
  } catch {
    // Keep slug-based fallback metadata when place lookup fails.
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

type PlaceDetailPageServerSectionProps = {
  placeIdOrSlug: string;
};

async function PlaceDetailPageServerSection({
  placeIdOrSlug,
}: PlaceDetailPageServerSectionProps) {
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
      hasPaymentMethods: placeDetails.hasPaymentMethods,
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
              <div className="mt-4 grid gap-6 pb-8 lg:mt-6 lg:grid-cols-3">
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

          <div
            id="courts-info"
            className="mt-6 grid gap-6 pb-8 lg:grid-cols-2 lg:pb-16"
          >
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

export function renderPlaceDetailPage(placeIdOrSlug: string) {
  return (
    <Suspense fallback={<PlaceDetailPageStreamFallback />}>
      <PlaceDetailPageServerSection placeIdOrSlug={placeIdOrSlug} />
    </Suspense>
  );
}
