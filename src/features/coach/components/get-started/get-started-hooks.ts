"use client";

import { useQueryCoachSetupStatus } from "@/features/coach/hooks";
import { buildEmptyCoachSetupStatus } from "@/lib/modules/coach-setup/shared";

export function useModCoachGetStartedSetup() {
  const { data, isLoading, isFetching, error, refetch } =
    useQueryCoachSetupStatus();

  return {
    status: data ?? buildEmptyCoachSetupStatus(),
    raw: data ?? null,
    isLoading,
    isFetching,
    error,
    refetch,
  } as const;
}
