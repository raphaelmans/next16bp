import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { appRoutes } from "@/common/app-routes";
import { findCityBySlug, findProvinceBySlug } from "@/common/ph-location-data";
import { DiscoveryCoachesPage } from "@/features/coach-discovery/pages/coaches-page";
import { getPHProvincesCities } from "@/lib/shared/lib/ph-location-data.server";
import { getCanonicalOrigin } from "@/lib/shared/utils/canonical-origin";
import { publicCaller } from "@/trpc/server";

type CoachesCitySportPageProps = {
  params: Promise<{ province: string; city: string; sport: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const appUrl = getCanonicalOrigin();

const resolveSportContext = async (params: {
  province: string;
  city: string;
  sport: string;
}) => {
  const provinces = await getPHProvincesCities();
  const province = findProvinceBySlug(provinces, params.province);
  const city = province ? findCityBySlug(province, params.city) : null;

  if (!province || !city) {
    return null;
  }

  const sport = (await publicCaller.sport.list()).find(
    (entry) => entry.slug === params.sport,
  );

  if (!sport) {
    return null;
  }

  return { province, city, sport };
};

export async function generateMetadata({
  params,
}: CoachesCitySportPageProps): Promise<Metadata> {
  const context = await resolveSportContext(await params);

  if (!context) {
    return {
      title: "Coaches",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = `${context.sport.name} Coaches in ${context.city.displayName}, ${context.province.displayName} — Philippines`;
  const description = `Explore ${context.sport.name.toLowerCase()} coaches in ${context.city.displayName}, ${context.province.displayName}. Compare specialties, coaching styles, and session pricing on KudosCourts.`;
  const canonicalUrl = new URL(
    appRoutes.coaches.locations.sport(
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

export default async function CoachesCitySportPage({
  params,
  searchParams,
}: CoachesCitySportPageProps) {
  const context = await resolveSportContext(await params);

  if (!context) {
    return notFound();
  }

  const canonicalPath = appRoutes.coaches.locations.sport(
    context.province.slug,
    context.city.slug,
    context.sport.slug,
  );

  return (
    <DiscoveryCoachesPage
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
  );
}
