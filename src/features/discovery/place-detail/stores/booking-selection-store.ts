"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type SelectionMode = "any" | "court";
export type ViewMode = "week" | "day";

type LastAddedSelection = {
  startTime: string;
  durationMinutes: number;
};

type BookingSelectionState = {
  placeId: string | null;
  date: string | null;
  duration: number | null;
  sportId: string | null;
  mode: SelectionMode | null;
  courtId: string | null;
  addonIds: string[];
  startTime: string | null;
  anyView: ViewMode | null;
  courtView: ViewMode | null;
  lastAddedSelection: LastAddedSelection | null;

  setPlaceId: (placeId: string | null) => void;
  setDate: (date: string | null) => void;
  setDuration: (duration: number | null) => void;
  setSportId: (sportId: string | null) => void;
  setMode: (mode: SelectionMode | null) => void;
  setCourtId: (courtId: string | null) => void;
  setAddonIds: (addonIds: string[]) => void;
  setStartTime: (startTime: string | null) => void;
  setAnyView: (view: ViewMode | null) => void;
  setCourtView: (view: ViewMode | null) => void;
  clearSelection: (resetDuration?: boolean, defaultDuration?: number) => void;
  saveLastAdded: () => void;
  restoreLastAdded: () => void;
  reset: () => void;
};

const initialState = {
  placeId: null as string | null,
  date: null as string | null,
  duration: null as number | null,
  sportId: null as string | null,
  mode: null as SelectionMode | null,
  courtId: null as string | null,
  addonIds: [] as string[],
  startTime: null as string | null,
  anyView: null as ViewMode | null,
  courtView: null as ViewMode | null,
  lastAddedSelection: null as LastAddedSelection | null,
};

export const useBookingSelectionStore = create<BookingSelectionState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setPlaceId: (placeId) => set({ placeId }),
      setDate: (date) => set({ date }),
      setDuration: (duration) => set({ duration }),
      setSportId: (sportId) => set({ sportId }),
      setMode: (mode) => set({ mode }),
      setCourtId: (courtId) => set({ courtId }),
      setAddonIds: (addonIds) => set({ addonIds }),
      setStartTime: (startTime) => set({ startTime }),
      setAnyView: (view) => set({ anyView: view }),
      setCourtView: (view) => set({ courtView: view }),

      clearSelection: (resetDuration = false, defaultDuration) => {
        const state = get();
        set({
          startTime: null,
          duration: resetDuration ? (defaultDuration ?? null) : state.duration,
        });
      },

      saveLastAdded: () => {
        const { startTime, duration } = get();
        if (!startTime || !duration) return;
        set({
          lastAddedSelection: {
            startTime,
            durationMinutes: duration,
          },
        });
      },

      restoreLastAdded: () => {
        const { lastAddedSelection } = get();
        if (!lastAddedSelection) return;
        set({
          startTime: lastAddedSelection.startTime,
          duration: lastAddedSelection.durationMinutes,
        });
      },

      reset: () => set(initialState),
    }),
    {
      name: "booking-selection",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        placeId: state.placeId,
        date: state.date,
        duration: state.duration,
        sportId: state.sportId,
        mode: state.mode,
        courtId: state.courtId,
        startTime: state.startTime,
      }),
      skipHydration: true,
    },
  ),
);
