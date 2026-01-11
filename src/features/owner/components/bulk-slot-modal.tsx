"use client";

import { addDays, differenceInDays, format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { BulkSlotData } from "../hooks/use-slots";

interface BulkSlotModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: BulkSlotData) => void;
  isLoading?: boolean;
  defaultPrice?: number;
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

const DURATION_OPTIONS = [
  { value: 30, label: "30 minutes" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
  { value: 120, label: "2 hours" },
];

export function BulkSlotModal({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  defaultPrice = 0,
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
  const [duration, setDuration] = React.useState(60);
  const [useDefaultPrice, setUseDefaultPrice] = React.useState(true);
  const [customPrice, setCustomPrice] = React.useState(defaultPrice / 100);
  const defaultPriceLabel =
    defaultPrice > 0 ? `${(defaultPrice / 100).toFixed(0)} PHP` : "Free";

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
    const data: BulkSlotData = {
      startDate,
      endDate: mode === "recurring" ? endDate : undefined,
      daysOfWeek: mode === "recurring" ? selectedDays : undefined,
      startTime,
      endTime,
      duration,
      useDefaultPrice,
      customPrice: useDefaultPrice ? undefined : customPrice * 100,
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
            Create one or more time slots for your court
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

          {/* Duration */}
          <div className="space-y-2">
            <Label>Slot Duration</Label>
            <Select
              value={duration.toString()}
              onValueChange={(v) => setDuration(parseInt(v, 10))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DURATION_OPTIONS.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value.toString()}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Pricing */}
          <div className="space-y-3">
            <Label>Pricing</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="use-default"
                checked={useDefaultPrice}
                onCheckedChange={(checked) =>
                  setUseDefaultPrice(checked === true)
                }
              />
              <label
                htmlFor="use-default"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Use default price ({defaultPriceLabel})
              </label>
            </div>
            {!useDefaultPrice && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">PHP</span>
                <Input
                  type="number"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(parseFloat(e.target.value))}
                  className="w-32"
                />
              </div>
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
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Slots
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
