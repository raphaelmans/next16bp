"use client";

import { createContext, useContext, useEffect, useRef } from "react";
import { useStore } from "zustand";
import {
  createRangeSelectionStore,
  type RangeSelectionState,
  type RangeSelectionStoreApi,
} from "./range-selection-store";
import type { RangeSelectionConfig } from "./types";

const RangeSelectionStoreContext = createContext<RangeSelectionStoreApi | null>(
  null,
);

interface RangeSelectionProviderProps {
  config: RangeSelectionConfig;
  committedRange: { startIdx: number; endIdx: number } | null;
  children: React.ReactNode;
}

export function RangeSelectionProvider({
  config,
  committedRange,
  children,
}: RangeSelectionProviderProps) {
  const storeRef = useRef<RangeSelectionStoreApi | undefined>(undefined);
  if (!storeRef.current) {
    storeRef.current = createRangeSelectionStore(config);
  }

  const store = storeRef.current;

  // Sync props into store via effect to avoid setState-during-render warnings
  useEffect(() => {
    store.getState().setConfig(config);
  }, [store, config]);

  useEffect(() => {
    store.getState().setCommittedRange(committedRange);
  }, [store, committedRange]);

  return (
    <RangeSelectionStoreContext.Provider value={store}>
      {children}
    </RangeSelectionStoreContext.Provider>
  );
}

export function useRangeSelection<T>(
  selector: (s: RangeSelectionState) => T,
): T {
  const store = useContext(RangeSelectionStoreContext);
  if (!store) {
    throw new Error(
      "useRangeSelection must be used within RangeSelectionProvider",
    );
  }
  return useStore(store, selector);
}
