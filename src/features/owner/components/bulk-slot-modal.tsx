"use client";

import { addDays, format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { formatInTimeZone } from "@/shared/lib/format";
import { getZonedToday } from "@/shared/lib/time-zone";
import {
  type BulkSlotData,
  type CourtHoursWindow,
  generateSlotsFromCourtHours,
  MAX_BULK_SLOTS,
} from "../hooks/use-slots";

interface BulkSlotModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: BulkSlotData) => void;
  isLoading: boolean;
  isPrereqsLoading: boolean;
  hasHours: boolean;
  hasPricingRules: boolean;
  hoursWindows?: CourtHoursWindow[];
  hoursHref?: string;
  pricingHref?: string;
  initialDate?: Date;
  timeZone?: string;
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

const getDayLabel = (dayOfWeek: number) =>
  DAYS_OF_WEEK.find((day) => day.value === dayOfWeek)?.label ?? "Day";

const toTimeString = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};

const SLOT_DURATION_MINUTES = 60;

export function BulkSlotModal({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  isPrereqsLoading,
  hasHours,
  hasPricingRules,
  hoursWindows,
  hoursHref,
  pricingHref,
  initialDate,
  timeZone,
}: BulkSlotModalProps) {
  const [mode, setMode] = React.useState<"single" | "recurring">("single");
  const [startDate, setStartDate] = React.useState<Date>(
    initialDate ?? getZonedToday(timeZone),
  );
  const [endDate, setEndDate] = React.useState<Date>(
    addDays(initialDate ?? getZonedToday(timeZone), 7),
  );
  const [selectedDays, setSelectedDays] = React.useState<number[]>([
    1, 2, 3, 4, 5,
  ]);
  const duration = SLOT_DURATION_MINUTES;
  const normalizedHours = React.useMemo(
    () => hoursWindows ?? [],
    [hoursWindows],
  );

  const formatDateInZone = React.useCallback(
    (date: Date, pattern: string) =>
      timeZone
        ? formatInTimeZone(date, timeZone, pattern)
        : format(date, pattern),
    [timeZone],
  );

  const bulkData = React.useMemo<BulkSlotData>(
    () => ({
      startDate,
      endDate: mode === "recurring" ? endDate : undefined,
      daysOfWeek: mode === "recurring" ? selectedDays : undefined,
      duration,
      useDefaultPrice: true,
      hoursWindows: normalizedHours,
      timeZone,
    }),
    [
      startDate,
      endDate,
      mode,
      selectedDays,
      duration,
      normalizedHours,
      timeZone,
    ],
  );

  const preview = React.useMemo(
    () => generateSlotsFromCourtHours(bulkData),
    [bulkData],
  );

  const today = React.useMemo(() => getZonedToday(timeZone), [timeZone]);

  const canCreateSlots =
    !isPrereqsLoading &&
    hasHours &&
    hasPricingRules &&
    preview.slots.length > 0;

  const daySummaries = React.useMemo(() => {
    const displayDays = mode === "single" ? [startDate.getDay()] : selectedDays;

    return displayDays.map((day) => {
      const windows = normalizedHours
        .filter((window) => window.dayOfWeek === day)
        .sort((a, b) => a.startMinute - b.startMinute);
      return { day, windows };
    });
  }, [mode, startDate, selectedDays, normalizedHours]);

  // Reset form when modal opens
  React.useEffect(() => {
    if (!open) return;
    const baseDate = initialDate ?? getZonedToday(timeZone);
    setStartDate(baseDate);
    setEndDate(addDays(baseDate, 7));
  }, [open, initialDate, timeZone]);

  const handleSubmit = () => {
    if (!canCreateSlots) return;
    onSubmit(bulkData);
  };

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Time Slots</DialogTitle>
          <DialogDescription>
            Create one or more 60-minute slots for your court
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Mode Selection */}
          <div className="space-y-3">
            <Label>Slot Type</Label>
            <RadioGroup
              value={mode}
              onValueChange={(v) => setMode(v as "single" | "recurring")}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="single" id="single" />
                <Label htmlFor="single" className="font-normal cursor-pointer">
                  Single Day
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="recurring" id="recurring" />
                <Label
                  htmlFor="recurring"
                  className="font-normal cursor-pointer"
                >
                  Multiple Days (Recurring)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Date Selection */}
          <div className="space-y-3">
            {mode === "single" ? (
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? (
                        formatDateInZone(startDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => date && setStartDate(date)}
                      timeZone={timeZone}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !startDate && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? (
                            formatDateInZone(startDate, "MMM d, yyyy")
                          ) : (
                            <span>Start</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={(date) => date && setStartDate(date)}
                          disabled={(date) => date < today}
                          timeZone={timeZone}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !endDate && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? (
                            formatDateInZone(endDate, "MMM d, yyyy")
                          ) : (
                            <span>End</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={(date) => date && setEndDate(date)}
                          disabled={(date) => date < startDate}
                          timeZone={timeZone}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Days of Week */}
                <div className="space-y-2">
                  <Label>Days of Week</Label>
                  <div className="flex gap-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <Button
                        key={day.value}
                        type="button"
                        variant={
                          selectedDays.includes(day.value)
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        className="w-10 h-10 p-0"
                        onClick={() => toggleDay(day.value)}
                      >
                        {day.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Court Hours */}
          <div className="space-y-2">
            <Label>Using court hours</Label>
            {daySummaries.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Select at least one day to preview hours.
              </p>
            ) : (
              <div className="space-y-1">
                {daySummaries.map((summary) => {
                  const label = getDayLabel(summary.day);
                  const ranges = summary.windows
                    .map(
                      (window) =>
                        `${toTimeString(window.startMinute)}-${toTimeString(
                          window.endMinute,
                        )}`,
                    )
                    .join(", ");

                  return (
                    <p key={`hours-${summary.day}`} className="text-sm">
                      <span className="font-medium">{label}:</span>{" "}
                      {summary.windows.length === 0 ? (
                        <span className="text-muted-foreground">No hours</span>
                      ) : (
                        <span>{ranges}</span>
                      )}
                    </p>
                  );
                })}
              </div>
            )}
          </div>

          {/* Prerequisites */}
          <div className="space-y-3">
            <Label>Prerequisites</Label>
            {isPrereqsLoading ? (
              <Alert>
                <AlertTitle>Checking configuration</AlertTitle>
                <AlertDescription>
                  <p>Loading court hours and pricing rules.</p>
                </AlertDescription>
              </Alert>
            ) : (
              <>
                {!hasHours && (
                  <Alert variant="destructive">
                    <AlertTitle>Set court hours</AlertTitle>
                    <AlertDescription>
                      <p>Hours are required before publishing slots.</p>
                      {hoursHref && (
                        <div className="mt-2">
                          <Button asChild variant="outline" size="sm">
                            <Link href={hoursHref}>Configure hours</Link>
                          </Button>
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
                {!hasPricingRules && (
                  <Alert variant="destructive">
                    <AlertTitle>Set pricing rules</AlertTitle>
                    <AlertDescription>
                      <p>Pricing rules are required to derive slot prices.</p>
                      {pricingHref && (
                        <div className="mt-2">
                          <Button asChild variant="outline" size="sm">
                            <Link href={pricingHref}>Configure pricing</Link>
                          </Button>
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
                {hasHours && hasPricingRules && (
                  <Alert>
                    <AlertTitle>Ready to publish</AlertTitle>
                    <AlertDescription>
                      <p>
                        Slot prices are derived from pricing rules. Set hourly
                        rate to 0 for free slots.
                      </p>
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </div>

          {/* Preview */}
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm font-medium mb-1">Preview</p>
            {preview.slots.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No slots will be created for the selected dates.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">
                  Total: {preview.slots.length} slots
                </span>
                {mode === "recurring" && preview.totalDaysWithSlots > 0 && (
                  <>
                    {" "}
                    across{" "}
                    <span className="font-semibold text-foreground">
                      {preview.totalDaysWithSlots} days
                    </span>
                  </>
                )}
                {preview.wasTrimmed && (
                  <>
                    <br />
                    <span className="text-muted-foreground">
                      Auto-trimmed to {MAX_BULK_SLOTS} from{" "}
                      {preview.totalGenerated} slots.
                    </span>
                  </>
                )}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !canCreateSlots}
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Slots
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
