"use client";

import { useFeatureQuery } from "@/common/feature-api-hooks";
import { getCoachDiscoveryApi } from "../api.runtime";

const api = getCoachDiscoveryApi();

export function useModCoachAvailability(input: {
  coachId: string;
  date: string;
  durationMinutes: number;
  selectedAddons?: { addonId: string; quantity: number }[];
  enabled?: boolean;
}) {
  const { enabled = true, ...queryInput } = input;

  return useFeatureQuery(
    ["coachAvailability", "getForCoach"],
    api.queryCoachAvailabilityGetForCoach,
    queryInput,
    {
      enabled: enabled && !!queryInput.coachId && !!queryInput.date,
      staleTime: 5_000,
      refetchInterval: 15_000,
    },
  );
}

export function useModCoachDetail(input: {
  coachIdOrSlug: string;
  enabled?: boolean;
}) {
  const { enabled = true, ...queryInput } = input;

  return useFeatureQuery(
    ["coach", "getByIdOrSlug"],
    api.queryCoachGetByIdOrSlug,
    queryInput,
    { enabled: enabled && !!queryInput.coachIdOrSlug },
  );
}

export function useModCoachAddonsForBooking(input: {
  coachId: string | null;
  enabled?: boolean;
}) {
  const { enabled = true, coachId } = input;

  return useFeatureQuery(
    ["coachAddon", "get"],
    api.queryCoachAddonGet,
    coachId ? { coachId } : undefined,
    { enabled: enabled && !!coachId },
  );
}
