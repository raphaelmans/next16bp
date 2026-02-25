import { describe, expect, it } from "vitest";
import { shouldResetSelectionOnCourtSwitch } from "@/features/discovery/place-detail/helpers/court-switch-selection";

describe("shouldResetSelectionOnCourtSwitch", () => {
  it.each([
    {
      input: {
        previousSelectionMode: "court" as const,
        previousCourtId: "court-a",
        nextCourtId: "court-b",
      },
      expected: false,
    },
    {
      input: {
        previousSelectionMode: "court" as const,
        previousCourtId: "court-a",
        nextCourtId: "court-a",
      },
      expected: true,
    },
    {
      input: {
        previousSelectionMode: "any" as const,
        previousCourtId: undefined,
        nextCourtId: "court-a",
      },
      expected: true,
    },
    {
      input: {
        previousSelectionMode: "court" as const,
        previousCourtId: "court-a",
        nextCourtId: undefined,
      },
      expected: true,
    },
  ])("returns $expected for $input", ({ input, expected }) => {
    expect(shouldResetSelectionOnCourtSwitch(input)).toBe(expected);
  });
});
