import { and, countDistinct, eq, isNull, sql } from "drizzle-orm";
import type { MetadataRoute } from "next";
import { appRoutes } from "@/common/app-routes";
import {
  isSeoIndexableOrganizationSurface,
  isSeoIndexablePlaceSurface,
} from "@/common/seo-indexability";
import { db } from "@/lib/shared/infra/db/drizzle";
import {
  court,
  organization,
  organizationProfile,
  place,
  placeContactDetail,
  placePhoto,
  placeReview,
  placeVerification,
  sport,
} from "@/lib/shared/infra/db/schema";
import {
  getPHProvincesCities,
  resolveLocationSlugs,
} from "@/lib/shared/lib/ph-location-data.server";
import { buildCanonicalUrl } from "@/lib/shared/utils/canonical-origin";

export const revalidate = 3600;

const buildUrl = (path: string) => buildCanonicalUrl(path);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [placeRows, orgRows, locationRows, locationSportRows] =
    await Promise.all([
      db
        .select({
          slug: place.slug,
          updatedAt: place.updatedAt,
          name: place.name,
          address: place.address,
          city: place.city,
          province: place.province,
          activeCourtCount: countDistinct(court.id),
          photoCount: countDistinct(placePhoto.id),
          verificationStatus: placeVerification.status,
          hasContactDetails: sql<number>`max(case
            when ${placeContactDetail.phoneNumber} is not null
              or ${placeContactDetail.websiteUrl} is not null
              or ${placeContactDetail.facebookUrl} is not null
              or ${placeContactDetail.instagramUrl} is not null
              or ${placeContactDetail.viberInfo} is not null
              or ${placeContactDetail.otherContactInfo} is not null
            then 1
            else 0
          end)`,
          reviewCount: countDistinct(placeReview.id),
        })
        .from(place)
        .leftJoin(
          court,
          and(eq(court.placeId, place.id), eq(court.isActive, true)),
        )
        .leftJoin(placePhoto, eq(placePhoto.placeId, place.id))
        .leftJoin(placeContactDetail, eq(placeContactDetail.placeId, place.id))
        .leftJoin(placeVerification, eq(placeVerification.placeId, place.id))
        .leftJoin(
          placeReview,
          and(eq(placeReview.placeId, place.id), isNull(placeReview.removedAt)),
        )
        .where(eq(place.isActive, true))
        .groupBy(place.id, placeVerification.status),
      db
        .select({
          slug: organization.slug,
          updatedAt: organization.updatedAt,
          name: organization.name,
          venueCount: countDistinct(place.id),
          totalCourts: countDistinct(court.id),
          hasProfileContent: sql<number>`max(case
            when ${organizationProfile.description} is not null
              or ${organizationProfile.logoUrl} is not null
              or ${organizationProfile.contactEmail} is not null
              or ${organizationProfile.contactPhone} is not null
              or ${organizationProfile.address} is not null
            then 1
            else 0
          end)`,
        })
        .from(organization)
        .leftJoin(
          organizationProfile,
          eq(organizationProfile.organizationId, organization.id),
        )
        .leftJoin(
          place,
          and(
            eq(place.organizationId, organization.id),
            eq(place.isActive, true),
          ),
        )
        .leftJoin(
          court,
          and(eq(court.placeId, place.id), eq(court.isActive, true)),
        )
        .where(eq(organization.isActive, true))
        .groupBy(organization.id),
      db
        .select({ province: place.province, city: place.city })
        .from(place)
        .where(eq(place.isActive, true))
        .groupBy(place.province, place.city),
      db
        .select({
          province: place.province,
          city: place.city,
          sportSlug: sport.slug,
        })
        .from(place)
        .innerJoin(
          court,
          and(eq(court.placeId, place.id), eq(court.isActive, true)),
        )
        .innerJoin(sport, eq(sport.id, court.sportId))
        .where(eq(place.isActive, true))
        .groupBy(place.province, place.city, sport.slug),
    ]);

  const provinces = await getPHProvincesCities();
  const provinceSet = new Set<string>();
  const citySet = new Set<string>();
  const citySportSet = new Set<string>();

  locationRows.forEach((row) => {
    const resolved = resolveLocationSlugs(provinces, row.province, row.city);
    if (resolved.provinceSlug) {
      provinceSet.add(resolved.provinceSlug);
    }
    if (resolved.provinceSlug && resolved.citySlug) {
      citySet.add(`${resolved.provinceSlug}/${resolved.citySlug}`);
    }
  });

  locationSportRows.forEach((row) => {
    const resolved = resolveLocationSlugs(provinces, row.province, row.city);
    if (resolved.provinceSlug && resolved.citySlug) {
      citySportSet.add(
        `${resolved.provinceSlug}/${resolved.citySlug}/${row.sportSlug}`,
      );
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
      url: buildUrl(appRoutes.ownersGetStarted.base),
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
      url: buildUrl(appRoutes.courts.locations.province(provinceSlug)),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...Array.from(citySet).map((cityPath) => ({
      url: buildUrl(`${appRoutes.courts.base}/locations/${cityPath}`),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...Array.from(citySportSet).map((citySportPath) => ({
      url: buildUrl(`${appRoutes.courts.base}/locations/${citySportPath}`),
      changeFrequency: "weekly" as const,
      priority: 0.65,
    })),
  ];

  const placeEntries: MetadataRoute.Sitemap = placeRows
    .filter((row) =>
      isSeoIndexablePlaceSurface({
        slug: row.slug,
        name: row.name,
        address: row.address,
        city: row.city,
        province: row.province,
        activeCourtCount: row.activeCourtCount,
        photoCount: row.photoCount,
        hasContactDetails: row.hasContactDetails > 0,
        verificationStatus: row.verificationStatus,
      }),
    )
    .map((row) => ({
      url: buildUrl(appRoutes.places.detail(row.slug)),
      lastModified: row.updatedAt ?? undefined,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

  const orgEntries: MetadataRoute.Sitemap = orgRows
    .filter((row) =>
      isSeoIndexableOrganizationSurface({
        slug: row.slug,
        name: row.name,
        venueCount: row.venueCount,
        totalCourts: row.totalCourts,
        hasProfileContent: row.hasProfileContent > 0,
      }),
    )
    .map((row) => ({
      url: buildUrl(`/org/${row.slug}`),
      lastModified: row.updatedAt ?? undefined,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

  const placeReviewEntries: MetadataRoute.Sitemap = placeRows
    .filter(
      (row) =>
        row.reviewCount > 0 &&
        isSeoIndexablePlaceSurface({
          slug: row.slug,
          name: row.name,
          address: row.address,
          city: row.city,
          province: row.province,
          activeCourtCount: row.activeCourtCount,
          photoCount: row.photoCount,
          hasContactDetails: row.hasContactDetails > 0,
          verificationStatus: row.verificationStatus,
        }),
    )
    .map((row) => ({
      url: buildUrl(appRoutes.places.reviews(row.slug)),
      lastModified: row.updatedAt ?? undefined,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

  return [
    ...staticEntries,
    ...locationEntries,
    ...placeEntries,
    ...placeReviewEntries,
    ...orgEntries,
  ];
}
