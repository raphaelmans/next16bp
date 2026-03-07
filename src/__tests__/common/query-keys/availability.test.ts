import { describe, expect, it } from "vitest";
import {
  buildAvailabilityScopeKey,
  normalizeAvailabilityCourtRangeInput,
  normalizeAvailabilityPlaceSportRangeInput,
} from "@/common/query-keys";

describe("availability query key helpers", () => {
  it("normalizes range inputs to stable defaults", () => {
    expect(
      normalizeAvailabilityCourtRangeInput({
        courtId: " court-1 ",
        startDate: "2026-03-07T00:00:00.000Z",
        endDate: "2026-03-08T00:00:00.000Z",
        durationMinutes: 60,
      }),
    ).toEqual({
      courtId: "court-1",
      startDate: "2026-03-07T00:00:00.000Z",
      endDate: "2026-03-08T00:00:00.000Z",
      durationMinutes: 60,
      includeUnavailable: false,
      selectedAddons: [],
    });
  });

  it("sorts selected addons so equivalent scopes share the same identity", () => {
    const normalized = normalizeAvailabilityPlaceSportRangeInput({
      placeId: "place-1",
      sportId: "sport-1",
      startDate: "2026-03-07T00:00:00.000Z",
      endDate: "2026-03-08T00:00:00.000Z",
      durationMinutes: 90,
      includeUnavailable: true,
      includeCourtOptions: false,
      selectedAddons: [
        { addonId: "b-addon", quantity: 2 },
        { addonId: "a-addon", quantity: 1 },
      ],
    });

    expect(normalized.selectedAddons).toEqual([
      { addonId: "a-addon", quantity: 1 },
      { addonId: "b-addon", quantity: 2 },
    ]);

    expect(buildAvailabilityScopeKey(normalized)).toBe(
      buildAvailabilityScopeKey({
        ...normalized,
        selectedAddons: [
          { addonId: "a-addon", quantity: 1 },
          { addonId: "b-addon", quantity: 2 },
        ],
      }),
    );
  });
});
