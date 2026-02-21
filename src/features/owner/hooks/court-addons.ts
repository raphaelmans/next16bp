"use client";

import {
  useFeatureMutation,
  useFeatureQuery,
} from "@/common/feature-api-hooks";
import { trpc } from "@/trpc/client";
import { getOwnerApi } from "../api.runtime";

const ownerApi = getOwnerApi();

export function useQueryOwnerCourtAddons(
  courtId: string,
  options?: {
    enabled?: boolean;
  },
) {
  const isEnabled = options?.enabled ?? true;
  return useFeatureQuery(
    ["courtAddon", "get"],
    ownerApi.queryCourtAddonGet,
    { courtId },
    { enabled: !!courtId && isEnabled },
  );
}

export function useMutOwnerSaveCourtAddons(courtId: string) {
  const utils = trpc.useUtils();

  return useFeatureMutation(ownerApi.mutCourtAddonSet, {
    onSuccess: async () => {
      await utils.courtAddon.get.invalidate({ courtId });
    },
  });
}
