"use client";

import { addDays, differenceInDays, format } from "date-fns";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import type { BulkSlotData } from "../hooks/use-slots";

interface BulkSlotModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: BulkSlotData) => void;
  isLoading: boolean;
  isPrereqsLoading: boolean;
  hasHours: boolean;
  hasPricingRules: boolean;
  hoursHref?: string;
  pricingHref?: string;
  initialDate?: Date;
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

const SLOT_DURATION_MINUTES = 60;

export function BulkSlotModal({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  isPrereqsLoading,
  hasHours,
  hasPricingRules,
  hoursHref,
  pricingHref,
  initialDate,
}: BulkSlotModalProps) {
  const [mode, setMode] = React.useState<"single" | "recurring">("single");
  const [startDate, setStartDate] = React.useState<Date>(
    initialDate ?? new Date(),
  );
  const [endDate, setEndDate] = React.useState<Date>(
    addDays(initialDate ?? new Date(), 7),
  );
  const [selectedDays, setSelectedDays] = React.useState<number[]>([
    1, 2, 3, 4, 5,
  ]);
  const [startTime, setStartTime] = React.useState("06:00");
  const [endTime, setEndTime] = React.useState("22:00");
  const duration = SLOT_DURATION_MINUTES;
  const canCreateSlots = !isPrereqsLoading && hasHours && hasPricingRules;

  // Reset form when modal opens
  React.useEffect(() => {
    if (open && initialDate) {
      setStartDate(initialDate);
      setEndDate(addDays(initialDate, 7));
    }
  }, [open, initialDate]);

  // Calculate preview
  const calculatePreview = () => {
    const startHour = parseInt(startTime.split(":")[0], 10);
    const endHour = parseInt(endTime.split(":")[0], 10);
    const totalMinutes = (endHour - startHour) * 60;
    const slotsPerDay = Math.floor(totalMinutes / duration);

    if (mode === "single") {
      return { slotsPerDay, totalDays: 1, totalSlots: slotsPerDay };
    }

    // For recurring, count the days that match selected days of week
    let matchingDays = 0;
    const totalDays = differenceInDays(endDate, startDate) + 1;

    for (let i = 0; i < totalDays; i++) {
      const currentDate = addDays(startDate, i);
      if (selectedDays.includes(currentDate.getDay())) {
        matchingDays++;
      }
    }

    return {
      slotsPerDay,
      totalDays: matchingDays,
      totalSlots: slotsPerDay * matchingDays,
    };
  };

  const preview = calculatePreview();

  const handleSubmit = () => {
    if (!canCreateSlots) return;
    const data: BulkSlotData = {
      startDate,
      endDate: mode === "recurring" ? endDate : undefined,
      daysOfWeek: mode === "recurring" ? selectedDays : undefined,
      startTime,
      endTime,
      duration,
      useDefaultPrice: true,
    };
    onSubmit(data);
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
                        format(startDate, "PPP")
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
                            format(startDate, "MMM d, yyyy")
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
                            format(endDate, "MMM d, yyyy")
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

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-time">Start Time</Label>
              <Input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-time">End Time</Label>
              <Input
                id="end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
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
            <p className="text-sm text-muted-foreground">
              This will create{" "}
              <span className="font-semibold text-foreground">
                {preview.slotsPerDay} slots per day
              </span>
              {mode === "recurring" && (
                <>
                  {" "}
                  across{" "}
                  <span className="font-semibold text-foreground">
                    {preview.totalDays} days
                  </span>
                </>
              )}
              <br />
              <span className="font-semibold text-foreground">
                Total: {preview.totalSlots} slots
              </span>
            </p>
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
