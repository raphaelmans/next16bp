import "server-only";

import { revalidatePath } from "next/cache";
import { appRoutes } from "@/common/app-routes";
import { logger } from "@/lib/shared/infra/logger";
import { revalidatePublicDiscoveryTier1 } from "./revalidate-public-discovery";

type RevalidatePublicPlaceDetailPathsInput = {
  placeId: string;
  placeSlug?: string | null;
  previousLocation?: {
    province?: string | null;
    city?: string | null;
  };
  nextLocation?: {
    province?: string | null;
    city?: string | null;
  };
  requestId?: string;
};

const LEGACY_PUBLIC_PLACE_BASE_PATH = "/places";

const normalizePathToken = (value?: string | null) => {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : undefined;
};

const addPublicPlacePaths = (paths: Set<string>, placeSlugOrId: string) => {
  paths.add(appRoutes.places.detail(placeSlugOrId));
  paths.add(`${LEGACY_PUBLIC_PLACE_BASE_PATH}/${placeSlugOrId}`);
};

export async function revalidatePublicPlaceDetailPaths({
  placeId,
  placeSlug,
  previousLocation,
  nextLocation,
  requestId,
}: RevalidatePublicPlaceDetailPathsInput): Promise<void> {
  try {
    const normalizedPlaceId = normalizePathToken(placeId);
    if (!normalizedPlaceId) {
      return;
    }

    const normalizedPlaceSlug = normalizePathToken(placeSlug);
    const slugToUse =
      normalizedPlaceSlug && normalizedPlaceSlug !== normalizedPlaceId
        ? normalizedPlaceSlug
        : undefined;

    const paths = new Set<string>();
    addPublicPlacePaths(paths, normalizedPlaceId);
    if (slugToUse && slugToUse !== normalizedPlaceId) {
      addPublicPlacePaths(paths, slugToUse);
    }

    for (const path of paths) {
      revalidatePath(path);
    }

    // If slug is unavailable, refresh dynamic place-detail page patterns to
    // invalidate slug-based public URLs without introducing router import cycles.
    if (!slugToUse) {
      revalidateAllPublicPlaceDetailPages(requestId);
    }

    await revalidatePublicDiscoveryTier1({
      placeId: normalizedPlaceId,
      previousLocation,
      nextLocation,
      requestId,
    });
  } catch (error) {
    logger.warn(
      {
        event: "cache.revalidate_public_place_detail.failed",
        placeId,
        placeSlug: placeSlug ?? null,
        previousLocation: previousLocation ?? null,
        nextLocation: nextLocation ?? null,
        requestId,
        error,
      },
      "Failed to revalidate public place detail paths",
    );
  }
}

export function revalidateAllPublicPlaceDetailPages(requestId?: string): void {
  try {
    revalidatePath("/venues/[placeId]", "page");
    revalidatePath("/places/[placeId]", "page");
  } catch (error) {
    logger.warn(
      {
        event: "cache.revalidate_public_place_detail_all.failed",
        requestId,
        error,
      },
      "Failed to revalidate all public place detail pages",
    );
  }
}
