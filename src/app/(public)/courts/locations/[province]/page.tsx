import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { env } from "@/lib/env";
import { findProvinceBySlug } from "@/shared/lib/ph-location-data";
import { getPHProvincesCities } from "@/shared/lib/ph-location-data.server";
import CourtsPageClient from "../../courts-page-client";

type CourtsProvincePageProps = {
  params: Promise<{ province: string }>;
};

const appUrl = env.NEXT_PUBLIC_APP_URL ?? "https://kudoscourts.com";

export async function generateMetadata({
  params,
}: CourtsProvincePageProps): Promise<Metadata> {
  const { province: provinceSlug } = await params;
  const provinces = await getPHProvincesCities();
  const province = findProvinceBySlug(provinces, provinceSlug);

  if (!province) {
    return {
      title: "Courts",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = `Courts in ${province.displayName}`;
  const description = `Browse pickleball, tennis, and multi-sport courts in ${province.displayName}.`;
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
}: CourtsProvincePageProps) {
  const { province: provinceSlug } = await params;
  const provinces = await getPHProvincesCities();
  const province = findProvinceBySlug(provinces, provinceSlug);

  if (!province) {
    return notFound();
  }

  return (
    <CourtsPageClient
      initialFilters={{ province: province.slug }}
      initialLocationLabel={province.displayName}
    />
  );
}
