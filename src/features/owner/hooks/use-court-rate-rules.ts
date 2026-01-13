"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

export function useCourtRateRules(courtId: string) {
  const trpc = useTRPC();

  return useQuery({
    ...trpc.courtRateRule.get.queryOptions({ courtId }),
    enabled: !!courtId,
  });
}

export function useSaveCourtRateRules(courtId: string) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    ...trpc.courtRateRule.set.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries(
        trpc.courtRateRule.get.queryFilter({ courtId }),
      );
    },
  });
}

export function useCopyCourtRateRules(targetCourtId: string) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    ...trpc.courtRateRule.copyFromCourt.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries(
        trpc.courtRateRule.get.queryFilter({ courtId: targetCourtId }),
      );
    },
  });
}
