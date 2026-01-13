"use client";

import { trpc } from "@/trpc/client";

/**
 * Hook to get current user session via tRPC.
 * Returns null if not authenticated.
 */
export function useSession() {
  return trpc.auth.me.useQuery(undefined, {
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for login mutation.
 */
export function useLogin() {
  const utils = trpc.useUtils();

  return trpc.auth.login.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
    },
  });
}

/**
 * Hook for register mutation.
 */
export function useRegister() {
  return trpc.auth.register.useMutation();
}

/**
 * Hook for magic link login mutation.
 */
export function useMagicLink() {
  return trpc.auth.loginWithMagicLink.useMutation();
}

/**
 * Hook for logout mutation.
 */
export function useLogout() {
  const utils = trpc.useUtils();

  return trpc.auth.logout.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      utils.auth.me.setData(undefined, undefined);
    },
  });
}
