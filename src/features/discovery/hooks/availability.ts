"use client";

import {
  useFeatureMutation,
  useFeatureQuery,
} from "@/common/feature-api-hooks";
import { getDiscoveryApi } from "../api.runtime";
import {
  useModAvailableSlots,
  useModPlaceAvailability,
  useModPlaceAvailabilitySelection,
} from "./place-detail";

const discoveryApi = getDiscoveryApi();

type DiscoveryAvailabilityForCourtInput = {
  courtId: string;
  date: string;
  durationMinutes: number;
  includeUnavailable: boolean;
};

type DiscoveryAvailabilityForCourtRangeInput = {
  courtId: string;
  startDate: string;
  endDate: string;
  durationMinutes: number;
  includeUnavailable: boolean;
};

type DiscoveryAvailabilityForPlaceSportRangeInput = {
  placeId: string;
  sportId: string;
  startDate: string;
  endDate: string;
  durationMinutes: number;
  includeUnavailable: boolean;
  includeCourtOptions: boolean;
};

export function useQueryDiscoverySports() {
  return useFeatureQuery(["sport", "list"], discoveryApi.querySportList, {});
}

export function useQueryDiscoveryOrganizations(enabled: boolean) {
  return useFeatureQuery(
    ["organization", "my"],
    discoveryApi.queryOrganizationMy,
    undefined,
    { enabled },
  );
}

export function useMutDiscoverySubmitClaim() {
  return useFeatureMutation(discoveryApi.mutClaimRequestSubmitClaim);
}

export function useMutDiscoverySubmitGuestRemoval() {
  return useFeatureMutation(discoveryApi.mutClaimRequestSubmitGuestRemoval);
}

export function useQueryDiscoveryAvailabilityForCourt(
  input: DiscoveryAvailabilityForCourtInput,
  enabled: boolean,
) {
  return useFeatureQuery(
    ["availability", "getForCourt"],
    discoveryApi.queryAvailabilityGetForCourt,
    input,
    { enabled },
  );
}

export function useQueryDiscoveryAvailabilityForCourtRange(
  input: DiscoveryAvailabilityForCourtRangeInput,
  enabled: boolean,
) {
  return useFeatureQuery(
    ["availability", "getForCourtRange"],
    discoveryApi.queryAvailabilityGetForCourtRange,
    input,
    { enabled },
  );
}

export function useQueryDiscoveryAvailabilityForPlaceSportRange(
  input: DiscoveryAvailabilityForPlaceSportRangeInput,
  enabled: boolean,
) {
  return useFeatureQuery(
    ["availability", "getForPlaceSportRange"],
    discoveryApi.queryAvailabilityGetForPlaceSportRange,
    input,
    { enabled },
  );
}

export {
  useModAvailableSlots,
  useModPlaceAvailability,
  useModPlaceAvailabilitySelection,
};
