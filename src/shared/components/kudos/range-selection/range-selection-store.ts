import { createStore } from "zustand/vanilla";
import type { RangeSelectionConfig } from "./types";

export interface RangeSelectionState {
  // Interaction state
  anchorIdx: number | null;
  hoverIdx: number | null;
  hoveredIdx: number | null;
  didDrag: boolean;
  suppressClick: boolean;

  // Synced from parent props
  committedRange: { startIdx: number; endIdx: number } | null;

  // Injected config
  config: RangeSelectionConfig;

  // Actions
  setConfig: (config: RangeSelectionConfig) => void;
  setCommittedRange: (
    range: { startIdx: number; endIdx: number } | null,
  ) => void;
  pointerDown: (idx: number) => void;
  pointerEnter: (idx: number) => void;
  pointerUp: () => void;
  click: (idx: number, shiftKey: boolean) => void;
  setHoveredIdx: (idx: number | null) => void;
  resetDrag: () => void;
}

const NOOP_CONFIG: RangeSelectionConfig = {
  isCellAvailable: () => false,
  computeRange: () => null,
  clampToContiguous: (a) => a,
  commitRange: () => {},
};

export type RangeSelectionStoreApi = ReturnType<
  typeof createRangeSelectionStore
>;

export const createRangeSelectionStore = (
  initialConfig: RangeSelectionConfig = NOOP_CONFIG,
) =>
  createStore<RangeSelectionState>()((set, get) => {
    // Track the global listener so we can self-remove
    let globalUpListener: (() => void) | null = null;

    const removeGlobalListener = () => {
      if (globalUpListener) {
        window.removeEventListener("pointerup", globalUpListener);
        globalUpListener = null;
      }
    };

    return {
      anchorIdx: null,
      hoverIdx: null,
      hoveredIdx: null,
      didDrag: false,
      suppressClick: false,
      committedRange: null,
      config: initialConfig,

      setConfig: (config) => set({ config }),
      setCommittedRange: (range) => set({ committedRange: range }),

      pointerDown: (idx) => {
        const { config } = get();
        if (!config.isCellAvailable(idx)) return;
        set({ anchorIdx: idx, hoverIdx: idx, didDrag: false });

        // Register self-removing global pointerup
        removeGlobalListener();
        globalUpListener = () => {
          get().pointerUp();
        };
        window.addEventListener("pointerup", globalUpListener);
      },

      pointerEnter: (idx) => {
        const { anchorIdx } = get();
        if (anchorIdx === null) return;
        const updates: Partial<RangeSelectionState> = { hoverIdx: idx };
        if (idx !== anchorIdx) updates.didDrag = true;
        set(updates);
      },

      pointerUp: () => {
        removeGlobalListener();
        const { anchorIdx, hoverIdx, didDrag, committedRange, config } = get();

        if (anchorIdx === null || hoverIdx === null) {
          set({ anchorIdx: null, hoverIdx: null });
          return;
        }

        if (didDrag) {
          // Drag commit
          const clamped = config.clampToContiguous(anchorIdx, hoverIdx);
          const range = config.computeRange(anchorIdx, clamped);
          if (range) {
            config.commitRange(range.startIdx, range.endIdx);
            set({
              suppressClick: true,
              anchorIdx: null,
              hoverIdx: null,
              didDrag: false,
            });
            return;
          }
        } else {
          // Single tap
          const isSingle =
            committedRange !== null &&
            committedRange.startIdx === committedRange.endIdx;

          if (
            isSingle &&
            committedRange &&
            anchorIdx !== committedRange.startIdx
          ) {
            // Two-click flow: extend
            const range = config.computeRange(
              committedRange.startIdx,
              anchorIdx,
            );
            if (range) {
              config.commitRange(range.startIdx, range.endIdx);
            } else {
              config.commitRange(anchorIdx, anchorIdx);
            }
          } else {
            // New start
            config.commitRange(anchorIdx, anchorIdx);
          }
          set({ suppressClick: true });
        }

        set({ anchorIdx: null, hoverIdx: null, didDrag: false });
      },

      click: (idx, shiftKey) => {
        const s = get();
        if (s.suppressClick) {
          set({ suppressClick: false });
          return;
        }
        const { committedRange, config } = s;
        if (!config.isCellAvailable(idx)) return;

        // Clear stale drag state
        set({ anchorIdx: null, hoverIdx: null });

        // Shift+click: extend from committed start
        if (shiftKey && committedRange) {
          const range = config.computeRange(committedRange.startIdx, idx);
          if (range) {
            config.commitRange(range.startIdx, range.endIdx);
            return;
          }
        }

        // Two-click flow
        const isSingle =
          committedRange !== null &&
          committedRange.startIdx === committedRange.endIdx;
        if (isSingle && committedRange && idx !== committedRange.startIdx) {
          const range = config.computeRange(committedRange.startIdx, idx);
          if (range) {
            config.commitRange(range.startIdx, range.endIdx);
          } else {
            config.commitRange(idx, idx);
          }
          return;
        }

        // New start
        config.commitRange(idx, idx);
      },

      setHoveredIdx: (idx) => set({ hoveredIdx: idx }),
      resetDrag: () =>
        set({
          anchorIdx: null,
          hoverIdx: null,
          hoveredIdx: null,
          didDrag: false,
        }),
    };
  });
