"use client";

import * as React from "react";
import {
  getZonedDayRangeForInstant,
  getZonedStartOfDayIso,
  toUtcISOString,
} from "@/common/time-zone";
import { parseDayKeyToDate } from "@/features/discovery/helpers";

type DiscoveryPrefetchUtils = {
  availability: {
    getForPlaceSportRange: {
      getData: (input: unknown) => unknown;
      fetch: (input: unknown) => Promise<unknown>;
    };
    getForCourt: {
      getData: (input: unknown) => unknown;
      fetch: (input: unknown) => Promise<unknown>;
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

    const prefetchWeek = async () => {
      const requests = weekDayKeys.map(async (dayKey) => {
        const date = parseDayKeyToDate(dayKey, placeTimeZone);
        const dayStartIso = getZonedStartOfDayIso(date, placeTimeZone);

        if (selectionMode === "any") {
          const input = {
            placeId,
            sportId: selectedSportId ?? "",
            startDate: dayStartIso,
            endDate: toUtcISOString(
              getZonedDayRangeForInstant(date, placeTimeZone).end,
            ),
            durationMinutes,
            includeUnavailable: true,
            includeCourtOptions: false,
          };

          if (utils.availability.getForPlaceSportRange.getData(input)) {
            return;
          }

          await utils.availability.getForPlaceSportRange.fetch(input);
          return;
        }

        const input = {
          courtId: selectedCourtId ?? "",
          date: dayStartIso,
          durationMinutes,
          includeUnavailable: true,
        };

        if (utils.availability.getForCourt.getData(input)) {
          return;
        }

        await utils.availability.getForCourt.fetch(input);
      });

      const results = await Promise.allSettled(requests);
      if (results.some((result) => result.status === "rejected")) {
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
    mobileSheetExpanded,
    placeId,
    placeTimeZone,
    selectedCourtId,
    selectedSportId,
    selectionMode,
    showBooking,
    utils,
    weekDayKeys,
    weekStartDayKey,
  ]);
}
