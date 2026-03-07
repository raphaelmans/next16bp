"use client";

import { addDays } from "date-fns";
import * as React from "react";
import {
  normalizeAvailabilityCourtRangeInput,
  normalizeAvailabilityPlaceSportRangeInput,
} from "@/common/query-keys";
import { getZonedDayKey } from "@/common/time-zone";
import {
  getWeekDayKeys,
  parseDayKeyToDate,
} from "@/features/discovery/helpers";
import { getWeekGridQueryWindow } from "@/features/discovery/place-detail/helpers/week-grid-query-window";
import type { RouterInputs } from "@/trpc/types";

type DiscoveryPrefetchUtils = {
  availability: {
    getForPlaceSportRange: {
      getData: (
        input: RouterInputs["availability"]["getForPlaceSportRange"],
      ) => unknown;
      fetch: (
        input: RouterInputs["availability"]["getForPlaceSportRange"],
      ) => Promise<unknown>;
    };
    getForCourtRange: {
      getData: (
        input: RouterInputs["availability"]["getForCourtRange"],
      ) => unknown;
      fetch: (
        input: RouterInputs["availability"]["getForCourtRange"],
      ) => Promise<unknown>;
    };
  };
};

type UseNextWeekPrefetchOptions = {
  showBooking: boolean;
  isActiveSurface: boolean;
  placeId?: string;
  placeTimeZone: string;
  selectionMode: "any" | "court";
  selectedSportId?: string;
  selectedCourtId?: string;
  selectedStartTime?: string;
  currentWeekStartDayKey: string;
  durationMinutes: number;
  todayRangeStart: Date;
  maxBookingDate: Date;
  hasPrefetchedWeek: (key: string) => boolean;
  markPrefetchedWeek: (key: string) => void;
  clearPrefetchedWeek: (key: string) => void;
  utils: DiscoveryPrefetchUtils;
};

export function useModNextWeekPrefetch({
  showBooking,
  isActiveSurface,
  placeId,
  placeTimeZone,
  selectionMode,
  selectedSportId,
  selectedCourtId,
  selectedStartTime,
  currentWeekStartDayKey,
  durationMinutes,
  todayRangeStart,
  maxBookingDate,
  hasPrefetchedWeek,
  markPrefetchedWeek,
  clearPrefetchedWeek,
  utils,
}: UseNextWeekPrefetchOptions) {
  React.useEffect(() => {
    if (!showBooking || !isActiveSurface || !placeId) return;
    if (selectionMode === "any" && !selectedSportId) return;
    if (selectionMode === "court" && !selectedCourtId) return;

    const currentWeekStart = parseDayKeyToDate(
      currentWeekStartDayKey,
      placeTimeZone,
    );
    const nextWeekStartDate = addDays(currentWeekStart, 7);
    const nextWeekStartDayKey = getZonedDayKey(
      nextWeekStartDate,
      placeTimeZone,
    );
    const nextWeekDayKeys = getWeekDayKeys(nextWeekStartDayKey, placeTimeZone);

    const queryWindow = getWeekGridQueryWindow({
      weekDayKeys: nextWeekDayKeys,
      selectedDayKey: nextWeekStartDayKey,
      selectedStartTime,
      timeZone: placeTimeZone,
      todayRangeStart,
      maxBookingDate,
    });

    const startMs = Date.parse(queryWindow.startDateIso);
    const endMs = Date.parse(queryWindow.endDateIso);
    if (
      !Number.isFinite(startMs) ||
      !Number.isFinite(endMs) ||
      startMs > endMs
    ) {
      return;
    }

    const cacheKey =
      selectionMode === "any"
        ? `next:any:${placeId}:${selectedSportId ?? ""}:${nextWeekStartDayKey}:${queryWindow.startDateIso}:${queryWindow.endDateIso}:${durationMinutes}`
        : `next:court:${selectedCourtId ?? ""}:${nextWeekStartDayKey}:${queryWindow.startDateIso}:${queryWindow.endDateIso}:${durationMinutes}`;

    if (hasPrefetchedWeek(cacheKey)) return;
    markPrefetchedWeek(cacheKey);

    const prefetch = async () => {
      try {
        if (selectionMode === "any") {
          const input = normalizeAvailabilityPlaceSportRangeInput({
            placeId,
            sportId: selectedSportId ?? "",
            startDate: queryWindow.startDateIso,
            endDate: queryWindow.endDateIso,
            durationMinutes,
            includeUnavailable: true,
            includeCourtOptions: false,
          });

          if (!utils.availability.getForPlaceSportRange.getData(input)) {
            await utils.availability.getForPlaceSportRange.fetch(input);
          }
          return;
        }

        const input = normalizeAvailabilityCourtRangeInput({
          courtId: selectedCourtId ?? "",
          startDate: queryWindow.startDateIso,
          endDate: queryWindow.endDateIso,
          durationMinutes,
          includeUnavailable: true,
        });

        if (!utils.availability.getForCourtRange.getData(input)) {
          await utils.availability.getForCourtRange.fetch(input);
        }
      } catch {
        clearPrefetchedWeek(cacheKey);
      }
    };

    void prefetch();
  }, [
    clearPrefetchedWeek,
    currentWeekStartDayKey,
    durationMinutes,
    hasPrefetchedWeek,
    isActiveSurface,
    markPrefetchedWeek,
    maxBookingDate,
    placeId,
    placeTimeZone,
    selectedCourtId,
    selectedSportId,
    selectedStartTime,
    selectionMode,
    showBooking,
    todayRangeStart,
    utils,
  ]);
}
