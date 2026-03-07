"use client";

import * as React from "react";
import {
  normalizeAvailabilityCourtRangeInput,
  normalizeAvailabilityPlaceSportRangeInput,
} from "@/common/query-keys";
import { getZonedDayRangeForInstant, toUtcISOString } from "@/common/time-zone";
import { parseDayKeyToDate } from "@/features/discovery/helpers";
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

type UseMobileWeekPrefetchOptions = {
  showBooking: boolean;
  isDesktop: boolean;
  mobileSheetExpanded: boolean;
  placeId?: string;
  placeTimeZone: string;
  selectionMode: "any" | "court";
  selectedSportId?: string;
  selectedCourtId?: string;
  weekStartDayKey: string;
  weekDayKeys: string[];
  durationMinutes: number;
  todayRangeStart: Date;
  maxBookingDate: Date;
  hasPrefetchedMobileWeek: (key: string) => boolean;
  markPrefetchedMobileWeek: (key: string) => void;
  clearPrefetchedMobileWeek: (key: string) => void;
  utils: DiscoveryPrefetchUtils;
};

export function useModMobileWeekPrefetch({
  showBooking,
  isDesktop,
  mobileSheetExpanded,
  placeId,
  placeTimeZone,
  selectionMode,
  selectedSportId,
  selectedCourtId,
  weekStartDayKey,
  weekDayKeys,
  durationMinutes,
  todayRangeStart,
  maxBookingDate,
  hasPrefetchedMobileWeek,
  markPrefetchedMobileWeek,
  clearPrefetchedMobileWeek,
  utils,
}: UseMobileWeekPrefetchOptions) {
  React.useEffect(() => {
    if (!showBooking || isDesktop || !mobileSheetExpanded) {
      return;
    }

    if (!placeId) {
      return;
    }

    if (selectionMode === "any" && !selectedSportId) {
      return;
    }

    if (selectionMode === "court" && !selectedCourtId) {
      return;
    }

    const weekCacheKey =
      selectionMode === "any"
        ? `any:${placeId}:${selectedSportId ?? ""}:${weekStartDayKey}`
        : `court:${selectedCourtId ?? ""}:${weekStartDayKey}`;

    if (hasPrefetchedMobileWeek(weekCacheKey)) {
      return;
    }

    markPrefetchedMobileWeek(weekCacheKey);

    const firstDayKey = weekDayKeys[0];
    const lastDayKey = weekDayKeys[weekDayKeys.length - 1];
    if (!firstDayKey || !lastDayKey) {
      return;
    }

    const weekStart = parseDayKeyToDate(firstDayKey, placeTimeZone);
    const clampedStart =
      weekStart < todayRangeStart ? todayRangeStart : weekStart;
    const startDate = toUtcISOString(clampedStart);

    const weekEnd = getZonedDayRangeForInstant(
      parseDayKeyToDate(lastDayKey, placeTimeZone),
      placeTimeZone,
    ).end;
    const maxEnd = getZonedDayRangeForInstant(
      maxBookingDate,
      placeTimeZone,
    ).end;
    const endDate = toUtcISOString(weekEnd > maxEnd ? maxEnd : weekEnd);

    const prefetchWeek = async () => {
      try {
        if (selectionMode === "any") {
          const input = normalizeAvailabilityPlaceSportRangeInput({
            placeId,
            sportId: selectedSportId ?? "",
            startDate,
            endDate,
            durationMinutes,
            includeUnavailable: true,
            includeCourtOptions: false,
          });

          if (!utils.availability.getForPlaceSportRange.getData(input)) {
            await utils.availability.getForPlaceSportRange.fetch(input);
          }
        } else {
          const input = normalizeAvailabilityCourtRangeInput({
            courtId: selectedCourtId ?? "",
            startDate,
            endDate,
            durationMinutes,
            includeUnavailable: true,
          });

          if (!utils.availability.getForCourtRange.getData(input)) {
            await utils.availability.getForCourtRange.fetch(input);
          }
        }
      } catch {
        clearPrefetchedMobileWeek(weekCacheKey);
      }
    };

    void prefetchWeek();
  }, [
    clearPrefetchedMobileWeek,
    durationMinutes,
    hasPrefetchedMobileWeek,
    isDesktop,
    markPrefetchedMobileWeek,
    maxBookingDate,
    mobileSheetExpanded,
    placeId,
    placeTimeZone,
    selectedCourtId,
    selectedSportId,
    selectionMode,
    showBooking,
    todayRangeStart,
    utils,
    weekDayKeys,
    weekStartDayKey,
  ]);
}
