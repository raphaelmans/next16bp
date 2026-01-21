"use client";

import {
  type UseMutationResult,
  type UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

const OWNER_ONBOARDING_STORAGE_KEY = "kudos.owner_onboarding";
const OWNER_ONBOARDING_QUERY_KEY = ["owner-onboarding-intent"] as const;

const readOwnerOnboardingIntent = () => {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(OWNER_ONBOARDING_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
};

const writeOwnerOnboardingIntent = (value: boolean) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (value) {
      window.localStorage.setItem(OWNER_ONBOARDING_STORAGE_KEY, "true");
    } else {
      window.localStorage.removeItem(OWNER_ONBOARDING_STORAGE_KEY);
    }
  } catch {
    // ignore storage write failures
  }
};

export function useOwnerOnboardingIntent(): UseQueryResult<boolean> {
  return useQuery({
    queryKey: OWNER_ONBOARDING_QUERY_KEY,
    queryFn: () => readOwnerOnboardingIntent(),
    initialData: false,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  });
}

export function useSetOwnerOnboardingIntent(): UseMutationResult<
  boolean,
  Error,
  boolean
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (value: boolean) => {
      writeOwnerOnboardingIntent(value);
      return value;
    },
    onSuccess: (value) => {
      queryClient.setQueryData(OWNER_ONBOARDING_QUERY_KEY, value);
    },
  });
}
