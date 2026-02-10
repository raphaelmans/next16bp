"use client";

import { create } from "zustand";

type PlaceDetailUiState = {
  isClaimOpen: boolean;
  isRemovalOpen: boolean;
  calendarPopoverOpen: boolean;
  mobileCalendarOpen: boolean;
  mobileSheetExpanded: boolean;
  prefetchedMobileWeekKeys: Set<string>;
  setIsClaimOpen: (open: boolean) => void;
  setIsRemovalOpen: (open: boolean) => void;
  setCalendarPopoverOpen: (open: boolean) => void;
  setMobileCalendarOpen: (open: boolean) => void;
  setMobileSheetExpanded: (open: boolean) => void;
  resetTransientUi: () => void;
  hasPrefetchedMobileWeek: (key: string) => boolean;
  markPrefetchedMobileWeek: (key: string) => void;
  clearPrefetchedMobileWeek: (key: string) => void;
};

export const usePlaceDetailUiStore = create<PlaceDetailUiState>()(
  (set, get) => ({
    isClaimOpen: false,
    isRemovalOpen: false,
    calendarPopoverOpen: false,
    mobileCalendarOpen: false,
    mobileSheetExpanded: false,
    prefetchedMobileWeekKeys: new Set<string>(),
    setIsClaimOpen: (open) => set({ isClaimOpen: open }),
    setIsRemovalOpen: (open) => set({ isRemovalOpen: open }),
    setCalendarPopoverOpen: (open) => set({ calendarPopoverOpen: open }),
    setMobileCalendarOpen: (open) => set({ mobileCalendarOpen: open }),
    setMobileSheetExpanded: (open) => set({ mobileSheetExpanded: open }),
    resetTransientUi: () =>
      set({
        isClaimOpen: false,
        isRemovalOpen: false,
        calendarPopoverOpen: false,
        mobileCalendarOpen: false,
        mobileSheetExpanded: false,
        prefetchedMobileWeekKeys: new Set<string>(),
      }),
    hasPrefetchedMobileWeek: (key) => get().prefetchedMobileWeekKeys.has(key),
    markPrefetchedMobileWeek: (key) =>
      set((state) => {
        const next = new Set(state.prefetchedMobileWeekKeys);
        next.add(key);
        return { prefetchedMobileWeekKeys: next };
      }),
    clearPrefetchedMobileWeek: (key) =>
      set((state) => {
        const next = new Set(state.prefetchedMobileWeekKeys);
        next.delete(key);
        return { prefetchedMobileWeekKeys: next };
      }),
  }),
);
