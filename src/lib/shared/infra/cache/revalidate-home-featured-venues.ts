import "server-only";

import { revalidatePath, revalidateTag } from "next/cache";
import { appRoutes } from "@/common/app-routes";
import { logger } from "@/lib/shared/infra/logger";

export const HOME_FEATURED_VENUES_CACHE_TAG = "home:featured";

export async function revalidateHomeFeaturedVenues(
  requestId?: string,
): Promise<void> {
  try {
    revalidatePath(appRoutes.index.base);
    revalidateTag(HOME_FEATURED_VENUES_CACHE_TAG, "max");
  } catch (error) {
    logger.warn(
      {
        event: "cache.revalidate_home_featured_venues.failed",
        requestId,
        error,
      },
      "Failed to revalidate landing page featured venues cache",
    );
  }
}
