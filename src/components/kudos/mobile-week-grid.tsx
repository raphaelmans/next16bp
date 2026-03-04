"use client";

import * as React from "react";
import {
  AvailabilityWeekGrid,
  type AvailabilityWeekGridRange,
  AvailabilityWeekGridSkeleton,
} from "./availability-week-grid";
import type { TimeSlot } from "./time-slot-picker";

export type MobileWeekGridRange = AvailabilityWeekGridRange;

export type MobileWeekGridProps = {
  dayKeys: string[];
  slotsByDay: Map<string, TimeSlot[]>;
  timeZone: string;
  selectedRange?: MobileWeekGridRange;
  onRangeChange: (range: MobileWeekGridRange) => void;
  onClear: () => void;
  todayDayKey: string;
  maxDayKey: string;
  cartedStartTimes?: Set<string>;
};

export function MobileWeekGrid({
  dayKeys,
  slotsByDay,
  timeZone,
  selectedRange,
  onRangeChange,
  onClear,
  todayDayKey,
  maxDayKey,
  cartedStartTimes,
}: MobileWeekGridProps) {
  const handleRangeChange = React.useCallback(
    (range: MobileWeekGridRange) => {
      if (!range.startTime || range.durationMinutes <= 0) {
        onClear();
        return;
      }
      onRangeChange(range);
    },
    [onClear, onRangeChange],
  );

  return (
    <AvailabilityWeekGrid
      compact
      dayKeys={dayKeys}
      slotsByDay={slotsByDay}
      timeZone={timeZone}
      selectedRange={selectedRange}
      onRangeChange={handleRangeChange}
      onDayClick={() => {
        // Mobile keeps week-only behavior; day headers are non-navigational.
      }}
      todayDayKey={todayDayKey}
      maxDayKey={maxDayKey}
      cartedStartTimes={cartedStartTimes}
    />
  );
}

export function MobileWeekGridSkeleton() {
  return (
    <AvailabilityWeekGridSkeleton
      dayKeys={[
        "2026-03-01",
        "2026-03-02",
        "2026-03-03",
        "2026-03-04",
        "2026-03-05",
        "2026-03-06",
        "2026-03-07",
      ]}
      timeZone="Asia/Manila"
      hours={[6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]}
    />
  );
}
