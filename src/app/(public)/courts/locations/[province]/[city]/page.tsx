import { and, count, desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Script from "next/script";
import { appRoutes } from "@/common/app-routes";
import { findCityBySlug, findProvinceBySlug } from "@/common/ph-location-data";
import { Container } from "@/components/layout";
import {
  comparePublicVenueSort,
  hasVenueSlug,
} from "@/features/discovery/helpers";
import { DiscoveryCourtsPage } from "@/features/discovery/pages/courts-page";
import { db } from "@/lib/shared/infra/db/drizzle";
import { court, place, sport } from "@/lib/shared/infra/db/schema";
import { getPHProvincesCities } from "@/lib/shared/lib/ph-location-data.server";
import {
  buildCanonicalUrl,
  getCanonicalOrigin,
} from "@/lib/shared/utils/canonical-origin";
import { publicCaller } from "@/trpc/server";

type CourtsCityPageProps = {
  params: Promise<{ province: string; city: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const appUrl = getCanonicalOrigin();

export async function generateMetadata({
  params,
}: CourtsCityPageProps): Promise<Metadata> {
  const { province: provinceSlug, city: citySlug } = await params;
  const provinces = await getPHProvincesCities();
  const province = findProvinceBySlug(provinces, provinceSlug);
  const city = province ? findCityBySlug(province, citySlug) : null;

  if (!province || !city) {
    return {
      title: "Courts",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = `Sports Courts in ${city.displayName}, ${province.displayName} — Philippines`;
  const description = `Discover pickleball, basketball, badminton, and other sports courts in ${city.displayName}, Philippines. Compare listings, reviews, and availability signals on KudosCourts.`;
  const canonicalUrl = new URL(
    `/courts/locations/${province.slug}/${city.slug}`,
    appUrl,
  );

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
    },
    twitter: {
      title,
      description,
    },
  };
}

export default async function CourtsCityPage({
  params,
  searchParams,
}: CourtsCityPageProps) {
  const { province: provinceSlug, city: citySlug } = await params;
  const provinces = await getPHProvincesCities();
  const province = findProvinceBySlug(provinces, provinceSlug);
  const city = province ? findCityBySlug(province, citySlug) : null;

  if (!province || !city) {
    return notFound();
  }

  const [sportRows, placeCountRow, courtCountRow, venueSummaries] =
    await Promise.all([
      db
        .select({ slug: sport.slug, name: sport.name, value: count() })
        .from(place)
        .innerJoin(
          court,
          and(eq(court.placeId, place.id), eq(court.isActive, true)),
        )
        .innerJoin(sport, eq(sport.id, court.sportId))
        .where(
          and(
            eq(place.isActive, true),
            eq(place.province, province.name),
            eq(place.city, city.name),
          ),
        )
        .groupBy(sport.slug, sport.name)
        .orderBy(desc(count()), sport.name),
      db
        .select({ value: count() })
        .from(place)
        .where(
          and(
            eq(place.isActive, true),
            eq(place.province, province.name),
            eq(place.city, city.name),
          ),
        ),
      db
        .select({ value: count() })
        .from(court)
        .innerJoin(
          place,
          and(eq(place.id, court.placeId), eq(place.isActive, true)),
        )
        .where(
          and(
            eq(court.isActive, true),
            eq(place.province, province.name),
            eq(place.city, city.name),
          ),
        ),
      publicCaller.place.listSummary({
        province: province.name,
        city: city.name,
        limit: 6,
        offset: 0,
      }),
    ]);

  const placeCount = Number(placeCountRow[0]?.value ?? 0);
  const courtCount = Number(courtCountRow[0]?.value ?? 0);
  const venueRows = venueSummaries.items
    .map((item) => ({
      id: item.place.id,
      slug: item.place.slug,
      name: item.place.name,
      featuredRank: item.place.featuredRank ?? 0,
      provinceRank: item.place.provinceRank ?? 0,
      placeType: item.place.placeType,
      verificationStatus: item.meta?.verificationStatus,
      averageRating: item.meta?.averageRating,
      reviewCount: item.meta?.reviewCount,
    }))
    .filter(hasVenueSlug)
    .sort(comparePublicVenueSort);
  const canonicalPath = appRoutes.courts.locations.city(
    province.slug,
    city.slug,
  );
  const canonicalUrl = buildCanonicalUrl(canonicalPath);
  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `How do I find courts in ${city.displayName}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Search by sport in ${city.displayName}, compare court listings, and check reviews and availability signals before you decide where to play.`,
        },
      },
      {
        "@type": "Question",
        name: `Which sports courts are available in ${city.displayName}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `KudosCourts lists active sports courts in ${city.displayName}. Use the sport filters to narrow by the game you play.`,
        },
      },
    ],
  } as const;
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
        item: buildCanonicalUrl(appRoutes.courts.base),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: province.displayName,
        item: buildCanonicalUrl(
          appRoutes.courts.locations.province(province.slug),
        ),
      },
      {
        "@type": "ListItem",
        position: 4,
        name: city.displayName,
        item: canonicalUrl,
      },
    ],
  } as const;

  return (
    <>
      <Script
        id={`city-location-seo-${province.slug}-${city.slug}`}
        type="application/ld+json"
      >
        {JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [faqStructuredData, breadcrumbStructuredData],
        }).replace(/</g, "\\u003c")}
      </Script>
      <section className="border-b border-border bg-card/50 py-5">
        <Container>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <Link
              href={appRoutes.courts.locations.province(province.slug)}
              className="hover:text-foreground"
            >
              {province.displayName}
            </Link>
            <span aria-hidden="true" className="text-border">
              /
            </span>
            <span>
              {city.displayName}
              <span className="ml-1 tabular-nums">
                · {placeCount} listing{placeCount === 1 ? "" : "s"},{" "}
                {courtCount} court{courtCount === 1 ? "" : "s"}
              </span>
            </span>
            <span aria-hidden="true" className="hidden text-border sm:inline">
              /
            </span>
            <Link
              href={appRoutes.ownersGetStarted.base}
              className="text-primary hover:text-primary/80"
            >
              List your venue
            </Link>
          </div>
          {(sportRows.length > 0 || venueRows.length > 0) && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {sportRows.map((sportRow) => (
                <Link
                  key={sportRow.slug}
                  href={appRoutes.courts.locations.sport(
                    province.slug,
                    city.slug,
                    sportRow.slug,
                  )}
                  className="rounded-full bg-primary/8 px-2.5 py-0.5 text-xs text-primary transition-colors hover:bg-primary/15"
                >
                  {sportRow.name}{" "}
                  <span className="tabular-nums text-primary/60">
                    {Number(sportRow.value ?? 0)}
                  </span>
                </Link>
              ))}
              {sportRows.length > 0 && venueRows.length > 0 && (
                <span aria-hidden="true" className="mx-1 h-3 w-px bg-border" />
              )}
              {venueRows.map((venue) => (
                <Link
                  key={venue.slug}
                  href={appRoutes.places.detail(venue.slug)}
                  className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
                >
                  {venue.name}
                </Link>
              ))}
            </div>
          )}
        </Container>
      </section>
      <DiscoveryCourtsPage
        initialFilters={{ province: province.slug, city: city.slug }}
        initialLocationLabel={`${city.displayName}, ${province.displayName}`}
        locationRoutePath={canonicalPath}
        locationRouteScope="city"
        searchParams={await searchParams}
      />
    </>
  );
}
