import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findCityBySlug, findProvinceBySlug } from "@/common/ph-location-data";
import { env } from "@/lib/env";
import { getPHProvincesCities } from "@/lib/shared/lib/ph-location-data.server";
import CourtsPageClient from "../../../courts-page-client";

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

  const title = `Courts in ${city.displayName}, ${province.displayName}`;
  const description = `Discover courts in ${city.displayName}, ${province.displayName}, and book your next game fast.`;
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

  return (
    <CourtsPageClient
      initialFilters={{ province: province.slug, city: city.slug }}
      initialLocationLabel={`${city.displayName}, ${province.displayName}`}
    />
  );
}
