"use client";

import { useMemo } from "react";
import {
  useFeatureQuery,
  useFeatureQueryCache,
} from "@/common/feature-api-hooks";
import { getCoachApi } from "./api";

const coachApi = getCoachApi();

export function useQueryCoachSetupStatus() {
  return useFeatureQuery(
    ["coach", "getSetupStatus"],
    coachApi.queryCoachGetSetupStatus,
    undefined,
    {
      staleTime: 0,
      refetchOnMount: "always",
    },
  );
}

export function useModCoachInvalidation() {
  const featureCache = useFeatureQueryCache();

  return useMemo(
    () => ({
      invalidateCoachSetupStatus: () =>
        featureCache.invalidate(["coach", "getSetupStatus"]),
    }),
    [featureCache],
  );
}
