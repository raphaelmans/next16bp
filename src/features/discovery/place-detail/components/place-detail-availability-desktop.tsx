"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import type * as React from "react";
import { MAX_BOOKING_WINDOW_DAYS } from "@/common/booking-window";
import {
  AvailabilityWeekGrid,
  AvailabilityWeekGridSkeleton,
  type TimeSlot,
  WeekNavigator,
} from "@/components/kudos";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

type TimeRangeSelection = {
  startTime: string;
  durationMinutes: number;
};

type ActiveAvailabilityError = {
  isError: boolean;
  isBookingWindowError: boolean;
  isRateLimited: boolean;
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
  weekHeaderLabel: string;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  isPrevWeekDisabled: boolean;
  isNextWeekDisabled: boolean;
  selectedDate?: Date;
  onCalendarJump: (date: Date | undefined) => void;
  todayRangeStart: Date;
  maxBookingDate: Date;
  placeTimeZone: string;
  onGoToToday: () => void;
  activeAvailabilityError: ActiveAvailabilityError;
  hasAvailabilitySlots: boolean;
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
  onClearSelection: () => void;
  todayDayKey: string;
  maxDayKey: string;
  sameDayAnchorDayKey?: string;
  cartedStartTimes?: Set<string>;
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
  weekHeaderLabel,
  onPrevWeek,
  onNextWeek,
  isPrevWeekDisabled,
  isNextWeekDisabled,
  selectedDate,
  onCalendarJump,
  todayRangeStart,
  maxBookingDate,
  placeTimeZone,
  onGoToToday,
  activeAvailabilityError,
  hasAvailabilitySlots,
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
  onClearSelection,
  todayDayKey,
  maxDayKey,
  sameDayAnchorDayKey,
  cartedStartTimes,
}: PlaceDetailAvailabilityDesktopProps) {
  const shouldRenderAvailabilityGrid =
    !activeAvailabilityError.isError || hasAvailabilitySlots;

  return (
    <div ref={availabilitySectionRef} className="scroll-mt-24 hidden lg:block">
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle>Availability</CardTitle>
              <p className="text-sm text-muted-foreground">
                Browse weekly availability and select a start/end range directly
                on the grid.
              </p>
            </div>
            <Badge variant="secondary" className="bg-primary/10 text-primary">
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
                              : "border-border bg-card text-foreground hover:border-primary/30 hover:bg-primary/10",
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

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-1">
                <p className="text-sm font-medium">Week of {weekHeaderLabel}</p>
                <p className="text-xs text-muted-foreground">
                  Choose a start slot, then choose an end slot.
                </p>
              </div>
              <WeekNavigator
                weekHeaderLabel={weekHeaderLabel}
                onPrevWeek={onPrevWeek}
                onNextWeek={onNextWeek}
                isPrevWeekDisabled={isPrevWeekDisabled}
                isNextWeekDisabled={isNextWeekDisabled}
                onGoToToday={onGoToToday}
                selectedDate={selectedDate}
                onCalendarJump={onCalendarJump}
                todayRangeStart={todayRangeStart}
                maxBookingDate={maxBookingDate}
                placeTimeZone={placeTimeZone}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-0">
          {activeAvailabilityError.isError && (
            <Alert variant="destructive" className="border-dashed">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Unable to load availability</AlertTitle>
              <AlertDescription className="space-y-3">
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
                      {activeAvailabilityError.isRateLimited
                        ? "Availability is being refreshed too often right now. Please wait a moment, then retry."
                        : "Something went wrong while loading availability. Please try again."}
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
            isLoadingAvailability ? (
              <AvailabilityWeekGridSkeleton
                dayKeys={weekDayKeys}
                timeZone={placeTimeZone}
              />
            ) : shouldRenderAvailabilityGrid ? (
              <AvailabilityWeekGrid
                dayKeys={weekDayKeys}
                slotsByDay={anyWeekSlotsByDay}
                timeZone={placeTimeZone}
                selectedRange={selectedRange}
                onRangeChange={onAnyRangeChange}
                onDayClick={onAnyWeekDayClick}
                todayDayKey={todayDayKey}
                maxDayKey={maxDayKey}
                cartedStartTimes={cartedStartTimes}
              />
            ) : null
          ) : !courtsForSport.length ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No active courts for this sport.
            </p>
          ) : !selectedCourtId ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Select a court to see available times.
            </p>
          ) : isLoadingAvailability ? (
            <AvailabilityWeekGridSkeleton
              dayKeys={weekDayKeys}
              timeZone={placeTimeZone}
            />
          ) : shouldRenderAvailabilityGrid ? (
            <AvailabilityWeekGrid
              dayKeys={weekDayKeys}
              slotsByDay={courtWeekSlotsByDay}
              timeZone={placeTimeZone}
              selectedRange={selectedRange}
              onRangeChange={onCourtRangeChange}
              onDayClick={onCourtWeekDayClick}
              todayDayKey={todayDayKey}
              maxDayKey={maxDayKey}
              sameDayAnchorDayKey={sameDayAnchorDayKey}
              sameDayCueMode="highlight-anchor"
              cartedStartTimes={cartedStartTimes}
            />
          ) : null}

          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
            >
              Clear selection
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
