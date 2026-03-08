import { and, count, desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Script from "next/script";
import { appRoutes } from "@/common/app-routes";
import { findCityByName, findProvinceBySlug } from "@/common/ph-location-data";
import { Container } from "@/components/layout";
import { DiscoveryCourtsPage } from "@/features/discovery/pages/courts-page";
import { db } from "@/lib/shared/infra/db/drizzle";
import { court, place, sport } from "@/lib/shared/infra/db/schema";
import { getPHProvincesCities } from "@/lib/shared/lib/ph-location-data.server";
import {
  buildCanonicalUrl,
  getCanonicalOrigin,
} from "@/lib/shared/utils/canonical-origin";

type CourtsProvincePageProps = {
  params: Promise<{ province: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const appUrl = getCanonicalOrigin();

export async function generateMetadata({
  params,
}: CourtsProvincePageProps): Promise<Metadata> {
  const { province: provinceSlug } = await params;
  const provinces = await getPHProvincesCities();
  const province = findProvinceBySlug(provinces, provinceSlug);

  if (!province) {
    return {
      title: "Courts",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = `Sports Courts in ${province.displayName}, Philippines`;
  const description = `Browse pickleball, basketball, tennis, and other sports courts in ${province.displayName}, Philippines. Compare listings, reviews, and availability signals on KudosCourts.`;
  const canonicalUrl = new URL(`/courts/locations/${province.slug}`, appUrl);

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

export default async function CourtsProvincePage({
  params,
  searchParams,
}: CourtsProvincePageProps) {
  const { province: provinceSlug } = await params;
  const provinces = await getPHProvincesCities();
  const province = findProvinceBySlug(provinces, provinceSlug);

  if (!province) {
    return notFound();
  }

  const [placeCountRow, courtCountRow, topCityRows, topSportRows] =
    await Promise.all([
      db
        .select({ value: count() })
        .from(place)
        .where(
          and(eq(place.isActive, true), eq(place.province, province.name)),
        ),
      db
        .select({ value: count() })
        .from(court)
        .innerJoin(
          place,
          and(eq(place.id, court.placeId), eq(place.isActive, true)),
        )
        .where(
          and(eq(court.isActive, true), eq(place.province, province.name)),
        ),
      db
        .select({ city: place.city, value: count() })
        .from(place)
        .where(and(eq(place.isActive, true), eq(place.province, province.name)))
        .groupBy(place.city)
        .orderBy(desc(count()))
        .limit(6),
      db
        .select({
          sportSlug: sport.slug,
          sportName: sport.name,
          value: count(),
        })
        .from(place)
        .innerJoin(
          court,
          and(eq(court.placeId, place.id), eq(court.isActive, true)),
        )
        .innerJoin(sport, eq(sport.id, court.sportId))
        .where(and(eq(place.isActive, true), eq(place.province, province.name)))
        .groupBy(sport.slug, sport.name)
        .orderBy(desc(count()))
        .limit(6),
    ]);

  const placeCount = Number(placeCountRow[0]?.value ?? 0);
  const courtCount = Number(courtCountRow[0]?.value ?? 0);
  const topCities = topCityRows
    .map((row) => {
      const city = findCityByName(province, row.city);
      if (!city) return null;
      return {
        citySlug: city.slug,
        cityLabel: city.displayName,
        totalVenues: Number(row.value ?? 0),
      };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row));
  const topSports = topSportRows.map((row) => ({
    slug: row.sportSlug,
    name: row.sportName,
    totalCourts: Number(row.value ?? 0),
  }));

  const canonicalPath = appRoutes.courts.locations.province(province.slug);
  const canonicalUrl = buildCanonicalUrl(canonicalPath);
  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `How do I find sports courts in ${province.displayName}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Use KudosCourts to filter by city and sport in ${province.displayName}, then compare court listings, reviews, and availability signals before you decide where to play.`,
        },
      },
      {
        "@type": "Question",
        name: `Can venue owners in ${province.displayName} list venues for free?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Venue owners can list or claim their venue and manage online bookings with free core tools on KudosCourts.",
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
        item: canonicalUrl,
      },
    ],
  } as const;

  return (
    <>
      <Script
        id={`province-location-seo-${province.slug}`}
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
            <span>
              {province.displayName}
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
          {(topCities.length > 0 || topSports.length > 0) && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {topSports.map((sportItem) => (
                <span
                  key={sportItem.slug}
                  className="rounded-full bg-primary/8 px-2.5 py-0.5 text-xs text-primary"
                >
                  {sportItem.name}{" "}
                  <span className="tabular-nums text-primary/60">
                    {sportItem.totalCourts}
                  </span>
                </span>
              ))}
              {topSports.length > 0 && topCities.length > 0 && (
                <span aria-hidden="true" className="mx-1 h-3 w-px bg-border" />
              )}
              {topCities.map((city) => (
                <Link
                  key={city.citySlug}
                  href={appRoutes.courts.locations.city(
                    province.slug,
                    city.citySlug,
                  )}
                  className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
                >
                  {city.cityLabel}
                </Link>
              ))}
            </div>
          )}
        </Container>
      </section>
      <DiscoveryCourtsPage
        initialFilters={{ province: province.slug }}
        initialLocationLabel={province.displayName}
        searchParams={searchParams}
      />
    </>
  );
}
