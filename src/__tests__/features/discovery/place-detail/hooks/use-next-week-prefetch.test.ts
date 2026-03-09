import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useModNextWeekPrefetch } from "@/features/discovery/place-detail/hooks/use-next-week-prefetch";

function createPrefetchTracker() {
  const set = new Set<string>();
  return {
    has: (key: string) => set.has(key),
    mark: (key: string) => {
      set.add(key);
    },
    clear: (key: string) => {
      set.delete(key);
    },
  };
}

describe("useModNextWeekPrefetch", () => {
  it("prefetches next week court availability with clamped week window", async () => {
    const getData = vi.fn(() => undefined);
    const fetch = vi.fn(async () => undefined);
    const tracker = createPrefetchTracker();

    renderHook(() =>
      useModNextWeekPrefetch({
        showBooking: true,
        isActiveSurface: true,
        placeId: "place-1",
        placeTimeZone: "Asia/Manila",
        selectionMode: "court",
        selectedCourtId: "court-1",
        selectedSportId: undefined,
        selectedStartTime: undefined,
        currentWeekStartDayKey: "2026-03-08",
        durationMinutes: 60,
        todayRangeStart: new Date("2026-03-01T00:00:00+08:00"),
        maxBookingDate: new Date("2026-04-15T00:00:00+08:00"),
        hasPrefetchedWeek: tracker.has,
        markPrefetchedWeek: tracker.mark,
        clearPrefetchedWeek: tracker.clear,
        utils: {
          availability: {
            getForCourtRange: { getData, fetch },
            getForPlaceSportRange: {
              getData: vi.fn(() => undefined),
              fetch: vi.fn(async () => undefined),
            },
          },
        },
      }),
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    expect(fetch).toHaveBeenCalledWith({
      courtId: "court-1",
      startDate: "2026-03-14T16:00:00.000Z",
      endDate: "2026-03-21T15:59:59.999Z",
      durationMinutes: 60,
      includeUnavailable: true,
      selectedAddons: [],
    });
  });

  it("does not fetch again for the same next-week cache key", async () => {
    const getData = vi.fn(() => undefined);
    const fetch = vi.fn(async () => undefined);
    const tracker = createPrefetchTracker();

    const { rerender } = renderHook(
      (props: { selectedStartTime?: string }) =>
        useModNextWeekPrefetch({
          showBooking: true,
          isActiveSurface: true,
          placeId: "place-1",
          placeTimeZone: "Asia/Manila",
          selectionMode: "court",
          selectedCourtId: "court-1",
          selectedSportId: undefined,
          selectedStartTime: props.selectedStartTime,
          currentWeekStartDayKey: "2026-03-08",
          durationMinutes: 60,
          todayRangeStart: new Date("2026-03-01T00:00:00+08:00"),
          maxBookingDate: new Date("2026-04-15T00:00:00+08:00"),
          hasPrefetchedWeek: tracker.has,
          markPrefetchedWeek: tracker.mark,
          clearPrefetchedWeek: tracker.clear,
          utils: {
            availability: {
              getForCourtRange: { getData, fetch },
              getForPlaceSportRange: {
                getData: vi.fn(() => undefined),
                fetch: vi.fn(async () => undefined),
              },
            },
          },
        }),
      { initialProps: { selectedStartTime: undefined } },
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    rerender({ selectedStartTime: undefined });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  it("prefetches next week any-court availability when mode is any", async () => {
    const getData = vi.fn(() => undefined);
    const fetch = vi.fn(async () => undefined);
    const tracker = createPrefetchTracker();

    renderHook(() =>
      useModNextWeekPrefetch({
        showBooking: true,
        isActiveSurface: true,
        placeId: "place-1",
        placeTimeZone: "Asia/Manila",
        selectionMode: "any",
        selectedSportId: "sport-1",
        selectedCourtId: undefined,
        selectedStartTime: undefined,
        currentWeekStartDayKey: "2026-03-08",
        durationMinutes: 60,
        todayRangeStart: new Date("2026-03-01T00:00:00+08:00"),
        maxBookingDate: new Date("2026-04-15T00:00:00+08:00"),
        hasPrefetchedWeek: tracker.has,
        markPrefetchedWeek: tracker.mark,
        clearPrefetchedWeek: tracker.clear,
        utils: {
          availability: {
            getForCourtRange: {
              getData: vi.fn(() => undefined),
              fetch: vi.fn(async () => undefined),
            },
            getForPlaceSportRange: { getData, fetch },
          },
        },
      }),
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    expect(fetch).toHaveBeenCalledWith({
      placeId: "place-1",
      sportId: "sport-1",
      startDate: "2026-03-14T16:00:00.000Z",
      endDate: "2026-03-21T15:59:59.999Z",
      durationMinutes: 60,
      includeUnavailable: true,
      includeCourtOptions: false,
      selectedAddons: [],
    });
  });
});
