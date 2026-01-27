"use client";

import type * as React from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { formatInTimeZone } from "@/shared/lib/format";
import { getZonedDayKey } from "@/shared/lib/time-zone";
import {
  type TimeSlot,
  TimeSlotPicker,
  TimeSlotPickerSkeleton,
} from "./time-slot-picker";

export type AvailabilityMonthDay = {
  dayKey: string;
  date: Date;
  slots: TimeSlot[];
};

export type AvailabilityMonthViewProps = {
  selectedDate?: Date;
  month: Date;
  fromMonth: Date;
  toMonth: Date;
  minDate: Date;
  maxDate: Date;
  availableDates: Date[];
  days: AvailabilityMonthDay[];
  selectedSlotId?: string;
  isLoading?: boolean;
  timeZone?: string;
  showPrice?: boolean;
  renderSlotAction?: (args: {
    dayKey: string;
    date: Date;
    slot: TimeSlot;
    isSelected: boolean;
    isDisabled: boolean;
  }) => React.ReactNode;
  onSelectDate: (date?: Date) => void;
  onMonthChange: (date: Date) => void;
  onToday?: () => void;
  onSelectSlot?: (args: { dayKey: string; slot: TimeSlot }) => void;
  emptyState?: React.ReactNode;
};

export function AvailabilityMonthView({
  selectedDate,
  month,
  fromMonth,
  toMonth,
  minDate,
  maxDate,
  availableDates,
  days,
  selectedSlotId,
  isLoading,
  timeZone,
  showPrice = true,
  renderSlotAction,
  onSelectDate,
  onMonthChange,
  onToday,
  onSelectSlot,
  emptyState,
}: AvailabilityMonthViewProps) {
  const resolvedEmptyState = emptyState ?? (
    <p className="text-sm text-muted-foreground py-6 text-center">
      No available start times for this month.
    </p>
  );

  const selectedDayKey = selectedDate
    ? getZonedDayKey(selectedDate, timeZone)
    : null;
  const filteredDays = selectedDayKey
    ? days.filter((day) => day.dayKey === selectedDayKey)
    : days;

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Browse month</p>
          {onToday && (
            <Button type="button" variant="outline" size="sm" onClick={onToday}>
              Today
            </Button>
          )}
        </div>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={onSelectDate}
          month={month}
          onMonthChange={onMonthChange}
          fromMonth={fromMonth}
          toMonth={toMonth}
          disabled={(date) => date < minDate || date > maxDate}
          modifiers={{ available: availableDates }}
          modifiersClassNames={{
            available: "ring-1 ring-primary/40",
          }}
          timeZone={timeZone}
        />
      </div>

      <div className="space-y-4">
        {selectedDate && (
          <p className="text-sm font-medium text-muted-foreground">
            {formatInTimeZone(
              selectedDate,
              timeZone ?? "Asia/Manila",
              "EEEE, MMMM d, yyyy",
            )}
          </p>
        )}
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-4 w-32 rounded bg-muted animate-pulse" />
            <TimeSlotPickerSkeleton count={8} />
          </div>
        ) : filteredDays.length > 0 ? (
          filteredDays.map((day) => (
            <div
              key={day.dayKey}
              id={`day-${day.dayKey}`}
              className="space-y-2 scroll-mt-24"
            >
              <TimeSlotPicker
                slots={day.slots}
                selectedId={selectedSlotId}
                onSelect={(slot) =>
                  onSelectSlot?.({ dayKey: day.dayKey, slot })
                }
                showPrice={showPrice}
                timeZone={timeZone}
                renderSlotAction={
                  renderSlotAction
                    ? ({ slot, isSelected, isDisabled }) =>
                        renderSlotAction({
                          dayKey: day.dayKey,
                          date: day.date,
                          slot,
                          isSelected,
                          isDisabled,
                        })
                    : undefined
                }
              />
            </div>
          ))
        ) : days.length > 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No available times for this day. Select another date.
          </p>
        ) : (
          resolvedEmptyState
        )}
      </div>
    </div>
  );
}
