import "server-only";

import { revalidatePath } from "next/cache";
import { appRoutes } from "@/common/app-routes";
import { logger } from "@/lib/shared/infra/logger";

type RevalidateTarget = {
  path: string;
  type?: Parameters<typeof revalidatePath>[1];
};

export const PUBLIC_COURTS_REVALIDATE_TARGETS: readonly RevalidateTarget[] = [
  { path: appRoutes.courts.base },
  { path: "/courts/locations/[province]", type: "page" },
  { path: "/courts/locations/[province]/[city]", type: "page" },
  {
    path: "/courts/locations/[province]/[city]/[sport]",
    type: "page",
  },
] as const;

export async function revalidatePublicCourtsPages(
  requestId?: string,
): Promise<void> {
  try {
    for (const target of PUBLIC_COURTS_REVALIDATE_TARGETS) {
      revalidatePath(target.path, target.type);
    }
  } catch (error) {
    logger.warn(
      {
        event: "cache.revalidate_public_courts_pages.failed",
        requestId,
        error,
      },
      "Failed to revalidate public courts pages",
    );
  }
}
