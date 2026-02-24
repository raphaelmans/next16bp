import { describe, expect, it } from "vitest";
import { buildCourtSelectionMemoryKey } from "@/features/discovery/place-detail/helpers/court-selection-memory";

describe("buildCourtSelectionMemoryKey", () => {
  it("returns a deterministic key for place, sport, day, and court", () => {
    const key = buildCourtSelectionMemoryKey({
      placeId: "place-1",
      sportId: "sport-1",
      dayKey: "2026-02-24",
      courtId: "court-a",
    });

    expect(key).toBe("place-1|sport-1|2026-02-24|court-a");
  });

  it.each([
    {
      label: "missing place id",
      input: {
        placeId: undefined,
        sportId: "sport-1",
        dayKey: "2026-02-24",
        courtId: "court-a",
      },
    },
    {
      label: "missing sport id",
      input: {
        placeId: "place-1",
        sportId: undefined,
        dayKey: "2026-02-24",
        courtId: "court-a",
      },
    },
    {
      label: "missing day key",
      input: {
        placeId: "place-1",
        sportId: "sport-1",
        dayKey: undefined,
        courtId: "court-a",
      },
    },
    {
      label: "missing court id",
      input: {
        placeId: "place-1",
        sportId: "sport-1",
        dayKey: "2026-02-24",
        courtId: undefined,
      },
    },
  ])("returns null for $label", ({ input }) => {
    const key = buildCourtSelectionMemoryKey(input);

    expect(key).toBeNull();
  });
});
