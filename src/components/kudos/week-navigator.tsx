"use client";

import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarWidget } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type WeekNavigatorProps = {
  weekHeaderLabel: string;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  isPrevWeekDisabled: boolean;
  isNextWeekDisabled: boolean;
  onGoToToday: () => void;
  selectedDate?: Date;
  onCalendarJump: (date: Date | undefined) => void;
  todayRangeStart: Date;
  maxBookingDate: Date;
  placeTimeZone: string;
};

function WeekNavigator({
  weekHeaderLabel,
  onPrevWeek,
  onNextWeek,
  isPrevWeekDisabled,
  isNextWeekDisabled,
  onGoToToday,
  selectedDate,
  onCalendarJump,
  todayRangeStart,
  maxBookingDate,
  placeTimeZone,
}: WeekNavigatorProps) {
  const [calendarPopoverOpen, setCalendarPopoverOpen] = React.useState(false);

  const handleCalendarSelect = React.useCallback(
    (date: Date | undefined) => {
      onCalendarJump(date);
      setCalendarPopoverOpen(false);
    },
    [onCalendarJump],
  );

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/30 p-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onPrevWeek}
          disabled={isPrevWeekDisabled}
          aria-label="Previous week"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Popover
          open={calendarPopoverOpen}
          onOpenChange={setCalendarPopoverOpen}
        >
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="h-7 gap-1 px-2 text-xs font-medium"
            >
              <Calendar className="h-3.5 w-3.5" />
              {weekHeaderLabel}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-auto p-0">
            <CalendarWidget
              mode="single"
              selected={selectedDate}
              onSelect={handleCalendarSelect}
              disabled={(date) =>
                date < todayRangeStart || date > maxBookingDate
              }
              timeZone={placeTimeZone}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onNextWeek}
          disabled={isNextWeekDisabled}
          aria-label="Next week"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={onGoToToday}>
        Today
      </Button>
    </div>
  );
}

export { WeekNavigator, type WeekNavigatorProps };
