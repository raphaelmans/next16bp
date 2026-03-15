import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Script from "next/script";
import { Suspense } from "react";
import { appRoutes } from "@/common/app-routes";
import { findCityByName, findProvinceByName } from "@/common/ph-location-data";
import { Container } from "@/components/layout";
import { Skeleton } from "@/components/ui/skeleton";
import { CoachDetailAbout } from "@/features/coach-discovery/components/coach-detail/coach-detail-about";
import { CoachDetailContact } from "@/features/coach-discovery/components/coach-detail/coach-detail-contact";
import { CoachDetailHero } from "@/features/coach-discovery/components/coach-detail/coach-detail-hero";
import { CoachDetailQualifications } from "@/features/coach-discovery/components/coach-detail/coach-detail-qualifications";
import { CoachDetailReviewsSection } from "@/features/coach-discovery/components/coach-detail/coach-detail-reviews";
import { CoachDetailServices } from "@/features/coach-discovery/components/coach-detail/coach-detail-services";
import {
  getCoachCoreSectionData,
  getCoachReviewSectionData,
} from "@/features/coach-discovery/server/coach-detail-section-data";
import { getPHProvincesCities } from "@/lib/shared/lib/ph-location-data.server";
import { getCanonicalOrigin } from "@/lib/shared/utils/canonical-origin";
import { isUuid } from "@/lib/slug";

const appUrl = getCanonicalOrigin();

function buildCoachMetaDescription(coach: {
  name: string;
  city?: string | null;
  province?: string | null;
  tagline?: string | null;
  sports: { name: string }[];
}) {
  const locationParts = [coach.city, coach.province].filter(Boolean);
  const locationLabel =
    locationParts.length > 0 ? locationParts.join(", ") : null;
  const sportsLabel =
    coach.sports.length > 0
      ? coach.sports
          .slice(0, 3)
          .map((s) => s.name)
          .join(", ")
      : "sports";

  if (locationLabel) {
    return `Book ${sportsLabel} coaching sessions with ${coach.name} in ${locationLabel}, Philippines. View qualifications, availability, and reviews on KudosCourts.`;
  }

  return `Book ${sportsLabel} coaching sessions with ${coach.name} on KudosCourts Philippines. View qualifications, availability, and reviews.`;
}

export async function generateCoachDetailMetadata(
  coachIdOrSlug: string,
): Promise<Metadata> {
  try {
    const details = await getCoachCoreSectionData(coachIdOrSlug);
    const coach = details.coach;
    const slug = coach.slug;
    const canonicalId = slug ?? coach.id;
    const canonicalPath = appRoutes.coaches.detail(canonicalId);
    const canonicalUrl = new URL(canonicalPath, appUrl).toString();

    const locationParts = [coach.city, coach.province].filter(Boolean);
    const locationLabel =
      locationParts.length > 0 ? ` in ${locationParts.join(", ")}` : "";
    const sportNames = details.meta.sports.map((s) => s.name);
    const primarySport = sportNames.length > 0 ? `${sportNames[0]} ` : "";
    const title = `${coach.name} – ${primarySport}Coach${locationLabel}`;
    const description = buildCoachMetaDescription({
      name: coach.name,
      city: coach.city,
      province: coach.province,
      tagline: coach.tagline,
      sports: sportNames.map((name) => ({ name })),
    });

    const imageUrl = details.media?.avatarUrl ?? details.media?.primaryPhotoUrl;
    const images = imageUrl ? [{ url: imageUrl, alt: coach.name }] : [];

    return {
      title,
      description,
      alternates: { canonical: canonicalUrl },
      openGraph: {
        title,
        description,
        url: canonicalUrl,
        type: "profile",
        ...(images.length > 0 ? { images } : {}),
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        ...(images.length > 0 ? { images } : {}),
      },
    };
  } catch {
    return {
      title: "Coach Not Found",
      robots: { index: false, follow: true },
    };
  }
}

type CoachDetailPageServerSectionProps = {
  coachIdOrSlug: string;
};

async function CoachDetailPageServerSection({
  coachIdOrSlug,
}: CoachDetailPageServerSectionProps) {
  try {
    const details = await getCoachCoreSectionData(coachIdOrSlug);
    const coach = details.coach;
    const slug = coach.slug;

    if (slug && isUuid(coachIdOrSlug) && slug !== coachIdOrSlug) {
      redirect(appRoutes.coaches.detail(slug));
    }

    const canonicalId = slug ?? coach.id;
    const canonicalPath = appRoutes.coaches.detail(canonicalId);
    const canonicalUrl = new URL(canonicalPath, appUrl).toString();

    const provinces = await getPHProvincesCities();
    const matchedProvince = findProvinceByName(provinces, coach.province);
    const matchedCity = matchedProvince
      ? findCityByName(matchedProvince, coach.city)
      : undefined;
    const initialReviews = await getCoachReviewSectionData(coach.id);

    const sportNames = details.meta.sports.map((s) => s.name);
    const locationLabel = [coach.city, coach.province]
      .filter(Boolean)
      .join(", ");
    const description = locationLabel
      ? `${coach.name} – coaching in ${locationLabel}. View qualifications, availability, and book sessions on KudosCourts.`
      : `${coach.name} – coaching on KudosCourts. View qualifications, availability, and book sessions.`;

    const imageUrls = details.photos
      .map((p) => p.url)
      .filter((url): url is string => Boolean(url));
    if (details.media?.avatarUrl) {
      imageUrls.unshift(details.media.avatarUrl);
    }

    const sameAs = [
      details.contactDetail?.websiteUrl,
      details.contactDetail?.facebookUrl,
      details.contactDetail?.instagramUrl,
    ]
      .map((v) => v?.trim())
      .filter((v): v is string => Boolean(v));

    const latitude =
      typeof coach.latitude === "string"
        ? Number.parseFloat(coach.latitude)
        : typeof coach.latitude === "number"
          ? coach.latitude
          : undefined;
    const longitude =
      typeof coach.longitude === "string"
        ? Number.parseFloat(coach.longitude)
        : typeof coach.longitude === "number"
          ? coach.longitude
          : undefined;
    const geo =
      typeof latitude === "number" &&
      Number.isFinite(latitude) &&
      typeof longitude === "number" &&
      Number.isFinite(longitude)
        ? { "@type": "GeoCoordinates", latitude, longitude }
        : undefined;

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Person",
      "@id": `${canonicalUrl}#person`,
      name: coach.name,
      url: canonicalUrl,
      description,
      jobTitle: "Sports Coach",
      ...(coach.city
        ? {
            address: {
              "@type": "PostalAddress",
              addressLocality: coach.city,
              addressRegion: coach.province,
              addressCountry: coach.country ?? "PH",
            },
          }
        : {}),
      ...(geo ? { geo } : {}),
      ...(sportNames.length > 0 ? { knowsAbout: sportNames } : {}),
      ...(imageUrls.length > 0 ? { image: imageUrls } : {}),
      ...(sameAs.length > 0 ? { sameAs } : {}),
      ...(details.meta?.averageRating != null && details.meta.reviewCount > 0
        ? {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: details.meta.averageRating.toFixed(1),
              reviewCount: details.meta.reviewCount,
              bestRating: 5,
              worstRating: 1,
            },
          }
        : {}),
    };

    const breadcrumbItems: {
      "@type": string;
      position: number;
      name: string;
      item: string;
    }[] = [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: appUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Coaches",
        item: new URL(appRoutes.coaches.base, appUrl).toString(),
      },
    ];
    let nextPosition = 3;
    if (matchedProvince) {
      breadcrumbItems.push({
        "@type": "ListItem",
        position: nextPosition++,
        name: matchedProvince.displayName,
        item: new URL(
          appRoutes.coaches.locations.province(matchedProvince.slug),
          appUrl,
        ).toString(),
      });
    }
    if (matchedProvince && matchedCity) {
      breadcrumbItems.push({
        "@type": "ListItem",
        position: nextPosition++,
        name: matchedCity.displayName,
        item: new URL(
          appRoutes.coaches.locations.city(
            matchedProvince.slug,
            matchedCity.slug,
          ),
          appUrl,
        ).toString(),
      });
    }
    breadcrumbItems.push({
      "@type": "ListItem",
      position: nextPosition,
      name: coach.name,
      item: canonicalUrl,
    });
    const breadcrumbStructuredData = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbItems,
    };

    const rateLabel =
      typeof coach.baseHourlyRateCents === "number"
        ? coach.baseHourlyRateCents
        : null;

    return (
      <>
        <Script id="coach-structured-data" type="application/ld+json">
          {JSON.stringify(structuredData).replace(/</g, "\\u003c")}
        </Script>
        <Script id="coach-breadcrumbs" type="application/ld+json">
          {JSON.stringify(breadcrumbStructuredData).replace(/</g, "\\u003c")}
        </Script>

        <section className="border-b border-border bg-card/50 py-5">
          <Container>
            <nav className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <Link
                href={appRoutes.coaches.base}
                className="hover:text-foreground"
              >
                All Coaches
              </Link>
              {matchedProvince && (
                <>
                  <span aria-hidden="true" className="text-border">
                    /
                  </span>
                  <Link
                    href={appRoutes.coaches.locations.province(
                      matchedProvince.slug,
                    )}
                    className="hover:text-foreground"
                  >
                    {matchedProvince.displayName}
                  </Link>
                </>
              )}
              {matchedProvince && matchedCity && (
                <>
                  <span aria-hidden="true" className="text-border">
                    /
                  </span>
                  <Link
                    href={appRoutes.coaches.locations.city(
                      matchedProvince.slug,
                      matchedCity.slug,
                    )}
                    className="hover:text-foreground"
                  >
                    {matchedCity.displayName}
                  </Link>
                </>
              )}
              <span aria-hidden="true" className="text-border">
                /
              </span>
              <span className="text-foreground">{coach.name}</span>
            </nav>
          </Container>
        </section>

        <Container className="pt-4 pb-8 sm:pt-6 lg:pb-16">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-8 lg:col-span-2">
              <CoachDetailHero
                coach={coach}
                media={details.media}
                meta={details.meta}
                photos={details.photos}
              />

              <CoachDetailAbout
                bio={coach.bio}
                coachingPhilosophy={coach.coachingPhilosophy}
                playingBackground={coach.playingBackground}
              />

              <CoachDetailQualifications
                certifications={details.certifications}
                yearsOfExperience={coach.yearsOfExperience}
                skillLevels={details.skillLevels}
                ageGroups={details.ageGroups}
              />

              <CoachDetailServices
                sessionTypes={details.sessionTypes}
                sessionDurations={details.sessionDurations}
                willingToTravel={coach.willingToTravel}
                onlineCoaching={coach.onlineCoaching}
              />

              <CoachDetailReviewsSection
                coachId={coach.id}
                initialAggregate={{
                  averageRating: details.meta.averageRating,
                  reviewCount: details.meta.reviewCount,
                }}
                initialReviews={{
                  items: initialReviews.items.map((item) => ({
                    ...item,
                    createdAt: item.createdAt.toISOString(),
                    updatedAt: item.updatedAt.toISOString(),
                  })),
                  total: initialReviews.total,
                }}
              />
            </div>

            <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
              <CoachDetailContact
                contactDetail={details.contactDetail}
                coachIdOrSlug={canonicalId}
                rateInCents={rateLabel}
                currency={coach.baseHourlyRateCurrency}
              />
            </aside>
          </div>
        </Container>
      </>
    );
  } catch {
    return notFound();
  }
}

function CoachDetailPageStreamFallback() {
  return (
    <Container className="pt-4 pb-8 sm:pt-6">
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
            <Skeleton className="aspect-[16/9] w-full rounded-lg" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
        <div>
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </div>
    </Container>
  );
}

export function renderCoachDetailPage(coachIdOrSlug: string) {
  return (
    <Suspense fallback={<CoachDetailPageStreamFallback />}>
      <CoachDetailPageServerSection coachIdOrSlug={coachIdOrSlug} />
    </Suspense>
  );
}
