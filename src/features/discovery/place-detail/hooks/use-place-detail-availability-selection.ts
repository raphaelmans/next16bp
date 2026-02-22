"use client";

import { useCallback, useEffect, useMemo } from "react";
import { getZonedDayKey } from "@/common/time-zone";
import type { SelectedAddon } from "@/features/court-addons/schemas";
import { parseDayKeyToDate } from "@/features/discovery/helpers";
import type { PlaceDetail } from "@/features/discovery/hooks";
import { usePlaceDetailUrlState } from "../state/place-detail-url-state";

function encodeAddonToUrlItem(addon: SelectedAddon): string {
  return addon.quantity === 1
    ? addon.addonId
    : `${addon.addonId}:${addon.quantity}`;
}

function decodeAddonFromUrlItem(item: string): SelectedAddon {
  const colonIdx = item.lastIndexOf(":");
  if (colonIdx === -1) return { addonId: item, quantity: 1 };
  const qty = Number.parseInt(item.slice(colonIdx + 1), 10);
  return {
    addonId: item.slice(0, colonIdx),
    quantity: Number.isFinite(qty) && qty >= 1 ? qty : 1,
  };
}

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
  const selectedAddons: SelectedAddon[] = useMemo(
    () => (urlState.addonIds ?? []).map(decodeAddonFromUrlItem),
    [urlState.addonIds],
  );
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

  const setSelectedAddons = useCallback(
    (addons: SelectedAddon[]) => {
      const encoded = addons.map(encodeAddonToUrlItem);
      void setUrlState({ addonIds: encoded.length > 0 ? encoded : null });
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
    selectedAddons,
    setSelectedAddons,
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
