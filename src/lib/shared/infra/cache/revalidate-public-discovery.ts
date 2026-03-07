import "server-only";

import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { buildDiscoveryTier1CacheTags } from "@/features/discovery/query-options";
import { db } from "@/lib/shared/infra/db/drizzle";
import { place } from "@/lib/shared/infra/db/schema";
import { logger } from "@/lib/shared/infra/logger";
import {
  getPHProvincesCities,
  resolveLocationSlugs,
} from "@/lib/shared/lib/ph-location-data.server";

type PlaceLocationScope = {
  province?: string | null;
  city?: string | null;
};

type RevalidatePublicDiscoveryTier1Input = {
  placeId?: string;
  previousLocation?: PlaceLocationScope;
  nextLocation?: PlaceLocationScope;
  requestId?: string;
};

const normalizeString = (value?: string | null) => {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : undefined;
};

const resolveLocationTags = async (location?: PlaceLocationScope) => {
  const province = normalizeString(location?.province);
  const city = normalizeString(location?.city);

  if (!province && !city) {
    return [];
  }

  const provinces = await getPHProvincesCities();
  const resolved = resolveLocationSlugs(provinces, province, city);

  return buildDiscoveryTier1CacheTags({
    provinceSlug: resolved.provinceSlug ?? province,
    citySlug: resolved.citySlug ?? city,
  });
};

export async function revalidatePublicDiscoveryTier1({
  placeId,
  previousLocation,
  nextLocation,
  requestId,
}: RevalidatePublicDiscoveryTier1Input): Promise<void> {
  try {
    const tags = new Set<string>(buildDiscoveryTier1CacheTags());

    for (const tag of await resolveLocationTags(previousLocation)) {
      tags.add(tag);
    }

    for (const tag of await resolveLocationTags(nextLocation)) {
      tags.add(tag);
    }

    if (!previousLocation && !nextLocation && placeId) {
      const [placeRow] = await db
        .select({
          province: place.province,
          city: place.city,
        })
        .from(place)
        .where(eq(place.id, placeId))
        .limit(1);

      for (const tag of await resolveLocationTags(placeRow)) {
        tags.add(tag);
      }
    }

    for (const tag of tags) {
      revalidateTag(tag, "max");
    }
  } catch (error) {
    logger.warn(
      {
        event: "cache.revalidate_public_discovery.failed",
        placeId: placeId ?? null,
        previousLocation: previousLocation ?? null,
        nextLocation: nextLocation ?? null,
        requestId,
        error,
      },
      "Failed to revalidate public discovery cache tags",
    );
  }
}
