"use client";

import {
  useFeatureMutation,
  useFeatureQuery,
} from "@/common/feature-api-hooks";
import { trpc } from "@/trpc/client";
import { getOwnerApi } from "../api.runtime";

const ownerApi = getOwnerApi();

export function useQueryOwnerPlaceAddons(
  placeId: string,
  options?: {
    enabled?: boolean;
  },
) {
  const isEnabled = options?.enabled ?? true;
  return useFeatureQuery(
    ["placeAddon", "get"],
    ownerApi.queryPlaceAddonGet,
    { placeId },
    { enabled: !!placeId && isEnabled },
  );
}

export function useMutOwnerSavePlaceAddons(placeId: string) {
  const utils = trpc.useUtils();

  return useFeatureMutation(ownerApi.mutPlaceAddonSet, {
    onSuccess: async () => {
      await utils.placeAddon.get.invalidate({ placeId });
    },
  });
}
