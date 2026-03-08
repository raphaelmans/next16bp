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
      title: "Venues",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = `Sports Venues in ${province.displayName}, Philippines`;
  const description = `Browse pickleball, basketball, and tennis venues in ${province.displayName}, Philippines. Book your next game on KudosCourts.`;
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
        name: `How do I find sports venues in ${province.displayName}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Use KudosCourts to filter by city and sport in ${province.displayName}, then pick an available venue and book online.`,
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
        name: "Venues",
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
      <section className="border-b border-border bg-card/50 py-6">
        <Container className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {placeCount} active venue{placeCount === 1 ? "" : "s"} and{" "}
            {courtCount} indexed venue{courtCount === 1 ? "" : "s"} in{" "}
            {province.displayName}.
          </p>
          {topCities.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold">
                Top cities in this province
              </p>
              <div className="flex flex-wrap gap-2">
                {topCities.map((city) => (
                  <Link
                    key={city.citySlug}
                    href={appRoutes.courts.locations.city(
                      province.slug,
                      city.citySlug,
                    )}
                    className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                  >
                    {city.cityLabel} ({city.totalVenues})
                  </Link>
                ))}
              </div>
            </div>
          )}
          {topSports.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold">Most listed sports</p>
              <div className="flex flex-wrap gap-2">
                {topSports.map((sportItem) => (
                  <span
                    key={sportItem.slug}
                    className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
                  >
                    {sportItem.name} ({sportItem.totalCourts})
                  </span>
                ))}
              </div>
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
