import "server-only";

import { revalidatePath, revalidateTag } from "next/cache";
import { appRoutes } from "@/common/app-routes";
import { logger } from "@/lib/shared/infra/logger";

type RevalidatePublicCoachDetailInput = {
  coachId: string;
  coachSlug?: string | null;
  requestId?: string;
};

const normalizePathToken = (value?: string | null) => {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : undefined;
};

export async function revalidatePublicCoachDetailPaths({
  coachId,
  coachSlug,
  requestId,
}: RevalidatePublicCoachDetailInput): Promise<void> {
  try {
    const normalizedCoachId = normalizePathToken(coachId);
    if (!normalizedCoachId) {
      return;
    }

    revalidatePath(appRoutes.coaches.detail(normalizedCoachId));
    revalidateTag("discovery:coaches:list", "max");

    const normalizedCoachSlug = normalizePathToken(coachSlug);
    if (normalizedCoachSlug && normalizedCoachSlug !== normalizedCoachId) {
      revalidatePath(appRoutes.coaches.detail(normalizedCoachSlug));
      return;
    }

    revalidatePath("/coaches/[id]", "page");
  } catch (error) {
    logger.warn(
      {
        event: "cache.revalidate_public_coach_detail.failed",
        coachId,
        coachSlug: coachSlug ?? null,
        requestId,
        error,
      },
      "Failed to revalidate public coach detail paths",
    );
  }
}
