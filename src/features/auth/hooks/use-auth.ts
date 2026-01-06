"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { getQueryClient } from "@/trpc/query-client";

/**
 * Hook to get current user session via tRPC.
 * Returns null if not authenticated.
 */
export function useSession() {
  const trpc = useTRPC();
  return useQuery({
    ...trpc.auth.me.queryOptions(),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for login mutation.
 */
export function useLogin() {
  const trpc = useTRPC();
  const queryClient = getQueryClient();

  return useMutation({
    ...trpc.auth.login.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.auth.me.queryKey() });
    },
  });
}

/**
 * Hook for register mutation.
 */
export function useRegister() {
  const trpc = useTRPC();

  return useMutation({
    ...trpc.auth.register.mutationOptions(),
  });
}

/**
 * Hook for magic link login mutation.
 */
export function useMagicLink() {
  const trpc = useTRPC();

  return useMutation({
    ...trpc.auth.loginWithMagicLink.mutationOptions(),
  });
}

/**
 * Hook for logout mutation.
 */
export function useLogout() {
  const trpc = useTRPC();
  const queryClient = getQueryClient();

  return useMutation({
    ...trpc.auth.logout.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.auth.me.queryKey() });
      queryClient.removeQueries({ queryKey: trpc.auth.me.queryKey() });
    },
  });
}
