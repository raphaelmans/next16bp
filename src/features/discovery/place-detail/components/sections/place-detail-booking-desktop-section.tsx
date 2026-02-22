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
import type { TimeSlot } from "@/components/kudos";
import {
  buildSlotsByDayKey,
  getAvailabilityErrorInfo,
  getWeekDayKeys,
  getWeekStartDayKey,
  mapAvailabilityOptionsToSlots,
  parseDayKeyToDate,
} from "@/features/discovery/helpers";
import {
  type PlaceDetail,
  useQueryDiscoveryAvailabilityForCourt,
  useQueryDiscoveryAvailabilityForCourtRange,
  useQueryDiscoveryAvailabilityForPlaceSportRange,
} from "@/features/discovery/hooks";
import { PlaceDetail as PlaceDetailCompound } from "@/features/discovery/place-detail/components/place-detail";

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
  courtViewMode: "week" | "day";
  setCourtViewMode: (mode: "week" | "day") => void;
  anyViewMode: "week" | "day";
  setAnyViewMode: (mode: "week" | "day") => void;
  courtsForSport: { id: string; label: string }[];
  clearSelection: (resetDuration?: boolean) => void;
  today: Date;
  todayRangeStart: Date;
  maxBookingDate: Date;
  todayDayKey: string;
  maxDayKey: string;
  availabilitySectionRef: React.RefObject<HTMLDivElement | null>;
  onContinue: () => void;
  onSelectionSummaryChange: (summary: SelectionSummary | null) => void;
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
  courtViewMode,
  setCourtViewMode,
  anyViewMode,
  setAnyViewMode,
  courtsForSport,
  clearSelection,
  today,
  todayRangeStart,
  maxBookingDate,
  todayDayKey,
  maxDayKey,
  availabilitySectionRef,
  onContinue,
  onSelectionSummaryChange,
}: PlaceDetailBookingDesktopSectionProps) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [calendarPopoverOpen, setCalendarPopoverOpen] = React.useState(false);

  const selectedDayKey = React.useMemo(
    () => getZonedDayKey(selectedDate ?? today, placeTimeZone),
    [placeTimeZone, selectedDate, today],
  );

  const isCourtMode = selectionMode === "court";
  const isCourtWeekView = courtViewMode === "week";

  const weekStartDayKey = React.useMemo(
    () => getWeekStartDayKey(selectedDayKey, placeTimeZone),
    [placeTimeZone, selectedDayKey],
  );
  const weekDayKeys = React.useMemo(
    () => getWeekDayKeys(weekStartDayKey, placeTimeZone),
    [placeTimeZone, weekStartDayKey],
  );

  const weekRangeStartIso = React.useMemo(() => {
    const weekStart = parseDayKeyToDate(
      weekDayKeys[0] ?? selectedDayKey,
      placeTimeZone,
    );
    const clamped = weekStart < todayRangeStart ? todayRangeStart : weekStart;
    return toUtcISOString(clamped);
  }, [placeTimeZone, selectedDayKey, todayRangeStart, weekDayKeys]);

  const weekRangeEndIso = React.useMemo(() => {
    const weekEnd = getZonedDayRangeForInstant(
      parseDayKeyToDate(weekDayKeys[6] ?? selectedDayKey, placeTimeZone),
      placeTimeZone,
    ).end;
    const maxEnd = getZonedDayRangeForInstant(
      maxBookingDate,
      placeTimeZone,
    ).end;
    return toUtcISOString(weekEnd > maxEnd ? maxEnd : weekEnd);
  }, [maxBookingDate, placeTimeZone, selectedDayKey, weekDayKeys]);

  const courtDayDateIso = React.useMemo(() => {
    if (!isCourtMode || isCourtWeekView) return "";
    return getZonedStartOfDayIso(selectedDate ?? today, placeTimeZone);
  }, [isCourtMode, isCourtWeekView, placeTimeZone, selectedDate, today]);

  const anyWeekDayDateIso = React.useMemo(() => {
    if (selectionMode !== "any" || anyViewMode !== "day") return "";
    return getZonedStartOfDayIso(selectedDate ?? today, placeTimeZone);
  }, [anyViewMode, placeTimeZone, selectedDate, selectionMode, today]);

  const courtDayAvailabilityQuery = useQueryDiscoveryAvailabilityForCourt(
    {
      courtId: selectedCourtId ?? "",
      date: courtDayDateIso,
      durationMinutes: TIMELINE_SLOT_DURATION,
      includeUnavailable: true,
      selectedAddons,
    },
    isDesktop &&
      isCourtMode &&
      !isCourtWeekView &&
      !!selectedCourtId &&
      !!courtDayDateIso,
  );

  const courtWeekAvailabilityQuery = useQueryDiscoveryAvailabilityForCourtRange(
    {
      courtId: selectedCourtId ?? "",
      startDate: weekRangeStartIso,
      endDate: weekRangeEndIso,
      durationMinutes: TIMELINE_SLOT_DURATION,
      includeUnavailable: true,
      selectedAddons,
    },
    isDesktop && isCourtMode && isCourtWeekView && !!selectedCourtId,
  );

  const anyWeekAvailabilityQuery =
    useQueryDiscoveryAvailabilityForPlaceSportRange(
      {
        placeId: place.id,
        sportId: selectedSportId ?? "",
        startDate: weekRangeStartIso,
        endDate: weekRangeEndIso,
        durationMinutes: TIMELINE_SLOT_DURATION,
        includeUnavailable: true,
        includeCourtOptions: false,
        selectedAddons:
          selectionMode === "court" ? selectedAddons : undefined,
      },
      isDesktop &&
        selectionMode === "any" &&
        anyViewMode === "week" &&
        !!selectedSportId,
    );

  const anyDayAvailabilityQuery =
    useQueryDiscoveryAvailabilityForPlaceSportRange(
      {
        placeId: place.id,
        sportId: selectedSportId ?? "",
        startDate: anyWeekDayDateIso,
        endDate: anyWeekDayDateIso
          ? toUtcISOString(
              getZonedDayRangeForInstant(
                new Date(anyWeekDayDateIso),
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
      isDesktop &&
        selectionMode === "any" &&
        anyViewMode === "day" &&
        !!selectedSportId &&
        !!anyWeekDayDateIso,
    );

  const anyWeekSlotsByDay = React.useMemo(() => {
    if (selectionMode !== "any" || anyViewMode !== "week") {
      return new Map<string, TimeSlot[]>();
    }
    return buildSlotsByDayKey(
      anyWeekAvailabilityQuery.data?.options ?? [],
      placeTimeZone,
      TIMELINE_SLOT_DURATION,
    );
  }, [
    anyViewMode,
    anyWeekAvailabilityQuery.data,
    placeTimeZone,
    selectionMode,
  ]);

  const anyDaySlots = React.useMemo(() => {
    if (selectionMode !== "any" || anyViewMode !== "day") return [];
    const slots = mapAvailabilityOptionsToSlots(
      anyDayAvailabilityQuery.data?.options ?? [],
      TIMELINE_SLOT_DURATION,
    );
    return slots.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [anyDayAvailabilityQuery.data, anyViewMode, selectionMode]);

  const courtDaySlots = React.useMemo(() => {
    if (!isCourtMode || isCourtWeekView) return [];
    return mapAvailabilityOptionsToSlots(
      courtDayAvailabilityQuery.data?.options ?? [],
      TIMELINE_SLOT_DURATION,
    );
  }, [courtDayAvailabilityQuery.data, isCourtMode, isCourtWeekView]);

  const courtDayDiagnostics = React.useMemo(() => {
    if (!isCourtMode || isCourtWeekView) return null;
    return courtDayAvailabilityQuery.data?.diagnostics ?? null;
  }, [courtDayAvailabilityQuery.data, isCourtMode, isCourtWeekView]);

  const anyDayDiagnostics = React.useMemo(() => {
    if (selectionMode !== "any" || anyViewMode !== "day") return null;
    return anyDayAvailabilityQuery.data?.diagnostics ?? null;
  }, [anyDayAvailabilityQuery.data, anyViewMode, selectionMode]);

  const courtWeekSlotsByDay = React.useMemo(() => {
    if (!isCourtMode || !isCourtWeekView) return new Map<string, TimeSlot[]>();
    return buildSlotsByDayKey(
      courtWeekAvailabilityQuery.data?.options ?? [],
      placeTimeZone,
      TIMELINE_SLOT_DURATION,
    );
  }, [
    courtWeekAvailabilityQuery.data,
    isCourtMode,
    isCourtWeekView,
    placeTimeZone,
  ]);

  const activeAvailabilityError = React.useMemo(() => {
    if (selectionMode === "any") {
      const query =
        anyViewMode === "week"
          ? anyWeekAvailabilityQuery
          : anyDayAvailabilityQuery;
      return getAvailabilityErrorInfo(query.error, query.refetch);
    }
    const query = isCourtWeekView
      ? courtWeekAvailabilityQuery
      : courtDayAvailabilityQuery;
    return getAvailabilityErrorInfo(query.error, query.refetch);
  }, [
    anyDayAvailabilityQuery,
    anyViewMode,
    anyWeekAvailabilityQuery,
    courtDayAvailabilityQuery,
    courtWeekAvailabilityQuery,
    isCourtWeekView,
    selectionMode,
  ]);

  const isLoadingAvailability =
    selectionMode === "any"
      ? anyViewMode === "week"
        ? anyWeekAvailabilityQuery.isLoading
        : anyDayAvailabilityQuery.isLoading
      : isCourtWeekView
        ? courtWeekAvailabilityQuery.isLoading
        : courtDayAvailabilityQuery.isLoading;

  const selectedRange = React.useMemo(
    () =>
      selectedStartTime
        ? { startTime: selectedStartTime, durationMinutes }
        : undefined,
    [durationMinutes, selectedStartTime],
  );

  const selectionSummary = React.useMemo(() => {
    if (!selectedStartTime) return null;
    const dayKey = getZonedDayKey(selectedStartTime, placeTimeZone);
    const slotsForDay =
      selectionMode === "any"
        ? anyViewMode === "week"
          ? (anyWeekSlotsByDay.get(dayKey) ?? [])
          : anyDaySlots
        : isCourtWeekView
          ? (courtWeekSlotsByDay.get(dayKey) ?? [])
          : courtDaySlots;
    const startIdx = slotsForDay.findIndex(
      (slot) => slot.startTime === selectedStartTime,
    );
    if (startIdx === -1) return null;
    const slotCount = durationMinutes / TIMELINE_SLOT_DURATION;
    let totalCents = 0;
    let allHavePrice = true;
    let endTime = slotsForDay[startIdx]?.endTime ?? "";
    for (
      let i = startIdx;
      i < startIdx + slotCount && i < slotsForDay.length;
      i++
    ) {
      if (slotsForDay[i].priceCents !== undefined) {
        totalCents += slotsForDay[i].priceCents as number;
      } else {
        allHavePrice = false;
      }
      endTime = slotsForDay[i].endTime;
    }
    return {
      startTime: selectedStartTime,
      endTime,
      totalCents: allHavePrice ? totalCents : undefined,
      currency: slotsForDay[startIdx]?.currency ?? "PHP",
    };
  }, [
    anyDaySlots,
    anyViewMode,
    anyWeekSlotsByDay,
    courtDaySlots,
    courtWeekSlotsByDay,
    durationMinutes,
    isCourtWeekView,
    placeTimeZone,
    selectedStartTime,
    selectionMode,
  ]);

  React.useEffect(() => {
    if (!isDesktop) return;
    onSelectionSummaryChange(selectionSummary);
  }, [isDesktop, onSelectionSummaryChange, selectionSummary]);

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

  const handleCourtViewChange = React.useCallback(
    (value: string) => {
      if (!value) return;
      setCourtViewMode(value as "week" | "day");
      clearSelection(true);
    },
    [clearSelection, setCourtViewMode],
  );

  const handleGoToToday = React.useCallback(() => {
    setSelectedDate(today);
    clearSelection(true);
  }, [clearSelection, setSelectedDate, today]);

  const handleCalendarJump = React.useCallback(
    (date: Date | undefined) => {
      if (!date) return;
      const nextDayKey = getZonedDayKey(date, placeTimeZone);
      setSelectedDate(parseDayKeyToDate(nextDayKey, placeTimeZone));
      clearSelection(true);
      setCalendarPopoverOpen(false);
    },
    [clearSelection, placeTimeZone, setSelectedDate],
  );

  const handleDesktopSportChange = React.useCallback(
    (value: string) => {
      setSelectedSportId(value);
      setSelectionMode("any");
      setSelectedCourtId(undefined);
      setCourtViewMode("week");
      clearSelection();
    },
    [
      clearSelection,
      setCourtViewMode,
      setSelectedCourtId,
      setSelectedSportId,
      setSelectionMode,
    ],
  );

  const handleDesktopSelectionModeChange = React.useCallback(
    (value: "any" | "court") => {
      setSelectionMode(value);
      if (value === "court") {
        clearSelection(true);
        setCourtViewMode("week");
      } else {
        clearSelection();
      }
    },
    [clearSelection, setCourtViewMode, setSelectionMode],
  );

  const handleDesktopCourtSelect = React.useCallback(
    (courtId: string) => {
      if (selectedCourtId === courtId) return;
      setSelectedCourtId(courtId);
      clearSelection(true);
    },
    [clearSelection, selectedCourtId, setSelectedCourtId],
  );

  const handleAnyViewModeChange = React.useCallback(
    (mode: "week" | "day") => {
      setAnyViewMode(mode);
      clearSelection(true);
    },
    [clearSelection, setAnyViewMode],
  );

  const handleAnyWeekDayClick = React.useCallback(
    (dayKey: string) => {
      setSelectedDate(parseDayKeyToDate(dayKey, placeTimeZone));
      setAnyViewMode("day");
      clearSelection(true);
    },
    [clearSelection, placeTimeZone, setAnyViewMode, setSelectedDate],
  );

  const handleCourtWeekDayClick = React.useCallback(
    (dayKey: string) => {
      setSelectedDate(parseDayKeyToDate(dayKey, placeTimeZone));
      setCourtViewMode("day");
      clearSelection(true);
    },
    [clearSelection, placeTimeZone, setCourtViewMode, setSelectedDate],
  );

  const handleJumpToMaxDate = React.useCallback(() => {
    setSelectedDate(maxBookingDate);
    clearSelection(true);
  }, [clearSelection, maxBookingDate, setSelectedDate]);

  const isAnyWeekView = selectionMode === "any" && anyViewMode === "week";
  const weekHeaderLabel = React.useMemo(() => {
    if (!isCourtWeekView && !isAnyWeekView) return "";
    const start = parseDayKeyToDate(
      weekDayKeys[0] ?? selectedDayKey,
      placeTimeZone,
    );
    const end = parseDayKeyToDate(
      weekDayKeys[6] ?? selectedDayKey,
      placeTimeZone,
    );
    const startLabel = formatInTimeZone(start, placeTimeZone, "MMM d");
    const endLabel = formatInTimeZone(end, placeTimeZone, "MMM d, yyyy");
    return `${startLabel} - ${endLabel}`;
  }, [
    isAnyWeekView,
    isCourtWeekView,
    placeTimeZone,
    selectedDayKey,
    weekDayKeys,
  ]);

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
      anyViewMode={anyViewMode}
      onAnyViewModeChange={handleAnyViewModeChange}
      courtViewMode={courtViewMode}
      onCourtViewModeChange={handleCourtViewChange}
      calendarPopoverOpen={calendarPopoverOpen}
      setCalendarPopoverOpen={setCalendarPopoverOpen}
      weekHeaderLabel={weekHeaderLabel}
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
      onContinue={onContinue}
      onClearSelection={() => clearSelection(true)}
      todayDayKey={todayDayKey}
      maxDayKey={maxDayKey}
      anyDaySlots={anyDaySlots}
      courtDaySlots={courtDaySlots}
      anyDayDiagnostics={anyDayDiagnostics}
      courtDayDiagnostics={courtDayDiagnostics}
      contactDetail={place.contactDetail}
    />
  );
}
