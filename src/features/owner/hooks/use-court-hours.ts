"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

export function useCourtHours(courtId: string) {
  const trpc = useTRPC();

  return useQuery({
    ...trpc.courtHours.get.queryOptions({ courtId }),
    enabled: !!courtId,
  });
}

export function useSaveCourtHours(courtId: string) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    ...trpc.courtHours.set.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries(
        trpc.courtHours.get.queryFilter({ courtId }),
      );
    },
  });
}
