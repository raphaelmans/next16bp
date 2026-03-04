import { describe, expect, it } from "vitest";
import {
  getSelectionSummaryQueryWindow,
  getWeekGridQueryWindow,
} from "@/features/discovery/place-detail/helpers/week-grid-query-window";

describe("week-grid-query-window", () => {
  it("clamps week start to today range start", () => {
    const window = getWeekGridQueryWindow({
      weekDayKeys: [
        "2026-03-01",
        "2026-03-02",
        "2026-03-03",
        "2026-03-04",
        "2026-03-05",
        "2026-03-06",
        "2026-03-07",
      ],
      selectedDayKey: "2026-03-05",
      selectedStartTime: undefined,
      timeZone: "Asia/Manila",
      todayRangeStart: new Date("2026-03-04T00:00:00+08:00"),
      maxBookingDate: new Date("2026-04-03T00:00:00+08:00"),
    });

    expect(window.startDateIso).toBe("2026-03-03T16:00:00.000Z");
    expect(window.endDateIso).toBe("2026-03-07T15:59:59.999Z");
  });

  it("expands to include adjacent-week anchor day", () => {
    const window = getWeekGridQueryWindow({
      weekDayKeys: [
        "2026-03-08",
        "2026-03-09",
        "2026-03-10",
        "2026-03-11",
        "2026-03-12",
        "2026-03-13",
        "2026-03-14",
      ],
      selectedDayKey: "2026-03-08",
      selectedStartTime: "2026-03-07T14:00:00.000Z",
      timeZone: "Asia/Manila",
      todayRangeStart: new Date("2026-03-01T00:00:00+08:00"),
      maxBookingDate: new Date("2026-04-03T00:00:00+08:00"),
    });

    expect(window.startDateIso).toBe("2026-03-06T16:00:00.000Z");
    expect(window.endDateIso).toBe("2026-03-14T15:59:59.999Z");
  });

  it("builds summary window through the day that contains selection end", () => {
    const window = getSelectionSummaryQueryWindow({
      selectedStartTime: "2026-03-06T14:00:00.000Z", // 10:00 PM PHT
      durationMinutes: 300, // until 3:00 AM next day PHT
      timeZone: "Asia/Manila",
    });

    expect(window.startDateIso).toBe("2026-03-05T16:00:00.000Z");
    expect(window.endDateIso).toBe("2026-03-07T15:59:59.999Z");
  });
});
