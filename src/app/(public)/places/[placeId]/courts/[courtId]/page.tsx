import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Script from "next/script";
import { appRoutes } from "@/common/app-routes";
import { buildLocationLabel, humanizeSlug } from "@/common/seo-helpers";
import { CourtDetailPage as DiscoveryCourtDetailPage } from "@/features/discovery/place-detail/pages/court-detail-page";
import { env } from "@/lib/env";
import { getPlaceDetailsForCourtRoute } from "@/lib/modules/discovery/server/court-detail-page";
import { isUuid } from "@/lib/slug";

type PageProps = {
  params: Promise<{ placeId: string; courtId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const appUrl = env.NEXT_PUBLIC_APP_URL ?? "https://kudoscourts.com";

const toAbsoluteUrl = (value?: string | null) => {
  if (!value) return undefined;
  return value.startsWith("http") ? value : new URL(value, appUrl).toString();
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { placeId, courtId } = await params;

  const fallbackName = humanizeSlug(placeId);
  let title = fallbackName;
  let description = `View ${fallbackName} venue details, courts, and availability on KudosCourts Philippines.`;
  let canonicalPath = appRoutes.places.courts.detail(placeId, courtId);
  let imageUrl: string | undefined;

  try {
    const placeDetails = await getPlaceDetailsForCourtRoute(placeId);
    const place = placeDetails.place;
    const court = placeDetails.courts.find((c) => c.court.id === courtId);

    if (court) {
      const courtLabel = court.court.label;
      const sportName = court.sport.name;
      const locationLabel = buildLocationLabel(place);

      title = sportName
        ? `${courtLabel} \u2013 ${sportName} at ${place.name}`
        : `${courtLabel} \u2013 ${place.name}`;

      const locationSuffix = locationLabel
        ? ` in ${locationLabel}, Philippines`
        : " on KudosCourts Philippines";
      description = sportName
        ? `Reserve ${courtLabel} for ${sportName} at ${place.name}${locationSuffix}. View real-time availability, pricing, and book your court online.`
        : `Reserve ${courtLabel} at ${place.name}${locationSuffix}. View real-time availability, pricing, and book your court online.`;

      canonicalPath = appRoutes.places.courts.detail(
        place.slug ?? place.id,
        courtId,
      );
      imageUrl = toAbsoluteUrl(
        placeDetails.photos?.[0]?.url ?? placeDetails.organizationLogoUrl,
      );
    }
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

export default async function CourtDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { placeId, courtId } = await params;
  const queryParams = await searchParams;

  try {
    const placeDetails = await getPlaceDetailsForCourtRoute(placeId);
    const place = placeDetails.place;
    const slug = place.slug;

    if (slug && isUuid(placeId) && slug !== placeId) {
      const targetPath = appRoutes.places.courts.detail(slug, courtId);
      const qs = new URLSearchParams();
      for (const [key, value] of Object.entries(queryParams)) {
        if (typeof value === "string") {
          qs.set(key, value);
        } else if (Array.isArray(value)) {
          for (const v of value) {
            if (v) qs.append(key, v);
          }
        }
      }
      const qsStr = qs.toString();
      redirect(qsStr ? `${targetPath}?${qsStr}` : targetPath);
    }

    const court = placeDetails.courts.find((c) => c.court.id === courtId);
    if (!court || !court.court.isActive) {
      return notFound();
    }

    const placeSlugOrId = slug ?? place.id;
    const canonicalPath = appRoutes.places.courts.detail(
      placeSlugOrId,
      courtId,
    );
    const canonicalUrl = new URL(canonicalPath, appUrl).toString();
    const venueCanonicalPath = appRoutes.places.detail(placeSlugOrId);
    const venueCanonicalUrl = new URL(venueCanonicalPath, appUrl).toString();

    const locationLabel = buildLocationLabel(place);
    const courtLabel = court.court.label;
    const sportName = court.sport.name;
    const courtDescription = sportName
      ? `${courtLabel} for ${sportName} at ${place.name}${locationLabel ? ` in ${locationLabel}` : ""}. Book with KudosCourts.`
      : `${courtLabel} at ${place.name}${locationLabel ? ` in ${locationLabel}` : ""}. Book with KudosCourts.`;

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "SportsActivityLocation",
      "@id": `${canonicalUrl}#court`,
      name: `${courtLabel} – ${place.name}`,
      url: canonicalUrl,
      description: courtDescription,
      isPartOf: {
        "@type": "SportsActivityLocation",
        "@id": `${venueCanonicalUrl}#sports-activity-location`,
        name: place.name,
        url: venueCanonicalUrl,
      },
      address: {
        "@type": "PostalAddress",
        streetAddress: place.address,
        addressLocality: place.city,
        addressRegion: place.province,
        addressCountry: place.country,
      },
      ...(sportName ? { sport: sportName } : {}),
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
          item: venueCanonicalUrl,
        },
        {
          "@type": "ListItem",
          position: 4,
          name: courtLabel,
          item: canonicalUrl,
        },
      ],
    };

    return (
      <>
        <Script id="court-structured-data" type="application/ld+json">
          {JSON.stringify(structuredData).replace(/</g, "\\u003c")}
        </Script>
        <Script id="court-breadcrumbs" type="application/ld+json">
          {JSON.stringify(breadcrumbStructuredData).replace(/</g, "\\u003c")}
        </Script>

        <DiscoveryCourtDetailPage
          placeSlugOrId={placeSlugOrId}
          placeId={place.id}
          placeName={place.name}
          placeCity={place.city}
          placeProvince={place.province}
          placeTimeZone={place.timeZone}
          courtId={courtId}
          courtLabel={court.court.label}
          courtTierLabel={court.court.tierLabel ?? undefined}
          sportId={court.sport.id}
          sportName={court.sport.name}
          placeType={place.placeType}
          verificationStatus={placeDetails.verification?.status ?? "UNVERIFIED"}
          reservationsEnabled={
            placeDetails.verification?.reservationsEnabled ?? false
          }
          hasPaymentMethods={placeDetails.hasPaymentMethods}
          contactDetail={
            placeDetails.contactDetail
              ? {
                  phoneNumber:
                    placeDetails.contactDetail.phoneNumber ?? undefined,
                  viberInfo: placeDetails.contactDetail.viberInfo ?? undefined,
                  otherContactInfo:
                    placeDetails.contactDetail.otherContactInfo ?? undefined,
                }
              : undefined
          }
        />
      </>
    );
  } catch {
    return notFound();
  }
}
