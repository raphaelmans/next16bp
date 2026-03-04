"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { getQueryClient } from "@/trpc/query-client";

export function useProfile() {
  const trpc = useTRPC();

  return useQuery({
    ...trpc.profile.me.queryOptions(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateProfile() {
  const trpc = useTRPC();
  const queryClient = getQueryClient();

  return useMutation({
    ...trpc.profile.update.mutationOptions(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: trpc.profile.me.queryKey(),
      });
      await queryClient.invalidateQueries({
        queryKey: trpc.auth.me.queryKey(),
      });
    },
  });
}
