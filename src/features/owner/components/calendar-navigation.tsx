"use client";

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  subMonths,
} from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { getZonedToday } from "@/shared/lib/time-zone";

type ViewMode = "day" | "week" | "month";

interface CalendarNavigationProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  datesWithSlots?: Date[];
  timeZone?: string;
  className?: string;
}

export function CalendarNavigation({
  selectedDate,
  onDateChange,
  viewMode = "day",
  onViewModeChange,
  datesWithSlots = [],
  timeZone,
  className,
}: CalendarNavigationProps) {
  const [currentMonth, setCurrentMonth] = React.useState(
    startOfMonth(selectedDate),
  );

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const today = getZonedToday(timeZone);

  // Get the starting day of the week for the first day of the month
  const startDayOfWeek = monthStart.getDay();

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleToday = () => {
    setCurrentMonth(startOfMonth(today));
    onDateChange(today);
  };

  const hasSlots = (date: Date) => {
    return datesWithSlots.some((d) => isSameDay(d, date));
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with month/year and navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold min-w-[140px] text-center">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleToday}>
            <CalendarDays className="h-4 w-4 mr-2" />
            Today
          </Button>
          {onViewModeChange && (
            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(value) =>
                value && onViewModeChange(value as ViewMode)
              }
            >
              <ToggleGroupItem value="day" size="sm">
                Day
              </ToggleGroupItem>
              <ToggleGroupItem value="week" size="sm">
                Week
              </ToggleGroupItem>
              <ToggleGroupItem value="month" size="sm">
                Month
              </ToggleGroupItem>
            </ToggleGroup>
          )}
        </div>
      </div>

      {/* Mini calendar grid */}
      <div className="rounded-lg border bg-card p-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-muted-foreground py-1"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty slots for alignment */}
          {Array.from({ length: startDayOfWeek }, (_, i) => (
            <div
              key={`empty-${monthStart.toISOString()}-${i}`}
              className="aspect-square"
            />
          ))}

          {/* Days of the month */}
          {daysInMonth.map((day) => {
            const isSelected = isSameDay(day, selectedDate);
            const isTodayDate = isSameDay(day, today);
            const hasSlotIndicator = hasSlots(day);

            return (
              <button
                type="button"
                key={day.toISOString()}
                onClick={() => onDateChange(day)}
                className={cn(
                  "aspect-square flex flex-col items-center justify-center rounded-md text-sm transition-colors relative",
                  "hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                  isSelected &&
                    "bg-primary text-primary-foreground hover:bg-primary/90",
                  isTodayDate &&
                    !isSelected &&
                    "bg-accent text-accent-foreground",
                  !isSameMonth(day, currentMonth) &&
                    "text-muted-foreground opacity-50",
                )}
              >
                <span>{format(day, "d")}</span>
                {hasSlotIndicator && (
                  <span
                    className={cn(
                      "absolute bottom-1 w-1 h-1 rounded-full",
                      isSelected ? "bg-primary-foreground" : "bg-primary",
                    )}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected date display */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">Selected Date</p>
        <p className="text-lg font-semibold">
          {format(selectedDate, "EEEE, MMMM d, yyyy")}
        </p>
      </div>
    </div>
  );
}
