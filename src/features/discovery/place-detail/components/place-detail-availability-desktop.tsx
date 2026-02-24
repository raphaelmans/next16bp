"use client";

import { AlertTriangle, Calendar, ChevronDown, RefreshCw } from "lucide-react";
import type * as React from "react";
import { MAX_BOOKING_WINDOW_DAYS } from "@/common/booking-window";
import { AvailabilityEmptyState } from "@/components/availability-empty-state";
import {
  AvailabilityWeekGrid,
  AvailabilityWeekGridSkeleton,
  KudosDatePicker,
  TimeRangePicker,
  TimeRangePickerSkeleton,
  type TimeSlot,
} from "@/components/kudos";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarWidget } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type {
  AvailabilityDiagnostics,
  PlaceContactDetail,
} from "@/features/discovery/hooks";
import { cn } from "@/lib/utils";

type TimeRangeSelection = {
  startTime: string;
  durationMinutes: number;
};

type ActiveAvailabilityError = {
  isError: boolean;
  isBookingWindowError: boolean;
  refetch: () => void;
};

type SportOption = {
  id: string;
  name: string;
};

type CourtOption = {
  id: string;
  label: string;
};

type PlaceDetailAvailabilityDesktopProps = {
  availabilitySectionRef: React.RefObject<HTMLDivElement | null>;
  selectedSportId?: string;
  sports: SportOption[];
  onSportChange: (value: string) => void;
  selectionMode: "any" | "court";
  onSelectionModeChange: (mode: "any" | "court") => void;
  courtsForSport: CourtOption[];
  selectedCourtId?: string;
  onCourtSelect: (courtId: string) => void;
  anyViewMode: "week" | "day";
  onAnyViewModeChange: (mode: "week" | "day") => void;
  courtViewMode: "week" | "day";
  onCourtViewModeChange: (mode: "week" | "day") => void;
  calendarPopoverOpen: boolean;
  setCalendarPopoverOpen: (open: boolean) => void;
  weekHeaderLabel: string;
  selectedDate?: Date;
  onCalendarJump: (date: Date | undefined) => void;
  todayRangeStart: Date;
  maxBookingDate: Date;
  placeTimeZone: string;
  onGoToToday: () => void;
  activeAvailabilityError: ActiveAvailabilityError;
  onJumpToMaxDate: () => void;
  isLoadingAvailability: boolean;
  weekDayKeys: string[];
  anyWeekSlotsByDay: Map<string, TimeSlot[]>;
  courtWeekSlotsByDay: Map<string, TimeSlot[]>;
  selectedRange?: TimeRangeSelection;
  onAnyRangeChange: (range: TimeRangeSelection) => void;
  onCourtRangeChange: (range: TimeRangeSelection) => void;
  onAnyWeekDayClick: (dayKey: string) => void;
  onCourtWeekDayClick: (dayKey: string) => void;
  onContinue: () => void;
  onClearSelection: () => void;
  todayDayKey: string;
  maxDayKey: string;
  sameDayAnchorDayKey?: string;
  anyDaySlots: TimeSlot[];
  courtDaySlots: TimeSlot[];
  anyDayDiagnostics: AvailabilityDiagnostics | null;
  courtDayDiagnostics: AvailabilityDiagnostics | null;
  contactDetail?: PlaceContactDetail;
};

export function PlaceDetailAvailabilityDesktop({
  availabilitySectionRef,
  selectedSportId,
  sports,
  onSportChange,
  selectionMode,
  onSelectionModeChange,
  courtsForSport,
  selectedCourtId,
  onCourtSelect,
  anyViewMode,
  onAnyViewModeChange,
  courtViewMode,
  onCourtViewModeChange,
  calendarPopoverOpen,
  setCalendarPopoverOpen,
  weekHeaderLabel,
  selectedDate,
  onCalendarJump,
  todayRangeStart,
  maxBookingDate,
  placeTimeZone,
  onGoToToday,
  activeAvailabilityError,
  onJumpToMaxDate,
  isLoadingAvailability,
  weekDayKeys,
  anyWeekSlotsByDay,
  courtWeekSlotsByDay,
  selectedRange,
  onAnyRangeChange,
  onCourtRangeChange,
  onAnyWeekDayClick,
  onCourtWeekDayClick,
  onContinue,
  onClearSelection,
  todayDayKey,
  maxDayKey,
  sameDayAnchorDayKey,
  anyDaySlots,
  courtDaySlots,
  anyDayDiagnostics,
  courtDayDiagnostics,
  contactDetail,
}: PlaceDetailAvailabilityDesktopProps) {
  const isCourtWeekView = courtViewMode === "week";

  return (
    <div ref={availabilitySectionRef} className="scroll-mt-24 hidden lg:block">
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle>Availability</CardTitle>
              <p className="text-sm text-muted-foreground">
                Browse times across courts, or pick a specific court to select a
                range.
              </p>
            </div>
            <Badge variant="secondary" className="bg-accent/10 text-accent">
              Live availability
            </Badge>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Sport</p>
            <Tabs value={selectedSportId} onValueChange={onSportChange}>
              <TabsList>
                {sports.map((sport) => (
                  <TabsTrigger key={sport.id} value={sport.id}>
                    {sport.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="space-y-2">
              <p className="text-sm font-medium">View</p>
              <ToggleGroup
                type="single"
                value={selectionMode}
                onValueChange={(value) => {
                  if (!value) return;
                  onSelectionModeChange(value as "any" | "court");
                }}
              >
                <ToggleGroupItem value="court" size="sm">
                  Pick a court
                </ToggleGroupItem>
                <ToggleGroupItem value="any" size="sm">
                  Any court
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            {selectionMode !== "court" ? null : (
              <div className="space-y-2">
                <p className="text-sm font-medium">Court</p>
                {courtsForSport.length > 0 ? (
                  <div className="-mx-1 overflow-x-auto px-1 scrollbar-none">
                    <div className="flex gap-1.5">
                      {courtsForSport.map((court) => (
                        <button
                          key={court.id}
                          type="button"
                          onClick={() => onCourtSelect(court.id)}
                          className={cn(
                            "shrink-0 rounded-lg border px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
                            selectedCourtId === court.id
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-card text-foreground hover:border-accent/30 hover:bg-accent/10",
                          )}
                        >
                          {court.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    No active courts for this sport.
                  </p>
                )}
              </div>
            )}
          </div>

          {selectionMode === "any" && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Schedule view</p>
                  <p className="text-xs text-muted-foreground">
                    Click a start time, then click an end time to select a
                    range.
                  </p>
                </div>
                <ToggleGroup
                  type="single"
                  value={anyViewMode}
                  onValueChange={(value) => {
                    if (!value) return;
                    onAnyViewModeChange(value as "week" | "day");
                  }}
                >
                  <ToggleGroupItem value="week" size="sm">
                    Week
                  </ToggleGroupItem>
                  <ToggleGroupItem value="day" size="sm">
                    Day
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              {anyViewMode === "week" ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Popover
                    open={calendarPopoverOpen}
                    onOpenChange={setCalendarPopoverOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        aria-label="Open calendar to jump to a date"
                      >
                        <Calendar className="h-3.5 w-3.5" />
                        {weekHeaderLabel}
                        <ChevronDown
                          className={cn(
                            "h-3 w-3 opacity-50 transition-transform duration-200",
                            calendarPopoverOpen && "rotate-180",
                          )}
                        />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarWidget
                        mode="single"
                        selected={selectedDate}
                        onSelect={onCalendarJump}
                        disabled={(date) => {
                          if (date < todayRangeStart) return true;
                          if (date > maxBookingDate) return true;
                          return false;
                        }}
                        timeZone={placeTimeZone}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onGoToToday}
                  >
                    Today
                  </Button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <KudosDatePicker
                    value={selectedDate}
                    onChange={onCalendarJump}
                    placeholder="Choose a date"
                    maxDate={maxBookingDate}
                    timeZone={placeTimeZone}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onGoToToday}
                  >
                    Today
                  </Button>
                </div>
              )}
            </div>
          )}

          {selectionMode === "court" && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Schedule view</p>
                  <p className="text-xs text-muted-foreground">
                    Click a start time, then click an end time to select a
                    range.
                  </p>
                </div>
                <ToggleGroup
                  type="single"
                  value={courtViewMode}
                  onValueChange={(value) => {
                    if (!value) return;
                    onCourtViewModeChange(value as "week" | "day");
                  }}
                >
                  <ToggleGroupItem value="week" size="sm">
                    Week
                  </ToggleGroupItem>
                  <ToggleGroupItem value="day" size="sm">
                    Day
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              {isCourtWeekView ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Popover
                    open={calendarPopoverOpen}
                    onOpenChange={setCalendarPopoverOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        aria-label="Open calendar to jump to a date"
                      >
                        <Calendar className="h-3.5 w-3.5" />
                        {weekHeaderLabel}
                        <ChevronDown
                          className={cn(
                            "h-3 w-3 opacity-50 transition-transform duration-200",
                            calendarPopoverOpen && "rotate-180",
                          )}
                        />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarWidget
                        mode="single"
                        selected={selectedDate}
                        onSelect={onCalendarJump}
                        disabled={(date) => {
                          if (date < todayRangeStart) return true;
                          if (date > maxBookingDate) return true;
                          return false;
                        }}
                        timeZone={placeTimeZone}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onGoToToday}
                  >
                    Today
                  </Button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <KudosDatePicker
                    value={selectedDate}
                    onChange={onCalendarJump}
                    placeholder="Choose a date"
                    maxDate={maxBookingDate}
                    timeZone={placeTimeZone}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onGoToToday}
                  >
                    Today
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {activeAvailabilityError.isError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>
                {activeAvailabilityError.isBookingWindowError
                  ? "Date beyond booking window"
                  : "Failed to load availability"}
              </AlertTitle>
              <AlertDescription>
                {activeAvailabilityError.isBookingWindowError ? (
                  <div className="flex flex-col gap-2">
                    <p>
                      Bookings are available up to {MAX_BOOKING_WINDOW_DAYS}{" "}
                      days in advance.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-fit"
                      onClick={onJumpToMaxDate}
                    >
                      Jump to the latest available date
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <p>
                      Something went wrong while loading availability. Please
                      try again.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-fit"
                      onClick={() => activeAvailabilityError.refetch()}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Retry
                    </Button>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {selectionMode === "any" ? (
            anyViewMode === "week" ? (
              isLoadingAvailability ? (
                <AvailabilityWeekGridSkeleton
                  dayKeys={weekDayKeys}
                  timeZone={placeTimeZone}
                />
              ) : (
                <AvailabilityWeekGrid
                  dayKeys={weekDayKeys}
                  slotsByDay={anyWeekSlotsByDay}
                  timeZone={placeTimeZone}
                  selectedRange={selectedRange}
                  onRangeChange={onAnyRangeChange}
                  onDayClick={onAnyWeekDayClick}
                  onContinue={onContinue}
                  todayDayKey={todayDayKey}
                  maxDayKey={maxDayKey}
                />
              )
            ) : !selectedDate ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Select a date to see available start times.
              </p>
            ) : isLoadingAvailability ? (
              <TimeRangePickerSkeleton count={8} />
            ) : anyDaySlots.length > 0 ? (
              <TimeRangePicker
                slots={anyDaySlots}
                timeZone={placeTimeZone}
                selectedStartTime={selectedRange?.startTime}
                selectedDurationMinutes={selectedRange?.durationMinutes}
                showPrice
                onChange={onAnyRangeChange}
                onClear={onClearSelection}
                onContinue={onContinue}
              />
            ) : (
              <AvailabilityEmptyState
                diagnostics={anyDayDiagnostics}
                variant="public"
                contact={contactDetail}
              />
            )
          ) : !courtsForSport.length ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No active courts for this sport.
            </p>
          ) : !selectedCourtId ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Select a court to see available times.
            </p>
          ) : isCourtWeekView ? (
            isLoadingAvailability ? (
              <AvailabilityWeekGridSkeleton
                dayKeys={weekDayKeys}
                timeZone={placeTimeZone}
              />
            ) : (
              <AvailabilityWeekGrid
                dayKeys={weekDayKeys}
                slotsByDay={courtWeekSlotsByDay}
                timeZone={placeTimeZone}
                selectedRange={selectedRange}
                onRangeChange={onCourtRangeChange}
                onDayClick={onCourtWeekDayClick}
                onContinue={onContinue}
                todayDayKey={todayDayKey}
                maxDayKey={maxDayKey}
                sameDayAnchorDayKey={sameDayAnchorDayKey}
                sameDayCueMode="highlight-anchor"
              />
            )
          ) : !selectedDate ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Select a date to see available start times.
            </p>
          ) : isLoadingAvailability ? (
            <TimeRangePickerSkeleton count={8} />
          ) : courtDaySlots.length > 0 ? (
            <TimeRangePicker
              slots={courtDaySlots}
              timeZone={placeTimeZone}
              selectedStartTime={selectedRange?.startTime}
              selectedDurationMinutes={selectedRange?.durationMinutes}
              showPrice
              onChange={onCourtRangeChange}
              onClear={onClearSelection}
              onContinue={onContinue}
            />
          ) : (
            <AvailabilityEmptyState
              diagnostics={courtDayDiagnostics}
              variant="public"
              contact={contactDetail}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
