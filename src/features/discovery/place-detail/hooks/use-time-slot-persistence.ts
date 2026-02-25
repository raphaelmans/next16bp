"use client";

import { useEffect, useRef } from "react";
import type { TimeSlotContext } from "../machines/time-slot-machine.types";

const STORAGE_KEY = "booking-selection";
const DEBOUNCE_MS = 300;

type PersistedBookingSelection = {
  placeId: string | null;
  date: string | null;
  duration: number | null;
  sportId: string | null;
  mode: "any" | "court" | null;
  courtId: string | null;
  startTime: string | null;
};

export function readPersistedSelection(): PersistedBookingSelection | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state ?? null;
  } catch {
    return null;
  }
}

function writePersistedSelection(
  placeId: string,
  date: string | null,
  duration: number,
  sportId: string | null,
  mode: "any" | "court",
  courtId: string | null,
  startTime: string | null,
): void {
  if (typeof window === "undefined") return;
  try {
    const state: PersistedBookingSelection = {
      placeId,
      date,
      duration,
      sportId,
      mode,
      courtId,
      startTime,
    };
    // Match the Zustand persist format: { state: {...}, version: 0 }
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state, version: 0 }));
  } catch {
    // Ignore write failures (quota, etc.)
  }
}

/**
 * Syncs XState time-slot machine context to localStorage (debounced).
 * Backward-compatible with the previous Zustand persist format.
 */
export function useTimeSlotPersistence(context: TimeSlotContext): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { placeId, date, durationMinutes, sportId, mode, courtId, startTime } =
    context;

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      writePersistedSelection(
        placeId,
        date,
        durationMinutes,
        sportId,
        mode,
        courtId,
        startTime,
      );
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [placeId, date, durationMinutes, sportId, mode, courtId, startTime]);
}
