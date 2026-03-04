import { describe, expect, it } from "vitest";
import { sortHoursInScheduleOrder } from "@/common/schedule-hours";

describe("sortHoursInScheduleOrder", () => {
  const cases = [
    // ── Early return (length <= 1) ──
    {
      label: "returns empty array for no hours",
      input: [],
      expected: [],
    },
    {
      label: "returns single-element array unchanged",
      input: [14],
      expected: [14],
    },

    // ── Full 24-hour schedule (maxGap <= 1 fix) ──
    {
      label: "keeps 12 AM at top for full 24-hour schedule",
      input: Array.from({ length: 24 }, (_, i) => i),
      expected: Array.from({ length: 24 }, (_, i) => i),
    },
    {
      label: "keeps ascending order when input is shuffled full day",
      input: [
        23, 0, 12, 6, 18, 3, 9, 15, 21, 1, 7, 13, 19, 4, 10, 16, 22, 2, 8, 14,
        20, 5, 11, 17,
      ],
      expected: Array.from({ length: 24 }, (_, i) => i),
    },

    // ── Normal daytime schedule (gap after last element) ──
    {
      label: "returns ascending order for daytime schedule 8 AM–10 PM",
      input: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
      expected: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
    },
    {
      label: "returns ascending order for morning-only schedule",
      input: [6, 7, 8, 9, 10, 11],
      expected: [6, 7, 8, 9, 10, 11],
    },

    // ── Overnight rotation ──
    {
      label: "rotates for overnight schedule 6 AM–2 AM",
      input: [
        0, 1, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22,
        23,
      ],
      expected: [
        6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0,
        1,
      ],
    },
    {
      label: "rotates for late-night schedule 10 PM–6 AM",
      input: [0, 1, 2, 3, 4, 5, 22, 23],
      expected: [22, 23, 0, 1, 2, 3, 4, 5],
    },
    {
      label: "rotates for two-hour overnight wrap 11 PM–1 AM",
      input: [23, 0],
      expected: [23, 0],
    },

    // ── Edge: two consecutive hours, no wrap ──
    {
      label: "returns ascending for two consecutive daytime hours",
      input: [10, 11],
      expected: [10, 11],
    },
  ];

  for (const { label, input, expected } of cases) {
    it(label, () => {
      expect(sortHoursInScheduleOrder(input)).toEqual(expected);
    });
  }

  it("does not mutate the original array", () => {
    const original = [22, 23, 0, 1];
    const copy = [...original];
    sortHoursInScheduleOrder(original);
    expect(original).toEqual(copy);
  });
});
