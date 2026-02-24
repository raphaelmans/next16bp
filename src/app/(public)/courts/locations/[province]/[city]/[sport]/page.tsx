import { and, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { appRoutes } from "@/common/app-routes";
import { findCityBySlug, findProvinceBySlug } from "@/common/ph-location-data";
import { DiscoveryCourtsPage } from "@/features/discovery/pages/courts-page";
import { env } from "@/lib/env";
import { db } from "@/lib/shared/infra/db/drizzle";
import {
  court,
  place,
  sport as sportTable,
} from "@/lib/shared/infra/db/schema";
import { getPHProvincesCities } from "@/lib/shared/lib/ph-location-data.server";

type CourtsCitySportPageProps = {
  params: Promise<{ province: string; city: string; sport: string }>;
};

const appUrl = env.NEXT_PUBLIC_APP_URL ?? "https://kudoscourts.com";

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
}: CourtsCitySportPageProps) {
  const resolvedParams = await params;
  const context = await resolveSportPageContext(resolvedParams);

  if (!context) {
    return notFound();
  }

  return (
    <DiscoveryCourtsPage
      initialFilters={{
        province: context.province.slug,
        city: context.city.slug,
        sportId: context.sport.id,
      }}
      initialLocationLabel={`${context.city.displayName}, ${context.province.displayName}`}
    />
  );
}
