"use client";

import { addDays } from "date-fns";
import * as React from "react";
import { formatInTimeZone } from "@/common/format";
import { useMediaQuery } from "@/common/hooks/use-media-query";
import { getZonedDayKey } from "@/common/time-zone";
import {
  buildSlotsByDayKey,
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
import { useModMobileWeekPrefetch } from "@/features/discovery/place-detail/hooks/use-mobile-week-prefetch";
import { useModNextWeekPrefetch } from "@/features/discovery/place-detail/hooks/use-next-week-prefetch";
import type { BookingCartItem } from "@/features/discovery/place-detail/stores/booking-cart-store";
import { usePlaceDetailUiStore } from "@/features/discovery/place-detail/stores/place-detail-ui-store";

const TIMELINE_SLOT_DURATION = 60;

type SelectionSummary = {
  startTime: string;
  endTime: string;
  totalCents?: number;
  currency: string;
};

type PlaceDetailBookingMobileSectionProps = {
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
  onContinue: () => void;
  onContinueFromCart: () => void;
  onSelectionSummaryChange: (summary: SelectionSummary | null) => void;
  cartItems: BookingCartItem[];
  canAddToCart: boolean;
  onAddToCartAction: () => void;
  onRemoveFromCartAction: (key: string) => void;
  onSaveSnapshot: () => void;
  onRestoreSnapshot: () => void;
};

export function PlaceDetailBookingMobileSection({
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
  onContinue,
  onContinueFromCart,
  onSelectionSummaryChange,
  cartItems,
  canAddToCart,
  onAddToCartAction,
  onRemoveFromCartAction,
  onSaveSnapshot,
  onRestoreSnapshot,
}: PlaceDetailBookingMobileSectionProps) {
  const utils = useModDiscoveryPrefetchPort();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isDesktopViewport =
    isDesktop ||
    (typeof window !== "undefined" &&
      window.matchMedia("(min-width: 1024px)").matches);
  const mobileSheetExpanded = usePlaceDetailUiStore(
    (s) => s.mobileSheetExpanded,
  );
  const setMobileSheetExpanded = usePlaceDetailUiStore(
    (s) => s.setMobileSheetExpanded,
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

  const selectedDayKey = React.useMemo(
    () => getZonedDayKey(selectedDate ?? today, placeTimeZone),
    [placeTimeZone, selectedDate, today],
  );
  const weekStartDayKey = React.useMemo(
    () => getWeekStartDayKey(selectedDayKey, placeTimeZone),
    [placeTimeZone, selectedDayKey],
  );
  const weekDayKeys = React.useMemo(
    () => getWeekDayKeys(weekStartDayKey, placeTimeZone),
    [placeTimeZone, weekStartDayKey],
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

  // Week-range queries (one per mode)
  const mobileCourtWeekQuery = useQueryDiscoveryAvailabilityForCourtRange(
    {
      courtId: selectedCourtId ?? "",
      startDate: weekQueryWindow.startDateIso,
      endDate: weekQueryWindow.endDateIso,
      durationMinutes: TIMELINE_SLOT_DURATION,
      includeUnavailable: true,
    },
    !isDesktopViewport &&
      mobileSheetExpanded &&
      selectionMode === "court" &&
      !!selectedCourtId,
  );

  const mobileAnyWeekQuery = useQueryDiscoveryAvailabilityForPlaceSportRange(
    {
      placeId: place.id,
      sportId: selectedSportId ?? "",
      startDate: weekQueryWindow.startDateIso,
      endDate: weekQueryWindow.endDateIso,
      durationMinutes: TIMELINE_SLOT_DURATION,
      includeUnavailable: true,
      includeCourtOptions: false,
    },
    !isDesktopViewport &&
      mobileSheetExpanded &&
      selectionMode === "any" &&
      !!selectedSportId,
  );

  // Summary pricing queries (use selected duration for pricing accuracy)
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
      !isDesktopViewport &&
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
      !isDesktopViewport &&
        selectionMode === "any" &&
        !!selectedStartTime &&
        !!selectedSportId &&
        !!summaryQueryWindow.startDateIso &&
        !!summaryQueryWindow.endDateIso &&
        durationMinutes > 0,
    );

  const prefetchedMobileWeekRef = React.useRef<Set<string>>(new Set());
  const hasPrefetchedMobileWeek = React.useCallback(
    (key: string) => prefetchedMobileWeekRef.current.has(key),
    [],
  );
  const markPrefetchedMobileWeek = React.useCallback((key: string) => {
    prefetchedMobileWeekRef.current.add(key);
  }, []);
  const clearPrefetchedMobileWeek = React.useCallback((key: string) => {
    prefetchedMobileWeekRef.current.delete(key);
  }, []);

  useModMobileWeekPrefetch({
    showBooking: true,
    isDesktop: isDesktopViewport,
    mobileSheetExpanded,
    placeId: place.id,
    placeTimeZone,
    selectionMode,
    selectedSportId,
    selectedCourtId,
    weekStartDayKey,
    weekDayKeys,
    durationMinutes: TIMELINE_SLOT_DURATION,
    todayRangeStart,
    maxBookingDate,
    hasPrefetchedMobileWeek,
    markPrefetchedMobileWeek,
    clearPrefetchedMobileWeek,
    utils,
  });

  useModNextWeekPrefetch({
    showBooking: true,
    isActiveSurface: !isDesktopViewport,
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
    hasPrefetchedWeek: hasPrefetchedMobileWeek,
    markPrefetchedWeek: markPrefetchedMobileWeek,
    clearPrefetchedWeek: clearPrefetchedMobileWeek,
    utils,
  });

  // Build week slots map from week-range query data
  const mobileWeekSlotsByDay = React.useMemo(() => {
    const options =
      selectionMode === "any"
        ? (mobileAnyWeekQuery.data?.options ?? [])
        : (mobileCourtWeekQuery.data?.options ?? []);
    return buildSlotsByDayKey(options, placeTimeZone, TIMELINE_SLOT_DURATION);
  }, [
    selectionMode,
    mobileAnyWeekQuery.data,
    mobileCourtWeekQuery.data,
    placeTimeZone,
  ]);

  const isMobileLoading =
    selectionMode === "any"
      ? mobileAnyWeekQuery.isLoading && !mobileAnyWeekQuery.data
      : mobileCourtWeekQuery.isLoading && !mobileCourtWeekQuery.data;
  const isMobileRefreshing =
    selectionMode === "any"
      ? mobileAnyWeekQuery.isFetching && !!mobileAnyWeekQuery.data
      : mobileCourtWeekQuery.isFetching && !!mobileCourtWeekQuery.data;

  const selectedRange = React.useMemo(
    () =>
      selectedStartTime
        ? { startTime: selectedStartTime, durationMinutes }
        : undefined,
    [durationMinutes, selectedStartTime],
  );

  // Flatten week slots for summary computation
  const allWeekSlots = React.useMemo(() => {
    const slots: import("@/components/kudos").TimeSlot[] = [];
    for (const [, daySlots] of mobileWeekSlotsByDay) {
      slots.push(...daySlots);
    }
    return slots;
  }, [mobileWeekSlotsByDay]);

  const selectionSummary = React.useMemo(() => {
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
    durationMinutes,
    allWeekSlots,
    selectedStartTime,
    selectionMode,
    summaryAnyAvailabilityQuery.data?.options,
    summaryCourtAvailabilityQuery.data?.options,
  ]);

  React.useEffect(() => {
    if (isDesktopViewport) return;
    onSelectionSummaryChange(selectionSummary);
  }, [isDesktopViewport, onSelectionSummaryChange, selectionSummary]);

  const hasSelection = !!selectedStartTime;
  const formattedDateLabel = React.useMemo(
    () =>
      selectedDate
        ? formatInTimeZone(selectedDate, placeTimeZone, "MMM d, yyyy")
        : "",
    [placeTimeZone, selectedDate],
  );
  const selectionDateLabel =
    hasSelection && selectedStartTime
      ? `${formatInTimeZone(
          new Date(selectedStartTime),
          placeTimeZone,
          "EEE, MMM d",
        )}`
      : formattedDateLabel || "Pick a date";
  const selectionTimeLabel =
    hasSelection && selectedStartTime
      ? `${formatInTimeZone(
          new Date(selectedStartTime),
          placeTimeZone,
          "h:mm a",
        )}${
          selectionSummary?.endTime
            ? `-${formatInTimeZone(
                new Date(selectionSummary.endTime),
                placeTimeZone,
                getZonedDayKey(selectedStartTime, placeTimeZone) !==
                  getZonedDayKey(selectionSummary.endTime, placeTimeZone)
                  ? "MMM d, h:mm a"
                  : "h:mm a",
              )}`
            : ""
        }`
      : "";

  const weekStartDate = React.useMemo(
    () => parseDayKeyToDate(weekDayKeys[0] ?? selectedDayKey, placeTimeZone),
    [placeTimeZone, selectedDayKey, weekDayKeys],
  );

  const weekEndDate = React.useMemo(
    () => parseDayKeyToDate(weekDayKeys[6] ?? selectedDayKey, placeTimeZone),
    [placeTimeZone, selectedDayKey, weekDayKeys],
  );

  const weekHeaderLabel = React.useMemo(() => {
    const startLabel = formatInTimeZone(weekStartDate, placeTimeZone, "MMM d");
    const endLabel = formatInTimeZone(
      weekEndDate,
      placeTimeZone,
      "MMM d, yyyy",
    );
    return `${startLabel} - ${endLabel}`;
  }, [placeTimeZone, weekEndDate, weekStartDate]);

  const handlePrevWeek = React.useCallback(() => {
    const prevWeekDate = addDays(weekStartDate, -7);
    const target =
      prevWeekDate < todayRangeStart ? todayRangeStart : prevWeekDate;
    if (selectedStartTime) {
      const nextDayKey = getZonedDayKey(target, placeTimeZone);
      const preserveSelection = isWithinAdjacentWeek({
        selectedStartTimeIso: selectedStartTime,
        candidateDayKey: nextDayKey,
        timeZone: placeTimeZone,
      });
      setSelectedDate(parseDayKeyToDate(nextDayKey, placeTimeZone), {
        preserveSelection,
      });
      if (!preserveSelection) {
        clearSelection(true);
      }
    } else {
      setSelectedDate(target);
    }
  }, [
    clearSelection,
    placeTimeZone,
    selectedStartTime,
    setSelectedDate,
    todayRangeStart,
    weekStartDate,
  ]);

  const handleNextWeek = React.useCallback(() => {
    const nextWeekDate = addDays(weekStartDate, 7);
    const target =
      nextWeekDate > maxBookingDate ? maxBookingDate : nextWeekDate;
    if (selectedStartTime) {
      const nextDayKey = getZonedDayKey(target, placeTimeZone);
      const preserveSelection = isWithinAdjacentWeek({
        selectedStartTimeIso: selectedStartTime,
        candidateDayKey: nextDayKey,
        timeZone: placeTimeZone,
      });
      setSelectedDate(parseDayKeyToDate(nextDayKey, placeTimeZone), {
        preserveSelection,
      });
      if (!preserveSelection) {
        clearSelection(true);
      }
    } else {
      setSelectedDate(target);
    }
  }, [
    clearSelection,
    maxBookingDate,
    placeTimeZone,
    selectedStartTime,
    setSelectedDate,
    weekStartDate,
  ]);

  const isPrevWeekDisabled = React.useMemo(() => {
    return weekStartDate <= todayRangeStart;
  }, [todayRangeStart, weekStartDate]);

  const isNextWeekDisabled = React.useMemo(() => {
    return weekEndDate >= maxBookingDate;
  }, [maxBookingDate, weekEndDate]);

  const handleGoToToday = React.useCallback(() => {
    if (selectedStartTime) {
      const todayDayKey = getZonedDayKey(today, placeTimeZone);
      const preserveSelection = isWithinAdjacentWeek({
        selectedStartTimeIso: selectedStartTime,
        candidateDayKey: todayDayKey,
        timeZone: placeTimeZone,
      });
      setSelectedDate(parseDayKeyToDate(todayDayKey, placeTimeZone), {
        preserveSelection,
      });
      if (!preserveSelection) {
        clearSelection(true);
      }
    } else {
      setSelectedDate(today);
    }
  }, [
    clearSelection,
    placeTimeZone,
    selectedStartTime,
    setSelectedDate,
    today,
  ]);

  const handleCourtRangeChange = React.useCallback(
    (range: { startTime: string; durationMinutes: number }) => {
      const resolvedRange = resolveCourtRangeAcrossWeekBoundary({
        selectedStartTime,
        incomingRange: range,
        visibleWeekDayKeys: weekDayKeys,
        slotsByDay: mobileWeekSlotsByDay,
        timeZone: placeTimeZone,
        nowMs: Date.now(),
      });
      setSelectedStartTime(resolvedRange.startTime);
      setDurationMinutes(resolvedRange.durationMinutes);
    },
    [
      mobileWeekSlotsByDay,
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
        slotsByDay: mobileWeekSlotsByDay,
        timeZone: placeTimeZone,
        nowMs: Date.now(),
      });
      setSelectedStartTime(resolvedRange.startTime);
      setDurationMinutes(resolvedRange.durationMinutes);
    },
    [
      mobileWeekSlotsByDay,
      placeTimeZone,
      selectedStartTime,
      setDurationMinutes,
      setSelectedStartTime,
      weekDayKeys,
    ],
  );

  const handleMobileCalendarJump = React.useCallback(
    (date: Date | undefined) => {
      if (!date) return;
      const nextDayKey = getZonedDayKey(date, placeTimeZone);
      if (selectedStartTime) {
        const preserveSelection = isWithinAdjacentWeek({
          selectedStartTimeIso: selectedStartTime,
          candidateDayKey: nextDayKey,
          timeZone: placeTimeZone,
        });
        setSelectedDate(parseDayKeyToDate(nextDayKey, placeTimeZone), {
          preserveSelection,
        });
        if (!preserveSelection) {
          clearSelection(true);
        }
      } else {
        setSelectedDate(parseDayKeyToDate(nextDayKey, placeTimeZone));
      }
    },
    [clearSelection, placeTimeZone, selectedStartTime, setSelectedDate],
  );

  const handleMobileSportChange = React.useCallback(
    (sportId: string) => {
      setSelectedSportId(sportId);
    },
    [setSelectedSportId],
  );

  // Snapshot save/restore uses the machine bridge from props
  const handleAddToCartWithSnapshot = React.useCallback(() => {
    onSaveSnapshot();
    onAddToCartAction();
  }, [onAddToCartAction, onSaveSnapshot]);

  const handleBackToSelect = React.useCallback(() => {
    onRestoreSnapshot();
  }, [onRestoreSnapshot]);

  // Court change: machine handles memory save/restore automatically
  const handleMobileCourtChange = React.useCallback(
    (courtId: string | undefined) => {
      if (courtId) {
        setSelectionMode("court");
        setSelectedCourtId(courtId);
      } else {
        setSelectionMode("any");
        setSelectedCourtId(undefined);
        clearSelection(true);
      }
    },
    [clearSelection, setSelectedCourtId, setSelectionMode],
  );

  return (
    <PlaceDetailCompound.MobileSheet
      showBooking
      mobileSheetExpanded={mobileSheetExpanded}
      setMobileSheetExpanded={setMobileSheetExpanded}
      sports={place.sports}
      selectedSportId={selectedSportId}
      onMobileSportChange={handleMobileSportChange}
      courtsForSport={courtsForSport}
      selectionMode={selectionMode}
      selectedCourtId={selectedCourtId}
      onMobileCourtChange={handleMobileCourtChange}
      selectedDate={selectedDate}
      placeTimeZone={placeTimeZone}
      onCalendarJump={handleMobileCalendarJump}
      todayRangeStart={todayRangeStart}
      maxBookingDate={maxBookingDate}
      isMobileRefreshing={isMobileRefreshing}
      isMobileLoading={isMobileLoading}
      weekDayKeys={weekDayKeys}
      weekSlotsByDay={mobileWeekSlotsByDay}
      todayDayKey={getZonedDayKey(today, placeTimeZone)}
      maxDayKey={getZonedDayKey(maxBookingDate, placeTimeZone)}
      selectedRange={selectedRange}
      onAnyRangeChange={handleAnyRangeChange}
      onCourtRangeChange={handleCourtRangeChange}
      onClearSelection={() => clearSelection(true)}
      onReserve={onContinue}
      onContinueFromCart={onContinueFromCart}
      onBackToSelect={handleBackToSelect}
      hasSelection={hasSelection}
      selectionSummary={selectionSummary}
      selectionDateLabel={selectionDateLabel}
      selectionTimeLabel={selectionTimeLabel}
      cartItems={cartItems}
      canAddToCart={canAddToCart}
      onAddToCartAction={handleAddToCartWithSnapshot}
      onRemoveFromCartAction={onRemoveFromCartAction}
      cartedStartTimes={cartedStartTimes}
      weekHeaderLabel={weekHeaderLabel}
      onPrevWeek={handlePrevWeek}
      onNextWeek={handleNextWeek}
      isPrevWeekDisabled={isPrevWeekDisabled}
      isNextWeekDisabled={isNextWeekDisabled}
      onGoToToday={handleGoToToday}
    />
  );
}
