"use client";

import { useMachine } from "@xstate/react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { getZonedDayKey } from "@/common/time-zone";
import type { SelectedAddon } from "@/features/court-addons/schemas";
import { parseDayKeyToDate } from "@/features/discovery/helpers";
import type { PlaceDetail } from "@/features/discovery/hooks";
import { bookingCartMachine } from "../machines/booking-cart-machine";
import { buildMemoryKey, timeSlotMachine } from "../machines/time-slot-machine";
import type {
  AvailableCourt,
  AvailableSport,
  SelectionMode,
  ViewMode,
} from "../machines/time-slot-machine.types";
import {
  readPersistedSelection,
  useTimeSlotPersistence,
} from "./use-time-slot-persistence";

const DEFAULT_DURATION_MINUTES = 60;

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

type UseBookingMachinesOptions = {
  place?: PlaceDetail;
  isBookable: boolean;
  defaultDurationMinutes?: number;
};

export function useBookingMachines({
  place,
  isBookable,
  defaultDurationMinutes = DEFAULT_DURATION_MINUTES,
}: UseBookingMachinesOptions) {
  const placeTimeZone = place?.timeZone ?? "Asia/Manila";

  // Build available sports & courts from place data
  const availableSports: AvailableSport[] = useMemo(
    () => (place?.sports ?? []).map((s) => ({ id: s.id, name: s.name })),
    [place?.sports],
  );

  const availableCourts: AvailableCourt[] = useMemo(
    () =>
      (place?.courts ?? []).map((c) => ({
        id: c.id,
        label: c.label,
        sportId: c.sportId,
        isActive: c.isActive,
      })),
    [place?.courts],
  );

  // Read persisted state (once per mount)
  const persistedRef = useRef(readPersistedSelection());

  // --- Time Slot Machine ---
  const [timeSlotState, sendTimeSlot, timeSlotActorRef] = useMachine(
    timeSlotMachine,
    {
      input: {
        placeId: place?.id ?? "",
        placeTimeZone,
        defaultDurationMinutes,
        availableSports,
        availableCourts,
        persisted: persistedRef.current
          ? {
              placeId: persistedRef.current.placeId,
              date: persistedRef.current.date,
              duration: persistedRef.current.duration,
              sportId: persistedRef.current.sportId,
              mode: persistedRef.current.mode as SelectionMode | null,
              courtId: persistedRef.current.courtId,
              startTime: persistedRef.current.startTime,
            }
          : undefined,
      },
    },
  );

  // --- Booking Cart Machine ---
  const [cartState, sendCart, cartActorRef] = useMachine(bookingCartMachine, {
    input: {
      placeTimeZone,
    },
  });

  // --- Persistence ---
  useTimeSlotPersistence(timeSlotState.context);

  // --- Sync available courts/sports when place changes ---
  const prevPlaceIdRef = useRef(place?.id);
  useEffect(() => {
    if (!place) return;
    if (place.id !== prevPlaceIdRef.current) {
      prevPlaceIdRef.current = place.id;
      // Place changed — the machine was already created with correct initial state
      // but we need to sync court/sport lists
    }
    sendTimeSlot({ type: "SYNC_AVAILABLE_COURTS", availableCourts });
    sendTimeSlot({ type: "SYNC_AVAILABLE_SPORTS", availableSports });
  }, [availableCourts, availableSports, place, sendTimeSlot]);

  // --- Context selectors ---
  const ctx = timeSlotState.context;
  const cartCtx = cartState.context;

  // --- Derived values (match old API surface) ---
  const selectedDate = useMemo(() => {
    if (!ctx.date) return undefined;
    return parseDayKeyToDate(ctx.date, placeTimeZone);
  }, [ctx.date, placeTimeZone]);

  const durationMinutes =
    typeof ctx.durationMinutes === "number" &&
    ctx.durationMinutes > 0 &&
    ctx.durationMinutes % 60 === 0
      ? ctx.durationMinutes
      : defaultDurationMinutes;

  const selectedSportId = ctx.sportId ?? undefined;
  const selectionMode: SelectionMode = ctx.mode;
  const selectedCourtId = ctx.courtId ?? undefined;
  const selectedStartTime = ctx.startTime ?? undefined;
  // Derive court/any view from unified viewMode
  const courtViewMode: ViewMode = ctx.mode === "court" ? ctx.viewMode : "week";
  const anyViewMode: ViewMode = ctx.mode === "any" ? ctx.viewMode : "week";

  const selectedAddons: SelectedAddon[] = useMemo(
    () => (ctx.addonIds ?? []).map(decodeAddonFromUrlItem),
    [ctx.addonIds],
  );

  const courtsForSport = useMemo(() => {
    if (!selectedSportId) return [];
    return ctx.availableCourts
      .filter((c) => c.sportId === selectedSportId)
      .filter((c) => c.isActive);
  }, [ctx.availableCourts, selectedSportId]);

  // --- Auto-select first sport ---
  useEffect(() => {
    if (!place || !isBookable) return;
    if (!selectedSportId && place.sports[0]?.id) {
      sendTimeSlot({ type: "SELECT_SPORT", sportId: place.sports[0].id });
    }
  }, [isBookable, place, selectedSportId, sendTimeSlot]);

  // --- Auto-select first court in court mode ---
  useEffect(() => {
    if (!isBookable) return;
    if (selectionMode !== "court") return;
    if (selectedCourtId) return;
    if (courtsForSport[0]?.id) {
      sendTimeSlot({ type: "SELECT_COURT", courtId: courtsForSport[0].id });
    }
  }, [
    courtsForSport,
    isBookable,
    selectedCourtId,
    selectionMode,
    sendTimeSlot,
  ]);

  // --- Setters (match old callback API) ---
  const setSelectedDate = useCallback(
    (date: Date | undefined, options?: { preserveSelection?: boolean }) => {
      if (!date) return;
      sendTimeSlot({
        type: "SELECT_DATE",
        date: getZonedDayKey(date, placeTimeZone),
        preserveSelection: options?.preserveSelection,
      });
    },
    [placeTimeZone, sendTimeSlot],
  );

  const setDurationMinutes = useCallback(
    (minutes: number) => {
      sendTimeSlot({ type: "SET_DURATION", durationMinutes: minutes });
    },
    [sendTimeSlot],
  );

  const setSelectedSportId = useCallback(
    (sportId: string | undefined) => {
      if (!sportId) return;
      sendTimeSlot({ type: "SELECT_SPORT", sportId });
    },
    [sendTimeSlot],
  );

  const setSelectionMode = useCallback(
    (mode: "any" | "court") => {
      sendTimeSlot({
        type: mode === "any" ? "SET_MODE_ANY" : "SET_MODE_COURT",
      });
    },
    [sendTimeSlot],
  );

  const setSelectedCourtId = useCallback(
    (courtId: string | undefined) => {
      if (courtId) {
        sendTimeSlot({ type: "SELECT_COURT", courtId });
      } else {
        sendTimeSlot({ type: "CLEAR_COURT" });
      }
    },
    [sendTimeSlot],
  );

  const setSelectedStartTime = useCallback(
    (startTime: string | undefined) => {
      if (!startTime) {
        sendTimeSlot({ type: "CLEAR_SELECTION" });
        return;
      }
      // Build court memory key for the commit
      const memoryKey =
        ctx.courtId && ctx.sportId && ctx.date
          ? buildMemoryKey(ctx.placeId, ctx.sportId, ctx.date, ctx.courtId)
          : null;
      sendTimeSlot({
        type: "COMMIT_RANGE",
        startTime,
        durationMinutes: ctx.durationMinutes,
        courtMemoryKey: memoryKey,
      });
    },
    [
      sendTimeSlot,
      ctx.courtId,
      ctx.sportId,
      ctx.date,
      ctx.placeId,
      ctx.durationMinutes,
    ],
  );

  const setSelectedAddons = useCallback(
    (addons: SelectedAddon[]) => {
      const encoded = addons.map(encodeAddonToUrlItem);
      sendTimeSlot({
        type: "SET_ADDONS",
        addonIds: encoded.length > 0 ? encoded : [],
      });
    },
    [sendTimeSlot],
  );

  const setCourtViewMode = useCallback(
    (mode: "week" | "day") => {
      sendTimeSlot({
        type: mode === "week" ? "SET_VIEW_WEEK" : "SET_VIEW_DAY",
      });
    },
    [sendTimeSlot],
  );

  const setAnyViewMode = useCallback(
    (mode: "week" | "day") => {
      sendTimeSlot({
        type: mode === "week" ? "SET_VIEW_WEEK" : "SET_VIEW_DAY",
      });
    },
    [sendTimeSlot],
  );

  const clearSelection = useCallback(
    (resetDuration = false) => {
      sendTimeSlot({ type: "CLEAR_SELECTION", resetDuration });
    },
    [sendTimeSlot],
  );

  // --- Cart operations ---
  const cartItems = cartCtx.items;

  const addCartItem = useCallback(
    (item: {
      key: string;
      courtId: string;
      courtLabel: string;
      sportId: string;
      startTime: string;
      durationMinutes: number;
      estimatedPriceCents: number | null;
      currency: string;
    }) => {
      sendCart({ type: "ADD_ITEM", item });
    },
    [sendCart],
  );

  const removeCartItem = useCallback(
    (key: string) => {
      sendCart({ type: "REMOVE_ITEM", key });
    },
    [sendCart],
  );

  const clearCart = useCallback(() => {
    sendCart({ type: "CLEAR_CART" });
  }, [sendCart]);

  const clearCartForSportChange = useCallback(
    (sportId: string) => {
      sendCart({ type: "SPORT_CHANGED", sportId });
    },
    [sendCart],
  );

  // --- Bridge: save/restore snapshot ---
  const saveSnapshot = useCallback(() => {
    sendTimeSlot({ type: "SAVE_SNAPSHOT" });
  }, [sendTimeSlot]);

  const restoreSnapshot = useCallback(() => {
    sendTimeSlot({ type: "RESTORE_SNAPSHOT" });
  }, [sendTimeSlot]);

  // --- Bridge: notify time slot machine when item added to cart ---
  const notifyCartItemAdded = useCallback(
    (courtMemoryKey: string | null) => {
      sendTimeSlot({ type: "CART_ITEM_ADDED", courtMemoryKey });
    },
    [sendTimeSlot],
  );

  const notifySlotExpired = useCallback(() => {
    sendTimeSlot({ type: "SLOT_EXPIRED" });
  }, [sendTimeSlot]);

  return {
    // Time slot state
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

    // Cart state
    cartItems,
    addCartItem,
    removeCartItem,
    clearCart,
    clearCartForSportChange,

    // Bridge operations
    saveSnapshot,
    restoreSnapshot,
    notifyCartItemAdded,
    notifySlotExpired,

    // Actor refs (for advanced usage)
    timeSlotActorRef,
    cartActorRef,

    // Direct senders (for components that need them)
    sendTimeSlot,
    sendCart,

    // Raw context (for components that need direct access)
    timeSlotContext: ctx,
    cartContext: cartCtx,
  };
}
