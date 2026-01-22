import { eq } from "drizzle-orm";
import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { db } from "@/shared/infra/db/drizzle";
import { organization, place } from "@/shared/infra/db/schema";
import { appRoutes } from "@/shared/lib/app-routes";
import {
  getPHProvincesCities,
  resolveLocationSlugs,
} from "@/shared/lib/ph-location-data.server";

export const revalidate = 3600;

const appUrl = env.NEXT_PUBLIC_APP_URL ?? "https://kudoscourts.com";
const buildUrl = (path: string) => new URL(path, appUrl).toString();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [placeRows, orgRows, locationRows] = await Promise.all([
    db
      .select({ slug: place.slug, updatedAt: place.updatedAt })
      .from(place)
      .where(eq(place.isActive, true)),
    db
      .select({ slug: organization.slug, updatedAt: organization.updatedAt })
      .from(organization)
      .where(eq(organization.isActive, true)),
    db
      .select({ province: place.province, city: place.city })
      .from(place)
      .where(eq(place.isActive, true))
      .groupBy(place.province, place.city),
  ]);

  const provinces = await getPHProvincesCities();
  const provinceSet = new Set<string>();
  const citySet = new Set<string>();

  locationRows.forEach((row) => {
    const resolved = resolveLocationSlugs(provinces, row.province, row.city);
    if (resolved.provinceSlug) {
      provinceSet.add(resolved.provinceSlug);
    }
    if (resolved.provinceSlug && resolved.citySlug) {
      citySet.add(`${resolved.provinceSlug}/${resolved.citySlug}`);
    }
  });

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: buildUrl(appRoutes.index.base),
      changeFrequency: "daily" as const,
      priority: 1,
    },
    {
      url: buildUrl(appRoutes.courts.base),
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    {
      url: buildUrl(appRoutes.listYourVenue.base),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    },
    {
      url: buildUrl(appRoutes.contactUs.base),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
    {
      url: buildUrl(appRoutes.about.base),
      changeFrequency: "monthly" as const,
      priority: 0.4,
    },
    {
      url: buildUrl(appRoutes.blog.base),
      changeFrequency: "weekly" as const,
      priority: 0.4,
    },
    {
      url: buildUrl(appRoutes.terms.base),
      changeFrequency: "yearly" as const,
      priority: 0.2,
    },
    {
      url: buildUrl(appRoutes.privacy.base),
      changeFrequency: "yearly" as const,
      priority: 0.2,
    },
    {
      url: buildUrl(appRoutes.cookies.base),
      changeFrequency: "yearly" as const,
      priority: 0.2,
    },
  ];

  const locationEntries: MetadataRoute.Sitemap = [
    ...Array.from(provinceSet).map((provinceSlug) => ({
      url: buildUrl(`/courts/locations/${provinceSlug}`),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...Array.from(citySet).map((cityPath) => ({
      url: buildUrl(`/courts/locations/${cityPath}`),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];

  const placeEntries: MetadataRoute.Sitemap = placeRows.map((row) => ({
    url: buildUrl(appRoutes.places.detail(row.slug)),
    lastModified: row.updatedAt ?? undefined,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const orgEntries: MetadataRoute.Sitemap = orgRows.map((row) => ({
    url: buildUrl(`/org/${row.slug}`),
    lastModified: row.updatedAt ?? undefined,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticEntries, ...locationEntries, ...placeEntries, ...orgEntries];
}
