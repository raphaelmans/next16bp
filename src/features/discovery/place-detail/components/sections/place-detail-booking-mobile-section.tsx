"use client";

import * as React from "react";
import { formatInTimeZone } from "@/common/format";
import { useMediaQuery } from "@/common/hooks/use-media-query";
import {
  getZonedDayKey,
  getZonedDayRangeForInstant,
  getZonedStartOfDayIso,
  toUtcISOString,
} from "@/common/time-zone";
import {
  filterSlotsByDayKey,
  getWeekDayKeys,
  getWeekStartDayKey,
  mapAvailabilityOptionsToSlots,
  parseDayKeyToDate,
} from "@/features/discovery/helpers";
import {
  type PlaceDetail,
  useModDiscoveryPrefetchPort,
  useQueryDiscoveryAvailabilityForCourt,
  useQueryDiscoveryAvailabilityForPlaceSportRange,
} from "@/features/discovery/hooks";
import { PlaceDetail as PlaceDetailCompound } from "@/features/discovery/place-detail/components/place-detail";
import { buildBookingSelectionSummary } from "@/features/discovery/place-detail/helpers/booking-summary";
import {
  getNextDayKeyForInstant,
  isSameOrNextDay,
} from "@/features/discovery/place-detail/helpers/date-adjacency";
import { useModMobileWeekPrefetch } from "@/features/discovery/place-detail/hooks/use-mobile-week-prefetch";
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
  const mobileSheetExpanded = usePlaceDetailUiStore(
    (s) => s.mobileSheetExpanded,
  );
  const setMobileSheetExpanded = usePlaceDetailUiStore(
    (s) => s.setMobileSheetExpanded,
  );
  const [mobileCalendarOpen, setMobileCalendarOpen] = React.useState(false);

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

  const mobileDayDateIso = React.useMemo(
    () => getZonedStartOfDayIso(selectedDate ?? today, placeTimeZone),
    [placeTimeZone, selectedDate, today],
  );

  const summaryDayDateIso = React.useMemo(() => {
    if (!selectedStartTime) return "";
    return getZonedStartOfDayIso(new Date(selectedStartTime), placeTimeZone);
  }, [placeTimeZone, selectedStartTime]);

  const summaryDayEndIso = React.useMemo(() => {
    if (!selectedStartTime) return "";
    // End of the day that contains the selection's END time (supports cross-midnight)
    const selectionEnd = new Date(
      Date.parse(selectedStartTime) + durationMinutes * 60_000,
    );
    return toUtcISOString(
      getZonedDayRangeForInstant(selectionEnd, placeTimeZone).end,
    );
  }, [placeTimeZone, selectedStartTime, durationMinutes]);

  const mobileAnyDayQuery = useQueryDiscoveryAvailabilityForPlaceSportRange(
    {
      placeId: place.id,
      sportId: selectedSportId ?? "",
      startDate: mobileDayDateIso,
      endDate: mobileDayDateIso
        ? toUtcISOString(
            getZonedDayRangeForInstant(
              new Date(mobileDayDateIso),
              placeTimeZone,
            ).end,
          )
        : "",
      durationMinutes: TIMELINE_SLOT_DURATION,
      includeUnavailable: true,
      includeCourtOptions: false,
    },
    !isDesktop &&
      mobileSheetExpanded &&
      selectionMode === "any" &&
      !!selectedSportId &&
      !!mobileDayDateIso,
  );

  const mobileCourtDayQuery = useQueryDiscoveryAvailabilityForCourt(
    {
      courtId: selectedCourtId ?? "",
      date: mobileDayDateIso,
      durationMinutes: TIMELINE_SLOT_DURATION,
      includeUnavailable: true,
    },
    !isDesktop &&
      mobileSheetExpanded &&
      selectionMode === "court" &&
      !!selectedCourtId &&
      !!mobileDayDateIso,
  );

  const summaryCourtAvailabilityQuery = useQueryDiscoveryAvailabilityForCourt(
    {
      courtId: selectedCourtId ?? "",
      date: summaryDayDateIso,
      durationMinutes,
      includeUnavailable: true,
      selectedAddons,
    },
    !isDesktop &&
      selectionMode === "court" &&
      !!selectedStartTime &&
      !!selectedCourtId &&
      !!summaryDayDateIso &&
      durationMinutes > 0,
  );

  const summaryAnyAvailabilityQuery =
    useQueryDiscoveryAvailabilityForPlaceSportRange(
      {
        placeId: place.id,
        sportId: selectedSportId ?? "",
        startDate: summaryDayDateIso,
        endDate: summaryDayEndIso,
        durationMinutes,
        includeUnavailable: true,
        includeCourtOptions: false,
      },
      !isDesktop &&
        selectionMode === "any" &&
        !!selectedStartTime &&
        !!selectedSportId &&
        !!summaryDayDateIso &&
        !!summaryDayEndIso &&
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
    isDesktop,
    mobileSheetExpanded,
    placeId: place.id,
    placeTimeZone,
    selectionMode,
    selectedSportId,
    selectedCourtId,
    weekStartDayKey,
    weekDayKeys,
    durationMinutes: TIMELINE_SLOT_DURATION,
    hasPrefetchedMobileWeek,
    markPrefetchedMobileWeek,
    clearPrefetchedMobileWeek,
    utils,
  });

  const mobileDaySlots = React.useMemo(() => {
    const options =
      selectionMode === "any"
        ? (mobileAnyDayQuery.data?.options ?? [])
        : (mobileCourtDayQuery.data?.options ?? []);
    return filterSlotsByDayKey(
      mapAvailabilityOptionsToSlots(options, TIMELINE_SLOT_DURATION),
      selectedDayKey,
      placeTimeZone,
    );
  }, [
    selectionMode,
    mobileAnyDayQuery.data,
    mobileCourtDayQuery.data,
    placeTimeZone,
    selectedDayKey,
  ]);

  const isMobileLoading =
    selectionMode === "any"
      ? mobileAnyDayQuery.isLoading && !mobileAnyDayQuery.data
      : mobileCourtDayQuery.isLoading && !mobileCourtDayQuery.data;
  const isMobileRefreshing =
    selectionMode === "any"
      ? mobileAnyDayQuery.isFetching && !!mobileAnyDayQuery.data
      : mobileCourtDayQuery.isFetching && !!mobileCourtDayQuery.data;

  const selectedRange = React.useMemo(
    () =>
      selectedStartTime
        ? { startTime: selectedStartTime, durationMinutes }
        : undefined,
    [durationMinutes, selectedStartTime],
  );

  // Cross-day: when selection started on a different day (court mode only)
  const crossDayStartTime = React.useMemo(() => {
    if (!selectedStartTime || !selectedDate || selectionMode !== "court")
      return undefined;
    const startDayKey = getZonedDayKey(selectedStartTime, placeTimeZone);
    const currentDayKey = getZonedDayKey(selectedDate, placeTimeZone);
    if (startDayKey === currentDayKey) return undefined;
    // Only support forward direction: selection on day N, viewing day N+1
    const nextDayKey = getNextDayKeyForInstant(
      selectedStartTime,
      placeTimeZone,
    );
    if (currentDayKey !== nextDayKey) return undefined;
    // Cross-day anchor is only needed when current-day view has no visible
    // overlap from the existing selection (e.g., 10 PM-11 PM previous day).
    // Once overlap exists, let new taps start a fresh range on current day.
    const currentDayStartMs = Date.parse(
      getZonedStartOfDayIso(selectedDate, placeTimeZone),
    );
    const selectionEndMs =
      Date.parse(selectedStartTime) + durationMinutes * 60_000;
    if (selectionEndMs > currentDayStartMs) return undefined;
    return selectedStartTime;
  }, [
    durationMinutes,
    selectedStartTime,
    selectedDate,
    selectionMode,
    placeTimeZone,
  ]);

  const selectionSummary = React.useMemo(() => {
    const summaryOptions =
      selectionMode === "court"
        ? (summaryCourtAvailabilityQuery.data?.options ?? [])
        : (summaryAnyAvailabilityQuery.data?.options ?? []);
    return buildBookingSelectionSummary({
      selectedStartTime,
      durationMinutes,
      pickerSlots: mobileDaySlots,
      pricingOptions: summaryOptions,
    });
  }, [
    durationMinutes,
    mobileDaySlots,
    selectedStartTime,
    selectionMode,
    summaryAnyAvailabilityQuery.data?.options,
    summaryCourtAvailabilityQuery.data?.options,
  ]);

  React.useEffect(() => {
    if (isDesktop) return;
    onSelectionSummaryChange(selectionSummary);
  }, [isDesktop, onSelectionSummaryChange, selectionSummary]);

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

  const handleCourtRangeChange = React.useCallback(
    (range: { startTime: string; durationMinutes: number }) => {
      // Mirror desktop behavior: trust picker's committed range.
      // The picker already handles cross-day anchoring via crossDayStartTime.
      setSelectedStartTime(range.startTime);
      setDurationMinutes(range.durationMinutes);
    },
    [setDurationMinutes, setSelectedStartTime],
  );

  const handleAnyRangeChange = React.useCallback(
    (range: { startTime: string; durationMinutes: number }) => {
      if (!range.startTime) {
        setSelectedStartTime(undefined);
        return;
      }
      setSelectedStartTime(range.startTime);
      setDurationMinutes(range.durationMinutes);
    },
    [setDurationMinutes, setSelectedStartTime],
  );

  const handleMobileCalendarJump = React.useCallback(
    (date: Date | undefined) => {
      if (!date) return;
      const nextDayKey = getZonedDayKey(date, placeTimeZone);
      if (selectedStartTime) {
        const isAdjacentOrSame = isSameOrNextDay({
          selectedStartTimeIso: selectedStartTime,
          candidateDayKey: nextDayKey,
          timeZone: placeTimeZone,
        });
        setSelectedDate(parseDayKeyToDate(nextDayKey, placeTimeZone), {
          preserveSelection: isAdjacentOrSame,
        });
        if (!isAdjacentOrSame) {
          clearSelection(true);
        }
      } else {
        setSelectedDate(parseDayKeyToDate(nextDayKey, placeTimeZone));
      }
      setMobileCalendarOpen(false);
    },
    [clearSelection, placeTimeZone, selectedStartTime, setSelectedDate],
  );

  const handleMobileDateSelect = React.useCallback(
    (date: Date) => {
      const nextDayKey = getZonedDayKey(date, placeTimeZone);
      if (selectedStartTime) {
        const isAdjacentOrSame = isSameOrNextDay({
          selectedStartTimeIso: selectedStartTime,
          candidateDayKey: nextDayKey,
          timeZone: placeTimeZone,
        });
        setSelectedDate(parseDayKeyToDate(nextDayKey, placeTimeZone), {
          preserveSelection: isAdjacentOrSame,
        });
        if (!isAdjacentOrSame) {
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
      selectedDayKey={selectedDayKey}
      today={today}
      placeTimeZone={placeTimeZone}
      onMobileDateSelect={handleMobileDateSelect}
      mobileCalendarOpen={mobileCalendarOpen}
      setMobileCalendarOpen={setMobileCalendarOpen}
      onMobileCalendarJump={handleMobileCalendarJump}
      todayRangeStart={todayRangeStart}
      maxBookingDate={maxBookingDate}
      isMobileRefreshing={isMobileRefreshing}
      isMobileLoading={isMobileLoading}
      mobileDaySlots={mobileDaySlots}
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
      crossDayStartTime={crossDayStartTime}
    />
  );
}
