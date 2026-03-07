import { and, count, desc, eq, ne } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Script from "next/script";
import { appRoutes } from "@/common/app-routes";
import { findCityBySlug, findProvinceBySlug } from "@/common/ph-location-data";
import { Container } from "@/components/layout";
import { DiscoveryCourtsPage } from "@/features/discovery/pages/courts-page";
import { db } from "@/lib/shared/infra/db/drizzle";
import {
  court,
  place,
  sport as sportTable,
} from "@/lib/shared/infra/db/schema";
import { getPHProvincesCities } from "@/lib/shared/lib/ph-location-data.server";
import {
  buildCanonicalUrl,
  getCanonicalOrigin,
} from "@/lib/shared/utils/canonical-origin";

type CourtsCitySportPageProps = {
  params: Promise<{ province: string; city: string; sport: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const appUrl = getCanonicalOrigin();

type SportPageContext = {
  province: {
    name: string;
    slug: string;
    displayName: string;
  };
  city: {
    name: string;
    slug: string;
    displayName: string;
  };
  sport: {
    id: string;
    name: string;
    slug: string;
  };
};

const resolveSportPageContext = async (
  params: Awaited<CourtsCitySportPageProps["params"]>,
): Promise<SportPageContext | null> => {
  const provinces = await getPHProvincesCities();
  const province = findProvinceBySlug(provinces, params.province);
  const city = province ? findCityBySlug(province, params.city) : null;

  if (!province || !city) {
    return null;
  }

  const [sport] = await db
    .select({
      id: sportTable.id,
      name: sportTable.name,
      slug: sportTable.slug,
    })
    .from(sportTable)
    .where(eq(sportTable.slug, params.sport))
    .limit(1);

  if (!sport) {
    return null;
  }

  const [matchingPlace] = await db
    .select({ id: place.id })
    .from(place)
    .innerJoin(
      court,
      and(eq(court.placeId, place.id), eq(court.sportId, sport.id)),
    )
    .where(
      and(
        eq(place.isActive, true),
        eq(court.isActive, true),
        eq(place.province, province.name),
        eq(place.city, city.name),
      ),
    )
    .limit(1);

  if (!matchingPlace) {
    return null;
  }

  return { province, city, sport };
};

export async function generateMetadata({
  params,
}: CourtsCitySportPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const context = await resolveSportPageContext(resolvedParams);

  if (!context) {
    return {
      title: "Courts",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = `${context.sport.name} Courts in ${context.city.displayName}, ${context.province.displayName} — Philippines`;
  const description = `Discover ${context.sport.name.toLowerCase()} courts in ${context.city.displayName}, ${context.province.displayName}. Compare venues, check open slots, and reserve online on KudosCourts.`;
  const canonicalUrl = new URL(
    appRoutes.courts.locations.sport(
      context.province.slug,
      context.city.slug,
      context.sport.slug,
    ),
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

export default async function CourtsCitySportPage({
  params,
  searchParams,
}: CourtsCitySportPageProps) {
  const resolvedParams = await params;
  const context = await resolveSportPageContext(resolvedParams);

  if (!context) {
    return notFound();
  }

  const [placeCountRow, courtCountRow, siblingSportRows, venueRows] =
    await Promise.all([
      db
        .select({ value: count() })
        .from(place)
        .innerJoin(
          court,
          and(
            eq(court.placeId, place.id),
            eq(court.isActive, true),
            eq(court.sportId, context.sport.id),
          ),
        )
        .where(
          and(
            eq(place.isActive, true),
            eq(place.province, context.province.name),
            eq(place.city, context.city.name),
          ),
        ),
      db
        .select({ value: count() })
        .from(court)
        .innerJoin(place, eq(place.id, court.placeId))
        .where(
          and(
            eq(place.isActive, true),
            eq(court.isActive, true),
            eq(court.sportId, context.sport.id),
            eq(place.province, context.province.name),
            eq(place.city, context.city.name),
          ),
        ),
      db
        .select({
          slug: sportTable.slug,
          name: sportTable.name,
          value: count(),
        })
        .from(place)
        .innerJoin(
          court,
          and(eq(court.placeId, place.id), eq(court.isActive, true)),
        )
        .innerJoin(sportTable, eq(sportTable.id, court.sportId))
        .where(
          and(
            eq(place.isActive, true),
            eq(place.province, context.province.name),
            eq(place.city, context.city.name),
            ne(sportTable.id, context.sport.id),
          ),
        )
        .groupBy(sportTable.slug, sportTable.name)
        .orderBy(desc(count()), sportTable.name)
        .limit(6),
      db
        .select({ slug: place.slug, name: place.name })
        .from(place)
        .innerJoin(
          court,
          and(
            eq(court.placeId, place.id),
            eq(court.sportId, context.sport.id),
            eq(court.isActive, true),
          ),
        )
        .where(
          and(
            eq(place.isActive, true),
            eq(place.province, context.province.name),
            eq(place.city, context.city.name),
          ),
        )
        .groupBy(place.slug, place.name, place.featuredRank)
        .orderBy(desc(place.featuredRank), place.name)
        .limit(6),
    ]);

  const placeCount = Number(placeCountRow?.[0]?.value ?? 0);
  const courtCount = Number(courtCountRow?.[0]?.value ?? 0);
  const canonicalPath = appRoutes.courts.locations.sport(
    context.province.slug,
    context.city.slug,
    context.sport.slug,
  );
  const canonicalUrl = buildCanonicalUrl(canonicalPath);
  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `Where can I book ${context.sport.name} courts in ${context.city.displayName}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Use this page to browse active ${context.sport.name.toLowerCase()} venues in ${context.city.displayName}, compare options, and reserve available slots online.`,
        },
      },
      {
        "@type": "Question",
        name: `How many ${context.sport.name.toLowerCase()} courts are listed in ${context.city.displayName}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `KudosCourts currently indexes ${courtCount} ${context.sport.name.toLowerCase()} court${courtCount === 1 ? "" : "s"} across ${placeCount} active venue${placeCount === 1 ? "" : "s"} in ${context.city.displayName}.`,
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
        name: context.province.displayName,
        item: buildCanonicalUrl(
          appRoutes.courts.locations.province(context.province.slug),
        ),
      },
      {
        "@type": "ListItem",
        position: 4,
        name: context.city.displayName,
        item: buildCanonicalUrl(
          appRoutes.courts.locations.city(
            context.province.slug,
            context.city.slug,
          ),
        ),
      },
      {
        "@type": "ListItem",
        position: 5,
        name: context.sport.name,
        item: canonicalUrl,
      },
    ],
  } as const;

  return (
    <>
      <Script
        id={`city-sport-seo-${context.province.slug}-${context.city.slug}-${context.sport.slug}`}
        type="application/ld+json"
      >
        {JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [faqStructuredData, breadcrumbStructuredData],
        }).replace(/</g, "\\u003c")}
      </Script>
      <section className="border-b border-border bg-card/50 py-5">
        <Container className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {context.sport.name} listings in {context.city.displayName}:{" "}
            {placeCount} venue{placeCount === 1 ? "" : "s"} and {courtCount}{" "}
            court{courtCount === 1 ? "" : "s"}.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href={appRoutes.courts.locations.city(
                context.province.slug,
                context.city.slug,
              )}
              className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:border-foreground/30 hover:text-foreground"
            >
              All sports in {context.city.displayName}
            </Link>
            <Link
              href={appRoutes.courts.locations.province(context.province.slug)}
              className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:border-foreground/30 hover:text-foreground"
            >
              {context.province.displayName} hub
            </Link>
          </div>
          {venueRows.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold">
                Popular {context.sport.name} venues in{" "}
                {context.city.displayName}
              </p>
              <div className="flex flex-wrap gap-2">
                {venueRows.map((venue) => (
                  <Link
                    key={venue.slug}
                    href={appRoutes.places.detail(venue.slug)}
                    className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                  >
                    {venue.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
          {siblingSportRows.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold">
                Explore other sports nearby
              </p>
              <div className="flex flex-wrap gap-2">
                {siblingSportRows.map((sportRow) => (
                  <Link
                    key={sportRow.slug}
                    href={appRoutes.courts.locations.sport(
                      context.province.slug,
                      context.city.slug,
                      sportRow.slug,
                    )}
                    className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                  >
                    {sportRow.name} ({Number(sportRow.value ?? 0)})
                  </Link>
                ))}
              </div>
            </div>
          )}
        </Container>
      </section>
      <DiscoveryCourtsPage
        initialFilters={{
          province: context.province.slug,
          city: context.city.slug,
          sportId: context.sport.id,
        }}
        initialLocationLabel={`${context.city.displayName}, ${context.province.displayName}`}
        searchParams={searchParams}
      />
    </>
  );
}
