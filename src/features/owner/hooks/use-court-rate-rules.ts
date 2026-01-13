"use client";

import { trpc } from "@/trpc/client";

export function useCourtRateRules(courtId: string) {
  return trpc.courtRateRule.get.useQuery({ courtId }, { enabled: !!courtId });
}

export function useSaveCourtRateRules(courtId: string) {
  const utils = trpc.useUtils();

  return trpc.courtRateRule.set.useMutation({
    onSuccess: async () => {
      await utils.courtRateRule.get.invalidate({ courtId });
    },
  });
}

export function useCopyCourtRateRules(targetCourtId: string) {
  const utils = trpc.useUtils();

  return trpc.courtRateRule.copyFromCourt.useMutation({
    onSuccess: async () => {
      await utils.courtRateRule.get.invalidate({ courtId: targetCourtId });
    },
  });
}
