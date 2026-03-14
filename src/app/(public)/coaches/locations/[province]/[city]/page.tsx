import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { appRoutes } from "@/common/app-routes";
import { findCityBySlug, findProvinceBySlug } from "@/common/ph-location-data";
import { DiscoveryCoachesPage } from "@/features/coach-discovery/pages/coaches-page";
import { getPHProvincesCities } from "@/lib/shared/lib/ph-location-data.server";
import { getCanonicalOrigin } from "@/lib/shared/utils/canonical-origin";

type CoachesCityPageProps = {
  params: Promise<{ province: string; city: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const appUrl = getCanonicalOrigin();

const resolveCityContext = async (params: {
  province: string;
  city: string;
}) => {
  const provinces = await getPHProvincesCities();
  const province = findProvinceBySlug(provinces, params.province);
  const city = province ? findCityBySlug(province, params.city) : null;

  if (!province || !city) {
    return null;
  }

  return { province, city };
};

export async function generateMetadata({
  params,
}: CoachesCityPageProps): Promise<Metadata> {
  const context = await resolveCityContext(await params);

  if (!context) {
    return {
      title: "Coaches",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = `Sports Coaches in ${context.city.displayName}, ${context.province.displayName} — Philippines`;
  const description = `Find sports coaches in ${context.city.displayName}, ${context.province.displayName}. Compare specialties, price bands, and coaching formats on KudosCourts.`;
  const canonicalUrl = new URL(
    appRoutes.coaches.locations.city(context.province.slug, context.city.slug),
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

export default async function CoachesCityPage({
  params,
  searchParams,
}: CoachesCityPageProps) {
  const context = await resolveCityContext(await params);

  if (!context) {
    return notFound();
  }

  const canonicalPath = appRoutes.coaches.locations.city(
    context.province.slug,
    context.city.slug,
  );

  return (
    <DiscoveryCoachesPage
      initialFilters={{
        province: context.province.slug,
        city: context.city.slug,
      }}
      initialLocationLabel={`${context.city.displayName}, ${context.province.displayName}`}
      locationRoutePath={canonicalPath}
      locationRouteScope="city"
      searchParams={await searchParams}
    />
  );
}
