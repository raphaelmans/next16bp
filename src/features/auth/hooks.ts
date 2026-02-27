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

export const PORTAL_STORAGE_KEY = "kudos.default-portal";

export interface AuthSessionUser {
  id?: string;
  email?: string;
  role?: string;
  displayName?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  name?: string;
  image?: string;
}

export interface AuthOrganization {
  id: string;
  name: string;
  slug: string;
  isActive?: boolean;
}

export interface AuthUserPreference {
  defaultPortal: "player" | "owner";
}

export function useQueryAuthSession() {
  return useFeatureQuery(
    ["auth", "me"],
    authApi.queryAuthMe as (
      input?: Parameters<typeof authApi.queryAuthMe>[0],
    ) => Promise<AuthSessionUser | null>,
    undefined,
    {
      retry: false,
      staleTime: 5 * 60 * 1000,
    },
  );
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

  const mutation = useFeatureMutation(authApi.mutAuthLogout, {
    onSuccess: async () => {
      await queryClient.cancelQueries(undefined, { silent: true });
      queryClient.clear();
      setOwnerOnboardingIntent.mutate(false);
      try {
        localStorage.removeItem(PORTAL_STORAGE_KEY);
      } catch {}
    },
  });

  return {
    ...mutation,
    mutate: (
      _variables?: undefined,
      options?: Parameters<typeof mutation.mutate>[1],
    ) => mutation.mutate(undefined, options),
    mutateAsync: (
      _variables?: undefined,
      options?: Parameters<typeof mutation.mutateAsync>[1],
    ) => mutation.mutateAsync(undefined, options),
  };
}

export function useQueryAuthMyOrganizations(enabled: boolean) {
  return useFeatureQuery(
    ["organization", "my"],
    authApi.queryOrganizationMy as (
      input?: Parameters<typeof authApi.queryOrganizationMy>[0],
    ) => Promise<AuthOrganization[]>,
    undefined,
    { enabled },
  );
}

export function useQueryAuthUserPreference(enabled: boolean) {
  return useFeatureQuery(
    ["userPreference", "me"],
    authApi.queryUserPreferenceMe as (
      input?: Parameters<typeof authApi.queryUserPreferenceMe>[0],
    ) => Promise<AuthUserPreference>,
    undefined,
    { enabled },
  );
}

type PortalDefault = "player" | "owner";
type SetDefaultPortalInput = { defaultPortal: PortalDefault };
type SetDefaultPortalOutput = Awaited<
  ReturnType<typeof authApi.mutUserPreferenceSetDefaultPortal>
>;

type UseMutSetDefaultPortalOptions = {
  onSuccess?: (
    data: SetDefaultPortalOutput,
    variables: SetDefaultPortalInput,
    context: unknown,
  ) => void | Promise<void>;
  onError?: (error: unknown) => void;
};

export function useMutSetDefaultPortal(
  options?: UseMutSetDefaultPortalOptions,
) {
  const utils = trpc.useUtils();

  return useFeatureMutation<
    SetDefaultPortalOutput,
    SetDefaultPortalInput,
    unknown
  >(authApi.mutUserPreferenceSetDefaultPortal, {
    onSuccess: async (data, variables, context) => {
      try {
        localStorage.setItem(PORTAL_STORAGE_KEY, variables.defaultPortal);
      } catch {}

      await utils.userPreference.me.invalidate();
      await options?.onSuccess?.(data, variables, context);
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });
}

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
    authApi.queryAuthMe as (
      input?: Parameters<typeof authApi.queryAuthMe>[0],
    ) => Promise<AuthSessionUser | null>,
    undefined,
    {
      retry: false,
      enabled: inferAdmin || inferOwner,
    },
  );

  const organizationsQuery = useFeatureQuery(
    ["organization", "my"],
    authApi.queryOrganizationMy as (
      input?: Parameters<typeof authApi.queryOrganizationMy>[0],
    ) => Promise<AuthOrganization[]>,
    undefined,
    {
      enabled: inferOwner && !!sessionQuery.data,
    },
  );

  const userPreferenceQuery = useFeatureQuery(
    ["userPreference", "me"],
    authApi.queryUserPreferenceMe as (
      input?: Parameters<typeof authApi.queryUserPreferenceMe>[0],
    ) => Promise<AuthUserPreference>,
    undefined,
    {
      enabled: inferOwner && !!sessionQuery.data,
    },
  );

  const setDefaultPortalMutation = useMutSetDefaultPortal({
    onError: (error: unknown) => {
      onSetDefaultPortalError?.(error);
    },
  });

  const setDefaultPortal = (portal: PortalDefault) => {
    setDefaultPortalMutation.mutate({
      defaultPortal: portal,
    });
  };

  return {
    sessionUser: sessionQuery.data,
    organizations: organizationsQuery.data,
    userPreference: userPreferenceQuery.data,
    setDefaultPortal,
    setDefaultPortalMutation,
  };
}
