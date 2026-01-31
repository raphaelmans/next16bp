"use client";

import { addDays } from "date-fns";
import * as React from "react";
import { formatInTimeZone } from "@/common/format";
import { getZonedDayKey } from "@/common/time-zone";
import { cn } from "@/lib/utils";

interface MobileDateStripProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  timeZone: string;
  todayDate: Date;
}

const getWeekDates = (selectedDate: Date): Date[] => {
  const dayOfWeek = selectedDate.getDay();
  const sundayOffset = (dayOfWeek - 0 + 7) % 7;
  const weekStart = addDays(selectedDate, -sundayOffset);
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
};

export function MobileDateStrip({
  selectedDate,
  onDateSelect,
  timeZone,
  todayDate,
}: MobileDateStripProps) {
  const weekDates = React.useMemo(
    () => getWeekDates(selectedDate),
    [selectedDate],
  );

  const selectedDayKey = getZonedDayKey(selectedDate, timeZone);
  const todayDayKey = getZonedDayKey(todayDate, timeZone);

  return (
    <div className="grid grid-cols-7 gap-1.5">
      {weekDates.map((date) => {
        const dayKey = getZonedDayKey(date, timeZone);
        const isSelected = dayKey === selectedDayKey;
        const isToday = dayKey === todayDayKey;
        const dayName = formatInTimeZone(date, timeZone, "EEEEE");
        const dayNum = formatInTimeZone(date, timeZone, "d");

        return (
          <button
            key={dayKey}
            type="button"
            onClick={() => onDateSelect(date)}
            className={cn(
              "rounded-xl border text-center p-2 transition-colors",
              isSelected
                ? "bg-foreground text-background border-foreground"
                : isToday
                  ? "border-primary bg-background text-foreground"
                  : "border-border bg-background text-foreground hover:bg-muted/50",
            )}
          >
            <div className="text-[10px] font-medium uppercase leading-none">
              {dayName}
            </div>
            <div className="mt-1 text-base font-bold leading-none">
              {dayNum}
            </div>
          </button>
        );
      })}
    </div>
  );
}
