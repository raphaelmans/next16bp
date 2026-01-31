"use client";

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { getZonedToday } from "@/common/time-zone";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface KudosDatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  minDate?: Date;
  maxDate?: Date;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  timeZone?: string;
}

export function KudosDatePicker({
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = "Select date",
  className,
  disabled = false,
  timeZone,
}: KudosDatePickerProps) {
  const effectiveMinDate =
    minDate ?? (timeZone ? getZonedToday(timeZone) : new Date());
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "PPP") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          disabled={(date) => {
            if (effectiveMinDate && date < effectiveMinDate) return true;
            if (maxDate && date > maxDate) return true;
            return false;
          }}
          timeZone={timeZone}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
