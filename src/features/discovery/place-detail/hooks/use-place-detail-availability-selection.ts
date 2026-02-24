"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { getZonedDayKey } from "@/common/time-zone";
import type { SelectedAddon } from "@/features/court-addons/schemas";
import { parseDayKeyToDate } from "@/features/discovery/helpers";
import type { PlaceDetail } from "@/features/discovery/hooks";
import { useBookingSelectionStore } from "../stores/booking-selection-store";

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
  const store = useBookingSelectionStore;
  const placeTimeZone = place?.timeZone ?? "Asia/Manila";

  // --- Rehydrate persisted store once on mount ---
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    store.persist.rehydrate();
  }, [store]);

  // --- Reset store if persisted placeId doesn't match current place ---
  useEffect(() => {
    if (!place) return;
    const persisted = store.getState();
    if (persisted.placeId && persisted.placeId !== place.id) {
      store.getState().reset();
    }
    if (store.getState().placeId !== place.id) {
      store.getState().setPlaceId(place.id);
    }
  }, [place, store]);

  // --- Read state via selectors ---
  const storeDate = useBookingSelectionStore((s) => s.date);
  const storeDuration = useBookingSelectionStore((s) => s.duration);
  const storeSportId = useBookingSelectionStore((s) => s.sportId);
  const storeMode = useBookingSelectionStore((s) => s.mode);
  const storeCourtId = useBookingSelectionStore((s) => s.courtId);
  const storeAddonIds = useBookingSelectionStore((s) => s.addonIds);
  const storeStartTime = useBookingSelectionStore((s) => s.startTime);
  const storeCourtView = useBookingSelectionStore((s) => s.courtView);
  const storeAnyView = useBookingSelectionStore((s) => s.anyView);

  // --- Derived values (same API as before) ---
  const selectedDate = useMemo(() => {
    if (!storeDate) return undefined;
    return parseDayKeyToDate(storeDate, placeTimeZone);
  }, [placeTimeZone, storeDate]);

  const durationMinutes =
    typeof storeDuration === "number" &&
    storeDuration > 0 &&
    storeDuration % 60 === 0
      ? storeDuration
      : defaultDurationMinutes;

  const selectedSportId = storeSportId ?? undefined;
  const selectionMode = storeMode ?? "court";
  const selectedCourtId = storeCourtId ?? undefined;
  const selectedAddons: SelectedAddon[] = useMemo(
    () => (storeAddonIds ?? []).map(decodeAddonFromUrlItem),
    [storeAddonIds],
  );
  const selectedStartTime = storeStartTime ?? undefined;
  const courtViewMode = storeCourtView ?? "week";
  const anyViewMode = storeAnyView ?? "week";

  const courtsForSport = useMemo(() => {
    if (!place || !selectedSportId) return [];
    return place.courts
      .filter((court) => court.sportId === selectedSportId)
      .filter((court) => court.isActive);
  }, [place, selectedSportId]);

  // --- Setters (same callback API as before) ---
  const setSelectedDate = useCallback(
    (date: Date | undefined) => {
      store
        .getState()
        .setDate(date ? getZonedDayKey(date, placeTimeZone) : null);
    },
    [placeTimeZone, store],
  );

  const setDurationMinutes = useCallback(
    (minutes: number) => {
      store.getState().setDuration(minutes);
    },
    [store],
  );

  const setSelectedSportId = useCallback(
    (sportId: string | undefined) => {
      store.getState().setSportId(sportId ?? null);
    },
    [store],
  );

  const setSelectionMode = useCallback(
    (mode: "any" | "court") => {
      store.getState().setMode(mode);
    },
    [store],
  );

  const setSelectedCourtId = useCallback(
    (courtId: string | undefined) => {
      store.getState().setCourtId(courtId ?? null);
    },
    [store],
  );

  const setSelectedStartTime = useCallback(
    (startTime: string | undefined) => {
      store.getState().setStartTime(startTime ?? null);
    },
    [store],
  );

  const setSelectedAddons = useCallback(
    (addons: SelectedAddon[]) => {
      const encoded = addons.map(encodeAddonToUrlItem);
      store.getState().setAddonIds(encoded.length > 0 ? encoded : []);
    },
    [store],
  );

  const setCourtViewMode = useCallback(
    (mode: "week" | "day") => {
      store.getState().setCourtView(mode);
    },
    [store],
  );

  const setAnyViewMode = useCallback(
    (mode: "week" | "day") => {
      store.getState().setAnyView(mode);
    },
    [store],
  );

  const clearSelection = useCallback(
    (resetDuration = false) => {
      store.getState().clearSelection(resetDuration, defaultDurationMinutes);
    },
    [defaultDurationMinutes, store],
  );

  // --- Auto-select first sport ---
  useEffect(() => {
    if (!place || !isBookable) return;
    if (!selectedSportId) {
      store.getState().setSportId(place.sports[0]?.id ?? null);
    }
  }, [isBookable, place, selectedSportId, store]);

  // --- Auto-select first court ---
  useEffect(() => {
    if (!isBookable) return;
    if (selectionMode !== "court") return;
    if (selectedCourtId) return;
    if (courtsForSport[0]?.id) {
      store.getState().setCourtId(courtsForSport[0].id);
    }
  }, [courtsForSport, isBookable, selectedCourtId, selectionMode, store]);

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
