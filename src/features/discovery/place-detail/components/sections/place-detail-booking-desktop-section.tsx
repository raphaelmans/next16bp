"use client";

import { addDays } from "date-fns";
import * as React from "react";
import { formatInTimeZone } from "@/common/format";
import { useMediaQuery } from "@/common/hooks/use-media-query";
import { getZonedDayKey } from "@/common/time-zone";
import type { TimeSlot } from "@/components/kudos";
import {
  buildSlotsByDayKey,
  getAvailabilityErrorInfo,
  getWeekDayKeys,
  getWeekStartDayKey,
  parseDayKeyToDate,
} from "@/features/discovery/helpers";
import {
  type PlaceDetail,
  useModDiscoveryPrefetchPort,
  useQueryDiscoveryAvailabilityForCourtRange,
  useQueryDiscoveryAvailabilityForPlaceSportRange,
} from "@/features/discovery/hooks";
import { PlaceDetail as PlaceDetailCompound } from "@/features/discovery/place-detail/components/place-detail";
import { buildBookingSelectionSummary } from "@/features/discovery/place-detail/helpers/booking-summary";
import { resolveCourtRangeAcrossWeekBoundary } from "@/features/discovery/place-detail/helpers/cross-week-range";
import { isWithinAdjacentWeek } from "@/features/discovery/place-detail/helpers/date-adjacency";
import {
  getSelectionSummaryQueryWindow,
  getWeekGridQueryWindow,
} from "@/features/discovery/place-detail/helpers/week-grid-query-window";
import { useModNextWeekPrefetch } from "@/features/discovery/place-detail/hooks/use-next-week-prefetch";
import type { BookingCartItem } from "@/features/discovery/place-detail/stores/booking-cart-store";

const TIMELINE_SLOT_DURATION = 60;

type SelectionSummary = {
  startTime: string;
  endTime: string;
  totalCents?: number;
  currency: string;
};

type PlaceDetailBookingDesktopSectionProps = {
  place: PlaceDetail;
  placeTimeZone: string;
  selectedDate?: Date;
  setSelectedDate: (
    date: Date | undefined,
    options?: { preserveSelection?: boolean },
  ) => void;
  durationMinutes: number;
  setDurationMinutes: (minutes: number) => void;
  selectedSportId?: string;
  setSelectedSportId: (sportId: string | undefined) => void;
  selectionMode: "any" | "court";
  setSelectionMode: (mode: "any" | "court") => void;
  selectedCourtId?: string;
  setSelectedCourtId: (courtId: string | undefined) => void;
  selectedAddons: { addonId: string; quantity: number }[];
  selectedStartTime?: string;
  setSelectedStartTime: (startTime: string | undefined) => void;
  courtsForSport: { id: string; label: string }[];
  clearSelection: (resetDuration?: boolean) => void;
  today: Date;
  todayRangeStart: Date;
  maxBookingDate: Date;
  todayDayKey: string;
  maxDayKey: string;
  sameDayAnchorDayKey?: string;
  availabilitySectionRef: React.RefObject<HTMLDivElement | null>;
  onSelectionSummaryChange: (summary: SelectionSummary | null) => void;
  cartItems: BookingCartItem[];
};

export function PlaceDetailBookingDesktopSection({
  place,
  placeTimeZone,
  selectedDate,
  setSelectedDate,
  durationMinutes,
  setDurationMinutes,
  selectedSportId,
  setSelectedSportId,
  selectionMode,
  setSelectionMode,
  selectedCourtId,
  setSelectedCourtId,
  selectedAddons,
  selectedStartTime,
  setSelectedStartTime,
  courtsForSport,
  clearSelection,
  today,
  todayRangeStart,
  maxBookingDate,
  todayDayKey,
  maxDayKey,
  sameDayAnchorDayKey,
  availabilitySectionRef,
  onSelectionSummaryChange,
  cartItems,
}: PlaceDetailBookingDesktopSectionProps) {
  const utils = useModDiscoveryPrefetchPort();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isDesktopViewport =
    isDesktop ||
    (typeof window !== "undefined" &&
      window.matchMedia("(min-width: 1024px)").matches);
  const [calendarPopoverOpen, setCalendarPopoverOpen] = React.useState(false);

  const selectedDayKey = React.useMemo(
    () => getZonedDayKey(selectedDate ?? today, placeTimeZone),
    [placeTimeZone, selectedDate, today],
  );

  const cartedStartTimes = React.useMemo(() => {
    if (selectionMode !== "court" || !selectedCourtId) return undefined;
    const set = new Set<string>();
    for (const item of cartItems) {
      if (item.courtId === selectedCourtId) {
        const startMs = Date.parse(item.startTime);
        const slotCount = item.durationMinutes / TIMELINE_SLOT_DURATION;
        for (let i = 0; i < slotCount; i++) {
          set.add(String(startMs + i * TIMELINE_SLOT_DURATION * 60_000));
        }
      }
    }
    return set.size > 0 ? set : undefined;
  }, [cartItems, selectedCourtId, selectionMode]);

  const weekStartDayKey = React.useMemo(
    () => getWeekStartDayKey(selectedDayKey, placeTimeZone),
    [placeTimeZone, selectedDayKey],
  );

  const weekDayKeys = React.useMemo(
    () => getWeekDayKeys(weekStartDayKey, placeTimeZone),
    [placeTimeZone, weekStartDayKey],
  );

  const weekStartDate = React.useMemo(
    () => parseDayKeyToDate(weekDayKeys[0] ?? selectedDayKey, placeTimeZone),
    [placeTimeZone, selectedDayKey, weekDayKeys],
  );

  const weekEndDate = React.useMemo(
    () => parseDayKeyToDate(weekDayKeys[6] ?? selectedDayKey, placeTimeZone),
    [placeTimeZone, selectedDayKey, weekDayKeys],
  );

  const shouldPreserveSelectionForDayKey = React.useCallback(
    (candidateDayKey: string) => {
      if (!selectedStartTime) return false;
      return isWithinAdjacentWeek({
        selectedStartTimeIso: selectedStartTime,
        candidateDayKey,
        timeZone: placeTimeZone,
      });
    },
    [placeTimeZone, selectedStartTime],
  );

  const weekQueryWindow = React.useMemo(
    () =>
      getWeekGridQueryWindow({
        weekDayKeys,
        selectedDayKey,
        selectedStartTime,
        timeZone: placeTimeZone,
        todayRangeStart,
        maxBookingDate,
      }),
    [
      maxBookingDate,
      placeTimeZone,
      selectedDayKey,
      selectedStartTime,
      todayRangeStart,
      weekDayKeys,
    ],
  );

  const summaryQueryWindow = React.useMemo(
    () =>
      getSelectionSummaryQueryWindow({
        selectedStartTime,
        durationMinutes,
        timeZone: placeTimeZone,
      }),
    [durationMinutes, placeTimeZone, selectedStartTime],
  );

  const prefetchedNextWeekRef = React.useRef<Set<string>>(new Set());
  const hasPrefetchedNextWeek = React.useCallback(
    (key: string) => prefetchedNextWeekRef.current.has(key),
    [],
  );
  const markPrefetchedNextWeek = React.useCallback((key: string) => {
    prefetchedNextWeekRef.current.add(key);
  }, []);
  const clearPrefetchedNextWeek = React.useCallback((key: string) => {
    prefetchedNextWeekRef.current.delete(key);
  }, []);

  useModNextWeekPrefetch({
    showBooking: true,
    isActiveSurface: isDesktopViewport,
    placeId: place.id,
    placeTimeZone,
    selectionMode,
    selectedSportId,
    selectedCourtId,
    selectedStartTime,
    currentWeekStartDayKey: weekStartDayKey,
    durationMinutes: TIMELINE_SLOT_DURATION,
    todayRangeStart,
    maxBookingDate,
    hasPrefetchedWeek: hasPrefetchedNextWeek,
    markPrefetchedWeek: markPrefetchedNextWeek,
    clearPrefetchedWeek: clearPrefetchedNextWeek,
    utils,
  });

  const courtWeekAvailabilityQuery = useQueryDiscoveryAvailabilityForCourtRange(
    {
      courtId: selectedCourtId ?? "",
      startDate: weekQueryWindow.startDateIso,
      endDate: weekQueryWindow.endDateIso,
      durationMinutes: TIMELINE_SLOT_DURATION,
      includeUnavailable: true,
    },
    isDesktopViewport && selectionMode === "court" && !!selectedCourtId,
  );

  const anyWeekAvailabilityQuery =
    useQueryDiscoveryAvailabilityForPlaceSportRange(
      {
        placeId: place.id,
        sportId: selectedSportId ?? "",
        startDate: weekQueryWindow.startDateIso,
        endDate: weekQueryWindow.endDateIso,
        durationMinutes: TIMELINE_SLOT_DURATION,
        includeUnavailable: true,
        includeCourtOptions: false,
      },
      isDesktopViewport && selectionMode === "any" && !!selectedSportId,
    );

  const summaryCourtAvailabilityQuery =
    useQueryDiscoveryAvailabilityForCourtRange(
      {
        courtId: selectedCourtId ?? "",
        startDate: summaryQueryWindow.startDateIso,
        endDate: summaryQueryWindow.endDateIso,
        durationMinutes,
        includeUnavailable: true,
        selectedAddons,
      },
      isDesktopViewport &&
        selectionMode === "court" &&
        !!selectedStartTime &&
        !!selectedCourtId &&
        !!summaryQueryWindow.startDateIso &&
        !!summaryQueryWindow.endDateIso &&
        durationMinutes > 0,
    );

  const summaryAnyAvailabilityQuery =
    useQueryDiscoveryAvailabilityForPlaceSportRange(
      {
        placeId: place.id,
        sportId: selectedSportId ?? "",
        startDate: summaryQueryWindow.startDateIso,
        endDate: summaryQueryWindow.endDateIso,
        durationMinutes,
        includeUnavailable: true,
        includeCourtOptions: false,
        selectedAddons,
      },
      isDesktopViewport &&
        selectionMode === "any" &&
        !!selectedStartTime &&
        !!selectedSportId &&
        !!summaryQueryWindow.startDateIso &&
        !!summaryQueryWindow.endDateIso &&
        durationMinutes > 0,
    );

  const anyWeekSlotsByDay = React.useMemo(() => {
    if (selectionMode !== "any") {
      return new Map<string, TimeSlot[]>();
    }
    return buildSlotsByDayKey(
      anyWeekAvailabilityQuery.data?.options ?? [],
      placeTimeZone,
      TIMELINE_SLOT_DURATION,
    );
  }, [anyWeekAvailabilityQuery.data, placeTimeZone, selectionMode]);

  const courtWeekSlotsByDay = React.useMemo(() => {
    if (selectionMode !== "court") {
      return new Map<string, TimeSlot[]>();
    }
    return buildSlotsByDayKey(
      courtWeekAvailabilityQuery.data?.options ?? [],
      placeTimeZone,
      TIMELINE_SLOT_DURATION,
    );
  }, [courtWeekAvailabilityQuery.data, placeTimeZone, selectionMode]);

  const activeAvailabilityError = React.useMemo(() => {
    const query =
      selectionMode === "any"
        ? anyWeekAvailabilityQuery
        : courtWeekAvailabilityQuery;
    return getAvailabilityErrorInfo(query.error, query.refetch);
  }, [anyWeekAvailabilityQuery, courtWeekAvailabilityQuery, selectionMode]);

  const isLoadingAvailability =
    selectionMode === "any"
      ? anyWeekAvailabilityQuery.isLoading && !anyWeekAvailabilityQuery.data
      : courtWeekAvailabilityQuery.isLoading &&
        !courtWeekAvailabilityQuery.data;

  const selectedRange = React.useMemo(
    () =>
      selectedStartTime
        ? { startTime: selectedStartTime, durationMinutes }
        : undefined,
    [durationMinutes, selectedStartTime],
  );

  const allWeekSlots = React.useMemo(() => {
    const source =
      selectionMode === "any" ? anyWeekSlotsByDay : courtWeekSlotsByDay;
    const slots: TimeSlot[] = [];
    for (const [, daySlots] of source) {
      slots.push(...daySlots);
    }
    return slots;
  }, [anyWeekSlotsByDay, courtWeekSlotsByDay, selectionMode]);

  const selectionSummary = React.useMemo(() => {
    if (!selectedStartTime) return null;

    const summaryOptions =
      selectionMode === "court"
        ? (summaryCourtAvailabilityQuery.data?.options ?? [])
        : (summaryAnyAvailabilityQuery.data?.options ?? []);

    return buildBookingSelectionSummary({
      selectedStartTime,
      durationMinutes,
      pickerSlots: allWeekSlots,
      pricingOptions: summaryOptions,
    });
  }, [
    allWeekSlots,
    durationMinutes,
    selectedStartTime,
    selectionMode,
    summaryAnyAvailabilityQuery.data?.options,
    summaryCourtAvailabilityQuery.data?.options,
  ]);

  React.useEffect(() => {
    if (!isDesktopViewport) return;
    onSelectionSummaryChange(selectionSummary);
  }, [isDesktopViewport, onSelectionSummaryChange, selectionSummary]);

  const setDateWithSelectionPolicy = React.useCallback(
    (date: Date | undefined, closeCalendar = false) => {
      if (!date) return;

      const nextDayKey = getZonedDayKey(date, placeTimeZone);
      if (selectedStartTime) {
        const preserveSelection = shouldPreserveSelectionForDayKey(nextDayKey);
        setSelectedDate(parseDayKeyToDate(nextDayKey, placeTimeZone), {
          preserveSelection,
        });
        if (!preserveSelection) {
          clearSelection(true);
        }
      } else {
        setSelectedDate(parseDayKeyToDate(nextDayKey, placeTimeZone));
      }

      if (closeCalendar) {
        setCalendarPopoverOpen(false);
      }
    },
    [
      clearSelection,
      placeTimeZone,
      selectedStartTime,
      setSelectedDate,
      shouldPreserveSelectionForDayKey,
    ],
  );

  const handleCourtRangeChange = React.useCallback(
    (range: { startTime: string; durationMinutes: number }) => {
      const resolvedRange = resolveCourtRangeAcrossWeekBoundary({
        selectedStartTime,
        incomingRange: range,
        visibleWeekDayKeys: weekDayKeys,
        slotsByDay: courtWeekSlotsByDay,
        timeZone: placeTimeZone,
        nowMs: Date.now(),
      });
      setSelectedStartTime(resolvedRange.startTime);
      setDurationMinutes(resolvedRange.durationMinutes);
    },
    [
      courtWeekSlotsByDay,
      placeTimeZone,
      selectedStartTime,
      setDurationMinutes,
      setSelectedStartTime,
      weekDayKeys,
    ],
  );

  const handleAnyRangeChange = React.useCallback(
    (range: { startTime: string; durationMinutes: number }) => {
      if (!range.startTime) {
        setSelectedStartTime(undefined);
        return;
      }
      const resolvedRange = resolveCourtRangeAcrossWeekBoundary({
        selectedStartTime,
        incomingRange: range,
        visibleWeekDayKeys: weekDayKeys,
        slotsByDay: anyWeekSlotsByDay,
        timeZone: placeTimeZone,
        nowMs: Date.now(),
      });
      setSelectedStartTime(resolvedRange.startTime);
      setDurationMinutes(resolvedRange.durationMinutes);
    },
    [
      anyWeekSlotsByDay,
      placeTimeZone,
      selectedStartTime,
      setDurationMinutes,
      setSelectedStartTime,
      weekDayKeys,
    ],
  );

  const handleGoToToday = React.useCallback(() => {
    setDateWithSelectionPolicy(today);
  }, [setDateWithSelectionPolicy, today]);

  const handleCalendarJump = React.useCallback(
    (date: Date | undefined) => {
      setDateWithSelectionPolicy(date, true);
    },
    [setDateWithSelectionPolicy],
  );

  const handleDesktopSportChange = React.useCallback(
    (value: string) => {
      setSelectedSportId(value);
    },
    [setSelectedSportId],
  );

  const handleDesktopSelectionModeChange = React.useCallback(
    (value: "any" | "court") => {
      setSelectionMode(value);
      clearSelection(true);
    },
    [clearSelection, setSelectionMode],
  );

  const handleDesktopCourtSelect = React.useCallback(
    (courtId: string) => {
      if (selectedCourtId === courtId) return;
      setSelectedCourtId(courtId);
    },
    [selectedCourtId, setSelectedCourtId],
  );

  const handleAnyWeekDayClick = React.useCallback(
    (dayKey: string) => {
      setDateWithSelectionPolicy(parseDayKeyToDate(dayKey, placeTimeZone));
    },
    [placeTimeZone, setDateWithSelectionPolicy],
  );

  const handleCourtWeekDayClick = React.useCallback(
    (dayKey: string) => {
      setDateWithSelectionPolicy(parseDayKeyToDate(dayKey, placeTimeZone));
    },
    [placeTimeZone, setDateWithSelectionPolicy],
  );

  const handleJumpToMaxDate = React.useCallback(() => {
    setDateWithSelectionPolicy(maxBookingDate);
  }, [maxBookingDate, setDateWithSelectionPolicy]);

  const handlePrevWeek = React.useCallback(() => {
    const prevWeekDate = addDays(weekStartDate, -7);
    setDateWithSelectionPolicy(
      prevWeekDate < todayRangeStart ? todayRangeStart : prevWeekDate,
    );
  }, [setDateWithSelectionPolicy, todayRangeStart, weekStartDate]);

  const handleNextWeek = React.useCallback(() => {
    const nextWeekDate = addDays(weekStartDate, 7);
    setDateWithSelectionPolicy(
      nextWeekDate > maxBookingDate ? maxBookingDate : nextWeekDate,
    );
  }, [maxBookingDate, setDateWithSelectionPolicy, weekStartDate]);

  const isPrevWeekDisabled = React.useMemo(() => {
    return weekStartDate <= todayRangeStart;
  }, [todayRangeStart, weekStartDate]);

  const isNextWeekDisabled = React.useMemo(() => {
    return weekEndDate >= maxBookingDate;
  }, [maxBookingDate, weekEndDate]);

  const weekHeaderLabel = React.useMemo(() => {
    const startLabel = formatInTimeZone(weekStartDate, placeTimeZone, "MMM d");
    const endLabel = formatInTimeZone(
      weekEndDate,
      placeTimeZone,
      "MMM d, yyyy",
    );
    return `${startLabel} - ${endLabel}`;
  }, [placeTimeZone, weekEndDate, weekStartDate]);

  return (
    <PlaceDetailCompound.AvailabilityDesktop
      availabilitySectionRef={availabilitySectionRef}
      selectedSportId={selectedSportId}
      sports={place.sports}
      onSportChange={handleDesktopSportChange}
      selectionMode={selectionMode}
      onSelectionModeChange={handleDesktopSelectionModeChange}
      courtsForSport={courtsForSport}
      selectedCourtId={selectedCourtId}
      onCourtSelect={handleDesktopCourtSelect}
      calendarPopoverOpen={calendarPopoverOpen}
      setCalendarPopoverOpen={setCalendarPopoverOpen}
      weekHeaderLabel={weekHeaderLabel}
      onPrevWeek={handlePrevWeek}
      onNextWeek={handleNextWeek}
      isPrevWeekDisabled={isPrevWeekDisabled}
      isNextWeekDisabled={isNextWeekDisabled}
      selectedDate={selectedDate}
      onCalendarJump={handleCalendarJump}
      todayRangeStart={todayRangeStart}
      maxBookingDate={maxBookingDate}
      placeTimeZone={placeTimeZone}
      onGoToToday={handleGoToToday}
      activeAvailabilityError={activeAvailabilityError}
      onJumpToMaxDate={handleJumpToMaxDate}
      isLoadingAvailability={isLoadingAvailability}
      weekDayKeys={weekDayKeys}
      anyWeekSlotsByDay={anyWeekSlotsByDay}
      courtWeekSlotsByDay={courtWeekSlotsByDay}
      selectedRange={selectedRange}
      onAnyRangeChange={handleAnyRangeChange}
      onCourtRangeChange={handleCourtRangeChange}
      onAnyWeekDayClick={handleAnyWeekDayClick}
      onCourtWeekDayClick={handleCourtWeekDayClick}
      onClearSelection={() => clearSelection(true)}
      todayDayKey={todayDayKey}
      maxDayKey={maxDayKey}
      sameDayAnchorDayKey={sameDayAnchorDayKey}
      cartedStartTimes={cartedStartTimes}
    />
  );
}
