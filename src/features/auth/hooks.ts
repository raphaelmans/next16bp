"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useSetOwnerOnboardingIntent } from "@/common/hooks/owner-onboarding-intent";
import { trpc } from "@/trpc/client";

// ============================================================================
// From use-auth.ts
// ============================================================================

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
 * Hook for Google OAuth login mutation.
 */
export function useLoginWithGoogle() {
  return trpc.auth.loginWithGoogle.useMutation();
}

/**
 * Hook for logout mutation.
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const setOwnerOnboardingIntent = useSetOwnerOnboardingIntent();

  return trpc.auth.logout.useMutation({
    onSuccess: async () => {
      await queryClient.cancelQueries(undefined, { silent: true });
      queryClient.clear();
      setOwnerOnboardingIntent.mutate(false);
    },
  });
}
