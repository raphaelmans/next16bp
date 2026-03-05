import { and, count, desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Script from "next/script";
import { appRoutes } from "@/common/app-routes";
import { findCityBySlug, findProvinceBySlug } from "@/common/ph-location-data";
import { Container } from "@/components/layout";
import { DiscoveryCourtsPage } from "@/features/discovery/pages/courts-page";
import { db } from "@/lib/shared/infra/db/drizzle";
import { court, place, sport } from "@/lib/shared/infra/db/schema";
import { getPHProvincesCities } from "@/lib/shared/lib/ph-location-data.server";
import {
  buildCanonicalUrl,
  getCanonicalOrigin,
} from "@/lib/shared/utils/canonical-origin";

type CourtsCityPageProps = {
  params: Promise<{ province: string; city: string }>;
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
  const description = `Discover and book pickleball, basketball, and badminton courts in ${city.displayName}, Philippines.`;
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

export default async function CourtsCityPage({ params }: CourtsCityPageProps) {
  const { province: provinceSlug, city: citySlug } = await params;
  const provinces = await getPHProvincesCities();
  const province = findProvinceBySlug(provinces, provinceSlug);
  const city = province ? findCityBySlug(province, citySlug) : null;

  if (!province || !city) {
    return notFound();
  }

  const [sportRows, placeCountRow, courtCountRow, venueRows] =
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
      db
        .select({ slug: place.slug, name: place.name })
        .from(place)
        .where(
          and(
            eq(place.isActive, true),
            eq(place.province, province.name),
            eq(place.city, city.name),
          ),
        )
        .orderBy(desc(place.featuredRank), place.name)
        .limit(6),
    ]);

  const placeCount = Number(placeCountRow?.value ?? 0);
  const courtCount = Number(courtCountRow?.value ?? 0);
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
        name: `How do I book courts in ${city.displayName}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Search by sport in ${city.displayName}, compare venue options, and book available slots directly on KudosCourts.`,
        },
      },
      {
        "@type": "Question",
        name: `Which sports are available in ${city.displayName}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `KudosCourts lists active sports venues and courts in ${city.displayName}. Use the sport filters to narrow by the game you play.`,
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
        <Container className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {placeCount} active venue{placeCount === 1 ? "" : "s"} and{" "}
            {courtCount} indexed court{courtCount === 1 ? "" : "s"} in{" "}
            {city.displayName}, {province.displayName}.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href={appRoutes.courts.locations.province(province.slug)}
              className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:border-foreground/30 hover:text-foreground"
            >
              Back to {province.displayName}
            </Link>
            <Link
              href={appRoutes.ownersGetStarted.base}
              className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:border-foreground/30 hover:text-foreground"
            >
              List your venue for free
            </Link>
          </div>
          {venueRows.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold">
                Featured venues in this city
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
        </Container>
      </section>
      {sportRows.length > 0 && (
        <section className="border-b border-border bg-card py-5">
          <Container className="space-y-2">
            <p className="text-sm font-semibold">Browse by sport</p>
            <div className="flex flex-wrap gap-2">
              {sportRows.map((sportRow) => (
                <Link
                  key={sportRow.slug}
                  href={appRoutes.courts.locations.sport(
                    province.slug,
                    city.slug,
                    sportRow.slug,
                  )}
                  className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground hover:border-foreground/30"
                >
                  {sportRow.name} courts ({Number(sportRow.value ?? 0)})
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}
      <DiscoveryCourtsPage
        initialFilters={{ province: province.slug, city: city.slug }}
        initialLocationLabel={`${city.displayName}, ${province.displayName}`}
      />
    </>
  );
}
