"use client";

import { trpc } from "@/trpc/client";

export function useCourtHours(courtId: string) {
  return trpc.courtHours.get.useQuery({ courtId }, { enabled: !!courtId });
}

export function useSaveCourtHours(courtId: string) {
  const utils = trpc.useUtils();

  return trpc.courtHours.set.useMutation({
    onSuccess: async () => {
      await utils.courtHours.get.invalidate({ courtId });
    },
  });
}

export function useCopyCourtHours(targetCourtId: string) {
  const utils = trpc.useUtils();

  return trpc.courtHours.copyFromCourt.useMutation({
    onSuccess: async () => {
      await utils.courtHours.get.invalidate({ courtId: targetCourtId });
    },
  });
}
