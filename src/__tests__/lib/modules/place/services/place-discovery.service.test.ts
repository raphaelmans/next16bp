import { describe, expect, it, vi } from "vitest";
import type { PlaceSummaryItem } from "@/lib/modules/place/repositories/place.repository";
import { PlaceDiscoveryService } from "@/lib/modules/place/services/place-discovery.service";

const createSummaryItem = (
  value: Partial<PlaceSummaryItem["place"]> & { id: string; name: string },
): PlaceSummaryItem => ({
  place: {
    id: value.id,
    name: value.name,
    slug: value.slug ?? value.name.toLowerCase().replace(/\s+/g, "-"),
    address: value.address ?? "Address",
    city: value.city ?? "Cebu City",
    province: value.province ?? "Cebu",
    timeZone: value.timeZone ?? "Asia/Manila",
    latitude: value.latitude ?? null,
    longitude: value.longitude ?? null,
    placeType: value.placeType ?? "RESERVABLE",
    featuredRank: value.featuredRank ?? 0,
    provinceRank: value.provinceRank ?? 0,
  },
});

const createHarness = () => {
  const placeRepository = {
    listSummary: vi.fn(),
  };
  const courtRepository = {};
  const availabilityService = {
    getForPlaceSport: vi.fn(),
  };

  const service = new PlaceDiscoveryService(
    placeRepository as never,
    courtRepository as never,
    availabilityService as never,
  );

  return { service, placeRepository, availabilityService };
};

describe("PlaceDiscoveryService.listPlaceSummaries", () => {
  it("filters to venues with matching date availability and attaches a preview", async () => {
    const { service, placeRepository, availabilityService } = createHarness();

    placeRepository.listSummary.mockResolvedValueOnce({
      items: [
        createSummaryItem({ id: "place-1", name: "Venue One" }),
        createSummaryItem({ id: "place-2", name: "Venue Two" }),
      ],
      total: 2,
    });

    availabilityService.getForPlaceSport
      .mockResolvedValueOnce({
        options: [
          {
            startTime: "2026-03-08T02:00:00.000Z",
          },
          {
            startTime: "2026-03-08T03:00:00.000Z",
          },
        ],
      })
      .mockResolvedValueOnce({
        options: [],
      });

    const result = await service.listPlaceSummaries({
      sportId: "sport-1",
      date: "2026-03-08",
      limit: 12,
      offset: 0,
    });

    expect(result.total).toBe(1);
    expect(result.items[0]?.place.id).toBe("place-1");
    expect(result.items[0]?.availabilityPreview).toEqual({
      requestedDate: "2026-03-08",
      requestedTime: undefined,
      matchedStartTime: "2026-03-08T02:00:00.000Z",
      matchCount: 2,
      timeZone: "Asia/Manila",
    });
  });

  it("filters by exact start time when time is provided", async () => {
    const { service, placeRepository, availabilityService } = createHarness();

    placeRepository.listSummary.mockResolvedValueOnce({
      items: [createSummaryItem({ id: "place-1", name: "Venue One" })],
      total: 1,
    });

    availabilityService.getForPlaceSport.mockResolvedValueOnce({
      options: [
        {
          startTime: "2026-03-08T01:00:00.000Z",
        },
        {
          startTime: "2026-03-08T02:00:00.000Z",
        },
      ],
    });

    const result = await service.listPlaceSummaries({
      sportId: "sport-1",
      date: "2026-03-08",
      time: ["10:00"],
      limit: 12,
      offset: 0,
    });

    expect(result.total).toBe(1);
    expect(result.items[0]?.availabilityPreview).toEqual({
      requestedDate: "2026-03-08",
      requestedTime: ["10:00"],
      matchedStartTime: "2026-03-08T02:00:00.000Z",
      matchCount: 1,
      timeZone: "Asia/Manila",
    });
  });

  it("falls back to repository summaries when sport-gated availability is inactive", async () => {
    const { service, placeRepository, availabilityService } = createHarness();
    const items = [createSummaryItem({ id: "place-1", name: "Venue One" })];

    placeRepository.listSummary.mockResolvedValueOnce({
      items,
      total: 1,
    });

    const result = await service.listPlaceSummaries({
      date: "2026-03-08",
      limit: 12,
      offset: 0,
    });

    expect(result).toEqual({
      items,
      total: 1,
    });
    expect(availabilityService.getForPlaceSport).not.toHaveBeenCalled();
  });
});
