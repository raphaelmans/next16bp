"use client";

import { trpc } from "@/trpc/client";

export function useOwnerSetupStatus() {
  return trpc.ownerSetup.getStatus.useQuery(undefined, {
    staleTime: 0,
    refetchOnMount: "always",
  });
}
