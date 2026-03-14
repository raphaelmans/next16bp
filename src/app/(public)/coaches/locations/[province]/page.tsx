import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { appRoutes } from "@/common/app-routes";
import { findProvinceBySlug } from "@/common/ph-location-data";
import { DiscoveryCoachesPage } from "@/features/coach-discovery/pages/coaches-page";
import { getPHProvincesCities } from "@/lib/shared/lib/ph-location-data.server";
import { getCanonicalOrigin } from "@/lib/shared/utils/canonical-origin";

type CoachesProvincePageProps = {
  params: Promise<{ province: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const appUrl = getCanonicalOrigin();

const resolveProvince = async (provinceSlug: string) => {
  const provinces = await getPHProvincesCities();
  return findProvinceBySlug(provinces, provinceSlug) ?? null;
};

export async function generateMetadata({
  params,
}: CoachesProvincePageProps): Promise<Metadata> {
  const { province: provinceSlug } = await params;
  const province = await resolveProvince(provinceSlug);

  if (!province) {
    return {
      title: "Coaches",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = `Sports Coaches in ${province.displayName}, Philippines`;
  const description = `Browse sports coaches in ${province.displayName}, Philippines. Filter by city, sport, price, and coaching fit on KudosCourts.`;
  const canonicalUrl = new URL(
    appRoutes.coaches.locations.province(province.slug),
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

export default async function CoachesProvincePage({
  params,
  searchParams,
}: CoachesProvincePageProps) {
  const { province: provinceSlug } = await params;
  const province = await resolveProvince(provinceSlug);

  if (!province) {
    return notFound();
  }

  const canonicalPath = appRoutes.coaches.locations.province(province.slug);

  return (
    <DiscoveryCoachesPage
      initialFilters={{ province: province.slug }}
      initialLocationLabel={province.displayName}
      locationRoutePath={canonicalPath}
      locationRouteScope="province"
      searchParams={await searchParams}
    />
  );
}
