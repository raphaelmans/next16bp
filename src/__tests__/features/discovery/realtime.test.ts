import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const {
  setQueryDataMock,
  invalidateQueriesMock,
  subscribeMock,
  unsubscribeMock,
} = vi.hoisted(() => ({
  setQueryDataMock: vi.fn(),
  invalidateQueriesMock: vi.fn(async () => undefined),
  subscribeMock: vi.fn(),
  unsubscribeMock: vi.fn(),
}));

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-query")>(
    "@tanstack/react-query",
  );

  return {
    ...actual,
    useQueryClient: () => ({
      setQueryData: setQueryDataMock,
      invalidateQueries: invalidateQueriesMock,
    }),
  };
});

vi.mock("@/common/clients/availability-realtime-client", () => ({
  getAvailabilityRealtimeClient: () => ({
    subscribeToAvailabilityChangeEvents: subscribeMock,
  }),
}));

import {
  patchCourtAvailabilityResult,
  useModDiscoveryAvailabilityRealtimeSync,
} from "@/features/discovery/realtime";

describe("discovery realtime sync", () => {
  it("patchCourtAvailabilityResult updates matching court slots", () => {
    const next = patchCourtAvailabilityResult(
      {
        options: [
          {
            courtId: "court-1",
            startTime: "2026-03-07T10:00:00.000Z",
            endTime: "2026-03-07T11:00:00.000Z",
            totalPriceCents: 1200,
            currency: "PHP",
            status: "AVAILABLE",
            unavailableReason: null,
          },
        ],
        diagnostics: {
          hasHoursWindows: true,
          hasRateRules: true,
          dayHasHours: true,
          allSlotsBooked: false,
          reservationsDisabled: false,
        },
      },
      {
        id: "evt-1",
        source_kind: "RESERVATION",
        source_event: "reservation.created",
        source_id: "res-1",
        court_id: "court-1",
        place_id: "place-1",
        sport_id: "sport-1",
        start_time: "2026-03-07T10:00:00.000Z",
        end_time: "2026-03-07T11:00:00.000Z",
        slot_status: "BOOKED",
        unavailable_reason: "RESERVATION",
        total_price_cents: 1200,
        currency: "PHP",
        created_at: "2026-03-07T09:00:00.000Z",
      },
    );

    expect(next?.options[0]?.status).toBe("BOOKED");
    expect(next?.options[0]?.unavailableReason).toBe("RESERVATION");
  });

  it("invalidates aggregate place-sport availability when a matching event arrives", () => {
    let onInsert: ((row: Record<string, unknown>) => void) | undefined;
    subscribeMock.mockImplementation((input: { onInsert: typeof onInsert }) => {
      onInsert = input.onInsert;
      return { unsubscribe: unsubscribeMock };
    });

    renderHook(() =>
      useModDiscoveryAvailabilityRealtimeSync({
        enabled: true,
        placeSportRangeInput: {
          placeId: "place-1",
          sportId: "sport-1",
          startDate: "2026-03-07T00:00:00.000Z",
          endDate: "2026-03-08T00:00:00.000Z",
          durationMinutes: 60,
          includeUnavailable: true,
          includeCourtOptions: false,
        },
      }),
    );

    onInsert?.({
      id: "evt-1",
      source_kind: "RESERVATION",
      source_event: "reservation.created",
      source_id: "res-1",
      court_id: "court-1",
      place_id: "place-1",
      sport_id: "sport-1",
      start_time: "2026-03-07T10:00:00.000Z",
      end_time: "2026-03-07T11:00:00.000Z",
      slot_status: "BOOKED",
      unavailable_reason: "RESERVATION",
      total_price_cents: 1200,
      currency: "PHP",
      created_at: "2026-03-07T09:00:00.000Z",
    });

    expect(invalidateQueriesMock).toHaveBeenCalled();
  });
});
