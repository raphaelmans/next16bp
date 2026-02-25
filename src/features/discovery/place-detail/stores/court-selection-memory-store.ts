"use client";

import { create } from "zustand";

export type CourtSelectionMemoryValue = {
  startTime: string;
  durationMinutes: number;
};

type CourtSelectionMemoryState = {
  selections: Record<string, CourtSelectionMemoryValue>;
  rememberSelection: (key: string, value: CourtSelectionMemoryValue) => void;
  getSelection: (key: string) => CourtSelectionMemoryValue | undefined;
  clearSelection: (key: string) => void;
  clearAll: () => void;
};

export const useCourtSelectionMemoryStore = create<CourtSelectionMemoryState>()(
  (set, get) => ({
    selections: {},

    rememberSelection: (key, value) =>
      set((state) => ({
        selections: {
          ...state.selections,
          [key]: value,
        },
      })),

    getSelection: (key) => get().selections[key],

    clearSelection: (key) =>
      set((state) => {
        if (!(key in state.selections)) return state;
        const nextSelections = { ...state.selections };
        delete nextSelections[key];
        return { selections: nextSelections };
      }),

    clearAll: () => set({ selections: {} }),
  }),
);
