"use client";

import { useCallback, useEffect, useMemo } from "react";
import { getZonedDayKey } from "@/common/time-zone";
import { parseDayKeyToDate } from "@/features/discovery/helpers";
import type { PlaceDetail } from "@/features/discovery/hooks";
import { usePlaceDetailUrlState } from "../state/place-detail-url-state";

type UsePlaceDetailAvailabilitySelectionOptions = {
  place?: PlaceDetail;
  isBookable: boolean;
  defaultDurationMinutes?: number;
};

export function useModPlaceDetailAvailabilitySelection({
  place,
  isBookable,
  defaultDurationMinutes = 60,
}: UsePlaceDetailAvailabilitySelectionOptions) {
  const [urlState, setUrlState] = usePlaceDetailUrlState();
  const placeTimeZone = place?.timeZone ?? "Asia/Manila";

  const selectedDate = useMemo(() => {
    if (!urlState.date) return undefined;
    return parseDayKeyToDate(urlState.date, placeTimeZone);
  }, [placeTimeZone, urlState.date]);

  const durationMinutes =
    typeof urlState.duration === "number" &&
    urlState.duration > 0 &&
    urlState.duration % 60 === 0
      ? urlState.duration
      : defaultDurationMinutes;

  const selectedSportId = urlState.sportId ?? undefined;
  const selectionMode = urlState.mode ?? "court";
  const selectedCourtId = urlState.courtId ?? undefined;
  const selectedAddonIds = urlState.addonIds ?? [];
  const selectedStartTime = urlState.startTime ?? undefined;
  const courtViewMode = urlState.courtView ?? "week";
  const anyViewMode = urlState.anyView ?? "week";

  const courtsForSport = useMemo(() => {
    if (!place || !selectedSportId) return [];
    return place.courts
      .filter((court) => court.sportId === selectedSportId)
      .filter((court) => court.isActive);
  }, [place, selectedSportId]);

  const setSelectedDate = useCallback(
    (date: Date | undefined) => {
      void setUrlState({
        date: date ? getZonedDayKey(date, placeTimeZone) : null,
      });
    },
    [placeTimeZone, setUrlState],
  );

  const setDurationMinutes = useCallback(
    (minutes: number) => {
      void setUrlState({ duration: minutes });
    },
    [setUrlState],
  );

  const setSelectedSportId = useCallback(
    (sportId: string | undefined) => {
      void setUrlState({ sportId: sportId ?? null });
    },
    [setUrlState],
  );

  const setSelectionMode = useCallback(
    (mode: "any" | "court") => {
      void setUrlState({ mode });
    },
    [setUrlState],
  );

  const setSelectedCourtId = useCallback(
    (courtId: string | undefined) => {
      void setUrlState({ courtId: courtId ?? null });
    },
    [setUrlState],
  );

  const setSelectedStartTime = useCallback(
    (startTime: string | undefined) => {
      void setUrlState({ startTime: startTime ?? null });
    },
    [setUrlState],
  );

  const setSelectedAddonIds = useCallback(
    (addonIds: string[]) => {
      void setUrlState({ addonIds: addonIds.length > 0 ? addonIds : null });
    },
    [setUrlState],
  );

  const setCourtViewMode = useCallback(
    (mode: "week" | "day") => {
      void setUrlState({ courtView: mode });
    },
    [setUrlState],
  );

  const setAnyViewMode = useCallback(
    (mode: "week" | "day") => {
      void setUrlState({ anyView: mode });
    },
    [setUrlState],
  );

  const clearSelection = useCallback(
    (resetDuration = false) => {
      void setUrlState({
        startTime: null,
        duration: resetDuration ? defaultDurationMinutes : durationMinutes,
      });
    },
    [defaultDurationMinutes, durationMinutes, setUrlState],
  );

  useEffect(() => {
    if (!place || !isBookable) return;
    if (!selectedSportId) {
      void setUrlState({ sportId: place.sports[0]?.id ?? null });
    }
  }, [isBookable, place, selectedSportId, setUrlState]);

  useEffect(() => {
    if (!isBookable) return;
    if (selectionMode !== "court") return;
    if (selectedCourtId) return;
    if (courtsForSport[0]?.id) {
      void setUrlState({ courtId: courtsForSport[0].id });
    }
  }, [courtsForSport, isBookable, selectedCourtId, selectionMode, setUrlState]);

  return {
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
    selectedAddonIds,
    setSelectedAddonIds,
    selectedStartTime,
    setSelectedStartTime,
    courtViewMode,
    setCourtViewMode,
    anyViewMode,
    setAnyViewMode,
    courtsForSport,
    clearSelection,
  };
}
