"use client";

import {
  useFeatureMutation,
  useFeatureQuery,
} from "@/common/feature-api-hooks";
import { trpc } from "@/trpc/client";
import { getOwnerApi } from "../api.runtime";

const ownerApi = getOwnerApi();

export function useModCourtHours(
  courtId: string,
  options?: {
    enabled?: boolean;
  },
) {
  const isEnabled = options?.enabled ?? true;
  return useFeatureQuery(
    ["courtHours", "get"],
    ownerApi.queryCourtHoursGet,
    { courtId },
    { enabled: !!courtId && isEnabled },
  );
}

export function useMutSaveCourtHours(courtId: string) {
  const utils = trpc.useUtils();

  return useFeatureMutation(ownerApi.mutCourtHoursSet, {
    onSuccess: async () => {
      await utils.courtHours.get.invalidate({ courtId });
    },
  });
}

export function useMutCopyCourtHours(targetCourtId: string) {
  const utils = trpc.useUtils();

  return useFeatureMutation(ownerApi.mutCourtHoursCopyFromCourt, {
    onSuccess: async () => {
      await utils.courtHours.get.invalidate({ courtId: targetCourtId });
    },
  });
}
