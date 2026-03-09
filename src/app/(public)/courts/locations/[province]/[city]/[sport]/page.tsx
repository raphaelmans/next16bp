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
import { publicCaller } from "@/trpc/server";

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
  const description = `Discover ${context.sport.name.toLowerCase()} courts in ${context.city.displayName}, ${context.province.displayName}. Compare listings, read reviews, and check availability when venues manage it on KudosCourts.`;
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

  const [placeCountRow, courtCountRow, citySportRows, venueSummaries] =
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
          ),
        )
        .groupBy(sportTable.slug, sportTable.name)
        .orderBy(desc(count()), sportTable.name)
        .limit(6),
      publicCaller.place.listSummary({
        province: context.province.name,
        city: context.city.name,
        sportId: context.sport.id,
        limit: 6,
        offset: 0,
      }),
    ]);

  const placeCount = Number(placeCountRow?.[0]?.value ?? 0);
  const courtCount = Number(courtCountRow?.[0]?.value ?? 0);
  const siblingSportRows = citySportRows.filter(
    (row) => row.slug !== context.sport.slug,
  );
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
          text: `Use this page to browse active ${context.sport.name.toLowerCase()} court listings in ${context.city.displayName}, compare options, and reserve available slots when they are available online.`,
        },
      },
      {
        "@type": "Question",
        name: `How many ${context.sport.name.toLowerCase()} courts are listed in ${context.city.displayName}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `KudosCourts currently indexes ${courtCount} ${context.sport.name.toLowerCase()} court${courtCount === 1 ? "" : "s"} across ${placeCount} active listing${placeCount === 1 ? "" : "s"} in ${context.city.displayName}.`,
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
        <Container>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <Link
              href={appRoutes.courts.locations.province(context.province.slug)}
              className="hover:text-foreground"
            >
              {context.province.displayName}
            </Link>
            <span aria-hidden="true" className="text-border">
              /
            </span>
            <Link
              href={appRoutes.courts.locations.city(
                context.province.slug,
                context.city.slug,
              )}
              className="hover:text-foreground"
            >
              {context.city.displayName}
            </Link>
            <span aria-hidden="true" className="text-border">
              /
            </span>
            <span>
              {context.sport.name}
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
          {(siblingSportRows.length > 0 || venueRows.length > 0) && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="rounded-full bg-primary/8 px-2.5 py-0.5 text-xs text-primary">
                {context.sport.name}{" "}
                <span className="tabular-nums text-primary/60">
                  {courtCount}
                </span>
              </span>
              {siblingSportRows.map((sportRow) => (
                <Link
                  key={sportRow.slug}
                  href={appRoutes.courts.locations.sport(
                    context.province.slug,
                    context.city.slug,
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
              {siblingSportRows.length > 0 && venueRows.length > 0 && (
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
        initialFilters={{
          province: context.province.slug,
          city: context.city.slug,
          sportId: context.sport.id,
        }}
        initialLocationLabel={`${context.city.displayName}, ${context.province.displayName}`}
        locationRoutePath={canonicalPath}
        locationRouteScope="sport"
        searchParams={await searchParams}
      />
    </>
  );
}
