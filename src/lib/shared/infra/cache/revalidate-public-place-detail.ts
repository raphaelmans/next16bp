import "server-only";

import { revalidatePath } from "next/cache";
import { appRoutes } from "@/common/app-routes";
import { logger } from "@/lib/shared/infra/logger";
import { publicCaller } from "@/trpc/server";

type RevalidatePublicPlaceDetailPathsInput = {
  placeId: string;
  placeSlug?: string | null;
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

const resolvePlaceSlug = async (placeId: string) => {
  try {
    const placeDetails = await publicCaller.place.getByIdOrSlug({
      placeIdOrSlug: placeId,
    });
    return normalizePathToken(placeDetails.place.slug);
  } catch {
    return undefined;
  }
};

export async function revalidatePublicPlaceDetailPaths({
  placeId,
  placeSlug,
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
        : await resolvePlaceSlug(normalizedPlaceId);

    const paths = new Set<string>();
    addPublicPlacePaths(paths, normalizedPlaceId);
    if (slugToUse && slugToUse !== normalizedPlaceId) {
      addPublicPlacePaths(paths, slugToUse);
    }

    for (const path of paths) {
      revalidatePath(path);
    }
  } catch (error) {
    logger.warn(
      {
        event: "cache.revalidate_public_place_detail.failed",
        placeId,
        placeSlug: placeSlug ?? null,
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
