"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  useFeatureMutation,
  useFeatureQuery,
} from "@/common/feature-api-hooks";
import { useSetOwnerOnboardingIntent } from "@/common/hooks/owner-onboarding-intent";
import { trpc } from "@/trpc/client";
import { getAuthApi } from "./api.runtime";

const authApi = getAuthApi();

export function useQueryAuthSession() {
  return useFeatureQuery(["auth", "me"], authApi.queryAuthMe, undefined, {
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useMutAuthLogin() {
  const utils = trpc.useUtils();

  return useFeatureMutation(authApi.mutAuthLogin, {
    onSuccess: async () => {
      await utils.auth.me.invalidate();
    },
  });
}

export function useMutAuthRegister() {
  return useFeatureMutation(authApi.mutAuthRegister);
}

export function useMutAuthMagicLink() {
  return useFeatureMutation(authApi.mutAuthLoginWithMagicLink);
}

export function useMutAuthRequestEmailOtp() {
  return useFeatureMutation(authApi.mutAuthRequestEmailOtp);
}

export function useMutAuthVerifyEmailOtp() {
  const utils = trpc.useUtils();

  return useFeatureMutation(authApi.mutAuthVerifyEmailOtp, {
    onSuccess: async () => {
      await utils.auth.me.invalidate();
    },
  });
}

export function useMutAuthVerifySignUpOtp() {
  const utils = trpc.useUtils();

  return useFeatureMutation(authApi.mutAuthVerifySignUpOtp, {
    onSuccess: async () => {
      await utils.auth.me.invalidate();
    },
  });
}

export function useMutAuthResendSignUpOtp() {
  return useFeatureMutation(authApi.mutAuthResendSignUpOtp);
}

export function useMutAuthLoginWithGoogle() {
  return useFeatureMutation(authApi.mutAuthLoginWithGoogle);
}

export function useMutAuthLogout() {
  const queryClient = useQueryClient();
  const setOwnerOnboardingIntent = useSetOwnerOnboardingIntent();

  return useFeatureMutation(authApi.mutAuthLogout, {
    onSuccess: async () => {
      await queryClient.cancelQueries(undefined, { silent: true });
      queryClient.clear();
      setOwnerOnboardingIntent.mutate(false);
    },
  });
}

export function useQueryAuthMyOrganizations(enabled: boolean) {
  return useFeatureQuery(
    ["organization", "my"],
    authApi.queryOrganizationMy,
    undefined,
    { enabled },
  );
}

type PortalDefault = "player" | "owner";

type UsePortalSwitcherDataOptions = {
  inferAdmin: boolean;
  inferOwner: boolean;
  onSetDefaultPortalError?: (error: unknown) => void;
};

export function useModPortalSwitcherData({
  inferAdmin,
  inferOwner,
  onSetDefaultPortalError,
}: UsePortalSwitcherDataOptions) {
  const sessionQuery = useFeatureQuery(
    ["auth", "me"],
    authApi.queryAuthMe,
    undefined,
    {
      retry: false,
      enabled: inferAdmin || inferOwner,
    },
  );

  const organizationsQuery = useFeatureQuery(
    ["organization", "my"],
    authApi.queryOrganizationMy,
    undefined,
    {
      enabled: inferOwner && !!sessionQuery.data,
    },
  );

  const setDefaultPortalMutation = useFeatureMutation(
    authApi.mutUserPreferenceSetDefaultPortal,
    {
      onError: (error) => {
        onSetDefaultPortalError?.(error);
      },
    },
  );

  const setDefaultPortal = (portal: PortalDefault) => {
    setDefaultPortalMutation.mutate({
      defaultPortal: portal,
    });
  };

  return {
    sessionUser: sessionQuery.data,
    organizations: organizationsQuery.data,
    setDefaultPortal,
    setDefaultPortalMutation,
  };
}
