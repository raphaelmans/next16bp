"use client";

import {
  useFeatureMutation,
  useFeatureQuery,
} from "@/common/feature-api-hooks";
import { trpc } from "@/trpc/client";
import { getOwnerApi } from "../api.runtime";

const ownerApi = getOwnerApi();

export function useModCourtRateRules(
  courtId: string,
  options?: {
    enabled?: boolean;
  },
) {
  const isEnabled = options?.enabled ?? true;
  return useFeatureQuery(
    ["courtRateRule", "get"],
    ownerApi.queryCourtRateRuleGet,
    { courtId },
    { enabled: !!courtId && isEnabled },
  );
}

export function useMutSaveCourtRateRules(courtId: string) {
  const utils = trpc.useUtils();

  return useFeatureMutation(ownerApi.mutCourtRateRuleSet, {
    onSuccess: async () => {
      await utils.courtRateRule.get.invalidate({ courtId });
    },
  });
}

export function useMutCopyCourtRateRules(targetCourtId: string) {
  const utils = trpc.useUtils();

  return useFeatureMutation(ownerApi.mutCourtRateRuleCopyFromCourt, {
    onSuccess: async () => {
      await utils.courtRateRule.get.invalidate({ courtId: targetCourtId });
    },
  });
}
