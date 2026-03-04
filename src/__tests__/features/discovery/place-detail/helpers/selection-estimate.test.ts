import { describe, expect, it } from "vitest";
import { isSelectionEstimateReady } from "@/features/discovery/place-detail/helpers/selection-estimate";

describe("selection-estimate", () => {
  const selectedStartTime = "2026-03-06T14:00:00.000Z";

  it("returns true when summary matches the current range and has total", () => {
    expect(
      isSelectionEstimateReady({
        selectedStartTime,
        durationMinutes: 180,
        selectionSummary: {
          startTime: selectedStartTime,
          endTime: "2026-03-06T17:00:00.000Z",
          totalCents: 150000,
          currency: "PHP",
        },
      }),
    ).toBe(true);
  });

  it("returns false when summary total is missing", () => {
    expect(
      isSelectionEstimateReady({
        selectedStartTime,
        durationMinutes: 180,
        selectionSummary: {
          startTime: selectedStartTime,
          endTime: "2026-03-06T17:00:00.000Z",
          currency: "PHP",
        },
      }),
    ).toBe(false);
  });

  it("returns false when summary is stale for a different selection", () => {
    expect(
      isSelectionEstimateReady({
        selectedStartTime,
        durationMinutes: 120,
        selectionSummary: {
          startTime: selectedStartTime,
          endTime: "2026-03-06T17:00:00.000Z",
          totalCents: 150000,
          currency: "PHP",
        },
      }),
    ).toBe(false);
  });
});
