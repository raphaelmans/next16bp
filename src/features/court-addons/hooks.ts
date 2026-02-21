"use client";

import {
  useFeatureMutation,
  useFeatureQuery,
} from "@/common/feature-api-hooks";
import { trpc } from "@/trpc/client";
import { getCourtAddonsApi } from "./api.runtime";
import type { CourtAddonConfig } from "./helpers";

const courtAddonsApi = getCourtAddonsApi();

export function useQueryCourtAddons(
  courtId: string,
  options?: {
    enabled?: boolean;
  },
) {
  const isEnabled = options?.enabled ?? true;
  return useFeatureQuery(
    ["courtAddon", "get"],
    courtAddonsApi.queryCourtAddonGet,
    { courtId },
    { enabled: !!courtId && isEnabled },
  ) as ReturnType<typeof useFeatureQuery> & {
    data: CourtAddonConfig[] | undefined;
  };
}

export function useMutSetCourtAddons(courtId: string) {
  const utils = trpc.useUtils();

  return useFeatureMutation(courtAddonsApi.mutCourtAddonSet, {
    onSuccess: async () => {
      await utils.courtAddon.get.invalidate({ courtId });
    },
  });
}
