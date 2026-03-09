import { keepPreviousData } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { shouldRetryLiveQuery } from "@/common/live-query-options";

const { featureQuerySpy, discoveryApi } = vi.hoisted(() => ({
  featureQuerySpy: vi.fn(),
  discoveryApi: {
    queryAvailabilityGetForCourt: vi.fn(),
    queryAvailabilityGetForCourtRange: vi.fn(),
    queryAvailabilityGetForPlaceSportRange: vi.fn(),
    querySportList: vi.fn(),
    queryOrganizationMy: vi.fn(),
    mutClaimRequestSubmitClaim: vi.fn(),
    mutClaimRequestSubmitGuestRemoval: vi.fn(),
  },
}));

vi.mock("@/common/feature-api-hooks", () => ({
  useFeatureQuery: (
    path: unknown,
    queryFn: unknown,
    input?: unknown,
    options?: unknown,
  ) => {
    featureQuerySpy(path, queryFn, input, options);
    return { data: null };
  },
  useFeatureMutation: vi.fn(),
}));

vi.mock("@/features/discovery/api.runtime", () => ({
  getDiscoveryApi: () => discoveryApi,
}));

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-query")>(
    "@tanstack/react-query",
  );

  return {
    ...actual,
    useQueryClient: () => ({
      setQueryData: vi.fn(),
      invalidateQueries: vi.fn(async () => undefined),
    }),
  };
});

vi.mock("@/common/clients/availability-realtime-client", () => ({
  getAvailabilityRealtimeClient: () => ({
    subscribeToAvailabilityChangeEvents: vi.fn(() => ({
      unsubscribe: vi.fn(),
    })),
  }),
}));

import {
  useQueryDiscoveryAvailabilityForCourtRange,
  useQueryDiscoveryAvailabilityForPlaceSportRange,
} from "@/features/discovery/hooks/search";

describe("discovery availability hooks", () => {
  it("normalizes input and applies the live query policy for court ranges", () => {
    renderHook(() =>
      useQueryDiscoveryAvailabilityForCourtRange(
        {
          courtId: " court-1 ",
          startDate: "2026-03-07T00:00:00.000Z",
          endDate: "2026-03-08T00:00:00.000Z",
          durationMinutes: 90,
          includeUnavailable: true,
          selectedAddons: [
            { addonId: "b-addon", quantity: 2 },
            { addonId: "a-addon", quantity: 1 },
          ],
        },
        true,
      ),
    );

    expect(featureQuerySpy).toHaveBeenCalledWith(
      ["availability", "getForCourtRange"],
      discoveryApi.queryAvailabilityGetForCourtRange,
      {
        courtId: "court-1",
        startDate: "2026-03-07T00:00:00.000Z",
        endDate: "2026-03-08T00:00:00.000Z",
        durationMinutes: 90,
        includeUnavailable: true,
        selectedAddons: [
          { addonId: "a-addon", quantity: 1 },
          { addonId: "b-addon", quantity: 2 },
        ],
      },
      expect.objectContaining({
        enabled: true,
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        placeholderData: keepPreviousData,
        retry: shouldRetryLiveQuery,
      }),
    );
  });

  it("keeps previous place-sport-range data as placeholder during week transitions", () => {
    renderHook(() =>
      useQueryDiscoveryAvailabilityForPlaceSportRange(
        {
          placeId: " place-1 ",
          sportId: " sport-1 ",
          startDate: "2026-03-15T00:00:00.000Z",
          endDate: "2026-03-22T00:00:00.000Z",
          durationMinutes: 60,
          includeUnavailable: true,
          includeCourtOptions: false,
          selectedAddons: [{ addonId: "addon-1", quantity: 1 }],
        },
        true,
      ),
    );

    expect(featureQuerySpy).toHaveBeenCalledWith(
      ["availability", "getForPlaceSportRange"],
      discoveryApi.queryAvailabilityGetForPlaceSportRange,
      {
        placeId: "place-1",
        sportId: "sport-1",
        startDate: "2026-03-15T00:00:00.000Z",
        endDate: "2026-03-22T00:00:00.000Z",
        durationMinutes: 60,
        includeUnavailable: true,
        includeCourtOptions: false,
        selectedAddons: [{ addonId: "addon-1", quantity: 1 }],
      },
      expect.objectContaining({
        enabled: true,
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        placeholderData: keepPreviousData,
        retry: shouldRetryLiveQuery,
      }),
    );
  });
});
