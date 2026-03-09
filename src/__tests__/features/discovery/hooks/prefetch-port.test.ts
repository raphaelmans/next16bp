import { describe, expect, it, vi } from "vitest";
import { createDiscoveryPrefetchPort } from "@/features/discovery/hooks";

describe("createDiscoveryPrefetchPort", () => {
  it("uses normalized court-range inputs for feature-cache reads and fetches", async () => {
    const cache = {
      getData: vi.fn(),
      fetch: vi.fn(async (_path, _input, queryFn: () => Promise<unknown>) =>
        queryFn(),
      ),
    };
    const api = {
      queryAvailabilityGetForCourtRange: vi.fn(async (input) => ({
        ok: true,
        input,
      })),
      queryAvailabilityGetForPlaceSportRange: vi.fn(),
    };
    const port = createDiscoveryPrefetchPort(cache as never, api as never);

    port.availability.getForCourtRange.getData({
      courtId: " court-1 ",
      startDate: "2026-03-08T16:00:00.000Z",
      endDate: "2026-03-14T15:59:59.999Z",
      durationMinutes: 60,
      includeUnavailable: true,
    });

    await port.availability.getForCourtRange.fetch({
      courtId: " court-1 ",
      startDate: "2026-03-08T16:00:00.000Z",
      endDate: "2026-03-14T15:59:59.999Z",
      durationMinutes: 60,
      includeUnavailable: true,
    });

    const normalizedInput = {
      courtId: "court-1",
      startDate: "2026-03-08T16:00:00.000Z",
      endDate: "2026-03-14T15:59:59.999Z",
      durationMinutes: 60,
      includeUnavailable: true,
      selectedAddons: [],
    };

    expect(cache.getData).toHaveBeenCalledWith(
      ["availability", "getForCourtRange"],
      normalizedInput,
    );
    expect(cache.fetch).toHaveBeenCalledWith(
      ["availability", "getForCourtRange"],
      normalizedInput,
      expect.any(Function),
    );
    expect(api.queryAvailabilityGetForCourtRange).toHaveBeenCalledWith(
      normalizedInput,
    );
  });

  it("uses normalized place-sport-range inputs for feature-cache reads and fetches", async () => {
    const cache = {
      getData: vi.fn(),
      fetch: vi.fn(async (_path, _input, queryFn: () => Promise<unknown>) =>
        queryFn(),
      ),
    };
    const api = {
      queryAvailabilityGetForCourtRange: vi.fn(),
      queryAvailabilityGetForPlaceSportRange: vi.fn(async (input) => ({
        ok: true,
        input,
      })),
    };
    const port = createDiscoveryPrefetchPort(cache as never, api as never);

    port.availability.getForPlaceSportRange.getData({
      placeId: " place-1 ",
      sportId: " sport-1 ",
      startDate: "2026-03-14T16:00:00.000Z",
      endDate: "2026-03-21T15:59:59.999Z",
      durationMinutes: 60,
      includeUnavailable: true,
    });

    await port.availability.getForPlaceSportRange.fetch({
      placeId: " place-1 ",
      sportId: " sport-1 ",
      startDate: "2026-03-14T16:00:00.000Z",
      endDate: "2026-03-21T15:59:59.999Z",
      durationMinutes: 60,
      includeUnavailable: true,
    });

    const normalizedInput = {
      placeId: "place-1",
      sportId: "sport-1",
      startDate: "2026-03-14T16:00:00.000Z",
      endDate: "2026-03-21T15:59:59.999Z",
      durationMinutes: 60,
      includeUnavailable: true,
      includeCourtOptions: false,
      selectedAddons: [],
    };

    expect(cache.getData).toHaveBeenCalledWith(
      ["availability", "getForPlaceSportRange"],
      normalizedInput,
    );
    expect(cache.fetch).toHaveBeenCalledWith(
      ["availability", "getForPlaceSportRange"],
      normalizedInput,
      expect.any(Function),
    );
    expect(api.queryAvailabilityGetForPlaceSportRange).toHaveBeenCalledWith(
      normalizedInput,
    );
  });
});
