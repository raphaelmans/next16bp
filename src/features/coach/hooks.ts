"use client";

import { useMemo } from "react";
import {
  useFeatureMutation,
  useFeatureQuery,
  useFeatureQueryCache,
} from "@/common/feature-api-hooks";
import { getCoachApi } from "./api";

const coachApi = getCoachApi();

export type CoachBlockListRange = {
  startTime: string;
  endTime: string;
};

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
      invalidateCoachHours: (coachId: string) =>
        featureCache.invalidate(["coachHours", "get"], { coachId }),
      invalidateCoachRateRules: (coachId: string) =>
        featureCache.invalidate(["coachRateRule", "get"], { coachId }),
      invalidateCoachAddons: (coachId: string) =>
        featureCache.invalidate(["coachAddon", "get"], { coachId }),
      invalidateCoachBlocks: (input: {
        coachId: string;
        startTime: string;
        endTime: string;
      }) => featureCache.invalidate(["coachBlock", "list"], input),
    }),
    [featureCache],
  );
}

export function useQueryCoachHours(
  coachId: string | null,
  options?: {
    enabled?: boolean;
  },
) {
  const isEnabled = options?.enabled ?? true;

  return useFeatureQuery(
    ["coachHours", "get"],
    coachApi.queryCoachHoursGet,
    coachId ? { coachId } : undefined,
    {
      enabled: !!coachId && isEnabled,
    },
  );
}

export function useMutCoachSetHours(coachId: string) {
  const { invalidateCoachHours, invalidateCoachSetupStatus } =
    useModCoachInvalidation();

  return useFeatureMutation(coachApi.mutCoachHoursSet, {
    onSuccess: async () => {
      await Promise.all([
        invalidateCoachHours(coachId),
        invalidateCoachSetupStatus(),
      ]);
    },
  });
}

export function useQueryCoachBlocks(
  coachId: string | null,
  range: CoachBlockListRange,
  options?: {
    enabled?: boolean;
  },
) {
  const isEnabled = options?.enabled ?? true;

  return useFeatureQuery(
    ["coachBlock", "list"],
    coachApi.queryCoachBlockList,
    coachId ? { coachId, ...range } : undefined,
    {
      enabled: !!coachId && isEnabled,
    },
  );
}

export function useMutCoachCreateBlock(range: CoachBlockListRange) {
  const { invalidateCoachBlocks } = useModCoachInvalidation();

  return useFeatureMutation(coachApi.mutCoachBlockCreate, {
    onSuccess: async (_, variables) => {
      await invalidateCoachBlocks({
        coachId: variables.coachId,
        ...range,
      });
    },
  });
}

export function useMutCoachDeleteBlock(range: CoachBlockListRange) {
  const { invalidateCoachBlocks } = useModCoachInvalidation();

  return useFeatureMutation(coachApi.mutCoachBlockDelete, {
    onSuccess: async (_, variables) => {
      await invalidateCoachBlocks({
        coachId: variables.coachId,
        ...range,
      });
    },
  });
}

export function useQueryCoachRateRules(
  coachId: string | null,
  options?: {
    enabled?: boolean;
  },
) {
  const isEnabled = options?.enabled ?? true;

  return useFeatureQuery(
    ["coachRateRule", "get"],
    coachApi.queryCoachRateRuleGet,
    coachId ? { coachId } : undefined,
    {
      enabled: !!coachId && isEnabled,
    },
  );
}

export function useMutCoachSetRateRules(coachId: string) {
  const { invalidateCoachRateRules, invalidateCoachSetupStatus } =
    useModCoachInvalidation();

  return useFeatureMutation(coachApi.mutCoachRateRuleSet, {
    onSuccess: async () => {
      await Promise.all([
        invalidateCoachRateRules(coachId),
        invalidateCoachSetupStatus(),
      ]);
    },
  });
}

export function useQueryCoachAddons(
  coachId: string | null,
  options?: {
    enabled?: boolean;
  },
) {
  const isEnabled = options?.enabled ?? true;

  return useFeatureQuery(
    ["coachAddon", "get"],
    coachApi.queryCoachAddonGet,
    coachId ? { coachId } : undefined,
    {
      enabled: !!coachId && isEnabled,
    },
  );
}

export function useMutCoachSetAddons(coachId: string) {
  const { invalidateCoachAddons, invalidateCoachSetupStatus } =
    useModCoachInvalidation();

  return useFeatureMutation(coachApi.mutCoachAddonSet, {
    onSuccess: async () => {
      await Promise.all([
        invalidateCoachAddons(coachId),
        invalidateCoachSetupStatus(),
      ]);
    },
  });
}
