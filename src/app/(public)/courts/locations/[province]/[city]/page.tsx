import { and, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { appRoutes } from "@/common/app-routes";
import { findCityBySlug, findProvinceBySlug } from "@/common/ph-location-data";
import { Container } from "@/components/layout";
import { DiscoveryCourtsPage } from "@/features/discovery/pages/courts-page";
import { env } from "@/lib/env";
import { db } from "@/lib/shared/infra/db/drizzle";
import { court, place, sport } from "@/lib/shared/infra/db/schema";
import { getPHProvincesCities } from "@/lib/shared/lib/ph-location-data.server";

type CourtsCityPageProps = {
  params: Promise<{ province: string; city: string }>;
};

const appUrl = env.NEXT_PUBLIC_APP_URL ?? "https://kudoscourts.com";

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

  const sportRows = await db
    .select({ slug: sport.slug, name: sport.name })
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
    .groupBy(sport.slug, sport.name);

  return (
    <>
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
                  {sportRow.name} courts
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
