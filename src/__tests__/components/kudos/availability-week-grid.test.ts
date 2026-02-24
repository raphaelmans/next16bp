import { describe, expect, it } from "vitest";
import { getWeekGridDayCueState } from "@/components/kudos/availability-week-grid";

describe("getWeekGridDayCueState", () => {
  it.each([
    {
      label: "returns none when cue mode is none",
      input: {
        dayKey: "2026-02-24",
        sameDayAnchorDayKey: "2026-02-24",
        cueMode: "none" as const,
      },
      expected: "none",
    },
    {
      label: "returns none when anchor day key is missing",
      input: {
        dayKey: "2026-02-24",
        sameDayAnchorDayKey: undefined,
        cueMode: "highlight-anchor" as const,
      },
      expected: "none",
    },
    {
      label: "returns anchor when day matches anchor in highlight mode",
      input: {
        dayKey: "2026-02-24",
        sameDayAnchorDayKey: "2026-02-24",
        cueMode: "highlight-anchor" as const,
      },
      expected: "anchor",
    },
    {
      label: "returns none when day does not match anchor",
      input: {
        dayKey: "2026-02-25",
        sameDayAnchorDayKey: "2026-02-24",
        cueMode: "highlight-anchor" as const,
      },
      expected: "none",
    },
  ])("$label", ({ input, expected }) => {
    expect(getWeekGridDayCueState(input)).toBe(expected);
  });
});
