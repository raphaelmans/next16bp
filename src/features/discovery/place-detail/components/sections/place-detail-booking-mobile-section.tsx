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
import { useModMobileWeekPrefetch } from "@/features/discovery/place-detail/hooks/use-mobile-week-prefetch";
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
  setSelectedDate: (date: Date | undefined) => void;
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
  onSelectionSummaryChange: (summary: SelectionSummary | null) => void;
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
  onSelectionSummaryChange,
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
      selectedAddons:
        selectionMode === "court" ? selectedAddons : undefined,
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
      selectedAddons,
    },
    !isDesktop &&
      mobileSheetExpanded &&
      selectionMode === "court" &&
      !!selectedCourtId &&
      !!mobileDayDateIso,
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
    selectedAddons,
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
    const slots = mapAvailabilityOptionsToSlots(
      options,
      TIMELINE_SLOT_DURATION,
    );
    return slots.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [selectionMode, mobileAnyDayQuery.data, mobileCourtDayQuery.data]);

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

  const selectionSummary = React.useMemo(() => {
    if (!selectedStartTime) return null;
    const startIdx = mobileDaySlots.findIndex(
      (slot) => slot.startTime === selectedStartTime,
    );
    if (startIdx === -1) return null;

    const slotCount = durationMinutes / TIMELINE_SLOT_DURATION;
    let totalCents = 0;
    let allHavePrice = true;
    let endTime = mobileDaySlots[startIdx]?.endTime ?? "";

    for (
      let i = startIdx;
      i < startIdx + slotCount && i < mobileDaySlots.length;
      i++
    ) {
      if (mobileDaySlots[i].priceCents !== undefined) {
        totalCents += mobileDaySlots[i].priceCents as number;
      } else {
        allHavePrice = false;
      }
      endTime = mobileDaySlots[i].endTime;
    }

    return {
      startTime: selectedStartTime,
      endTime,
      totalCents: allHavePrice ? totalCents : undefined,
      currency: mobileDaySlots[startIdx]?.currency ?? "PHP",
    };
  }, [durationMinutes, mobileDaySlots, selectedStartTime]);

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
                "h:mm a",
              )}`
            : ""
        }`
      : "";

  const handleCourtRangeChange = React.useCallback(
    (range: { startTime: string; durationMinutes: number }) => {
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
      setSelectedDate(parseDayKeyToDate(nextDayKey, placeTimeZone));
      clearSelection(true);
      setMobileCalendarOpen(false);
    },
    [clearSelection, placeTimeZone, setSelectedDate],
  );

  const handleMobileDateSelect = React.useCallback(
    (date: Date) => {
      const nextDayKey = getZonedDayKey(date, placeTimeZone);
      setSelectedDate(parseDayKeyToDate(nextDayKey, placeTimeZone));
      clearSelection(true);
    },
    [clearSelection, placeTimeZone, setSelectedDate],
  );

  const handleMobileSportChange = React.useCallback(
    (sportId: string) => {
      setSelectedSportId(sportId);
      setSelectionMode("any");
      setSelectedCourtId(undefined);
      clearSelection(true);
    },
    [clearSelection, setSelectedCourtId, setSelectedSportId, setSelectionMode],
  );

  const handleMobileCourtChange = React.useCallback(
    (courtId: string | undefined) => {
      if (courtId) {
        setSelectionMode("court");
        setSelectedCourtId(courtId);
      } else {
        setSelectionMode("any");
        setSelectedCourtId(undefined);
      }
      clearSelection(true);
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
      hasSelection={hasSelection}
      selectionSummary={selectionSummary}
      selectionDateLabel={selectionDateLabel}
      selectionTimeLabel={selectionTimeLabel}
    />
  );
}
