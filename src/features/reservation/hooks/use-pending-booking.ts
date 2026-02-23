"use client";

import { useQuery } from "@tanstack/react-query";

const STORAGE_KEY = "kudos:pending-booking";
const TTL_MS = 30 * 60 * 1000; // 30 minutes

interface PendingBooking {
  courtId: string;
  slotId: string;
  startTime: string;
  expires: number;
}

export function savePendingBooking(data: Omit<PendingBooking, "expires">) {
  if (typeof window === "undefined") return;
  const entry: PendingBooking = { ...data, expires: Date.now() + TTL_MS };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
}

export function clearPendingBooking() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

function readPendingBooking(courtId: string): PendingBooking | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const entry = JSON.parse(raw) as PendingBooking;
    if (entry.expires < Date.now()) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    if (entry.courtId !== courtId) return null;
    return entry;
  } catch {
    return null;
  }
}

export function usePendingBooking(courtId: string) {
  return useQuery({
    queryKey: ["pending-booking", courtId],
    queryFn: () => null,
    initialData: () => readPendingBooking(courtId),
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 0,
  });
}
