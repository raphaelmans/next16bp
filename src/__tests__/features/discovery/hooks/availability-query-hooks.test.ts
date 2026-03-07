import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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

import { useQueryDiscoveryAvailabilityForCourtRange } from "@/features/discovery/hooks/search";

describe("discovery availability hooks", () => {
  it("normalizes input and enables focus/reconnect recovery for court ranges", () => {
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
      {
        enabled: true,
        staleTime: 30_000,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      },
    );
  });
});
