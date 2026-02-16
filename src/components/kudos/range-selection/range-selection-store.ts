import { createStore } from "zustand/vanilla";
import { hasExceededDragThreshold } from "./core/pointer-intent";
import type {
  RangeSelectionConfig,
  RangeSelectionPointerMeta,
  RangeSelectionRange,
} from "./types";

export interface RangeSelectionState {
  // Interaction state
  anchorIdx: number | null;
  hoverIdx: number | null;
  hoveredIdx: number | null;
  didDrag: boolean;
  suppressClick: boolean;
  pointerDownMeta: RangeSelectionPointerMeta | null;

  // Synced from parent props
  committedRange: RangeSelectionRange | null;

  // Injected config
  config: RangeSelectionConfig;

  // Actions
  setConfig: (config: RangeSelectionConfig) => void;
  setCommittedRange: (range: RangeSelectionRange | null) => void;
  pointerDown: (idx: number, meta?: RangeSelectionPointerMeta) => void;
  pointerEnter: (idx: number, meta?: RangeSelectionPointerMeta) => void;
  pointerUp: () => void;
  click: (idx: number, shiftKey: boolean) => void;
  setHoveredIdx: (idx: number | null) => void;
  resetDrag: () => void;

  commitRangeInternal: (
    range: RangeSelectionRange,
    opts?: { suppressClick?: boolean; clearDrag?: boolean },
  ) => void;
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
      pointerDownMeta: null,
      committedRange: null,
      config: initialConfig,

      setConfig: (config) => set({ config }),
      setCommittedRange: (range) => set({ committedRange: range }),

      // Keep visual selection stable by updating committedRange immediately.
      // Parent state is still notified via config.commitRange.
      // (Without this, there can be a paint where activeRange becomes null.)
      //
      // NOTE: Suppressing click is only needed for pointerUp -> click ordering.
      //       Regular click commits should not suppress subsequent clicks.
      //
      commitRangeInternal: (
        range: RangeSelectionRange,
        opts?: {
          suppressClick?: boolean;
          clearDrag?: boolean;
        },
      ) => {
        const { config } = get();
        set({
          committedRange: range,
          ...(opts?.suppressClick ? { suppressClick: true } : {}),
          ...(opts?.clearDrag
            ? {
                anchorIdx: null,
                hoverIdx: null,
                didDrag: false,
                pointerDownMeta: null,
              }
            : {}),
        });
        config.commitRange(range.startIdx, range.endIdx);
      },

      pointerDown: (idx, meta) => {
        const { config } = get();
        if (!config.isCellAvailable(idx)) return;
        set({
          anchorIdx: idx,
          hoverIdx: idx,
          didDrag: false,
          pointerDownMeta: meta ?? null,
        });

        // Register self-removing global pointerup
        removeGlobalListener();
        globalUpListener = () => {
          get().pointerUp();
        };
        window.addEventListener("pointerup", globalUpListener);
      },

      pointerEnter: (idx, meta) => {
        const { anchorIdx, didDrag, pointerDownMeta } = get();
        if (anchorIdx === null) return;
        const updates: Partial<RangeSelectionState> = { hoverIdx: idx };
        if (!didDrag && idx !== anchorIdx) {
          if (!pointerDownMeta || !meta) {
            updates.didDrag = true;
          } else {
            updates.didDrag = hasExceededDragThreshold(pointerDownMeta, meta);
          }
        }
        set(updates);
      },

      pointerUp: () => {
        removeGlobalListener();
        const { anchorIdx, hoverIdx, didDrag, committedRange, config } = get();

        if (anchorIdx === null || hoverIdx === null) {
          set({ anchorIdx: null, hoverIdx: null, pointerDownMeta: null });
          return;
        }

        if (didDrag) {
          // Drag commit
          const clamped = config.clampToContiguous(anchorIdx, hoverIdx);
          const range = config.computeRange(anchorIdx, clamped);
          if (range) {
            get().commitRangeInternal(range, {
              suppressClick: true,
              clearDrag: true,
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
              get().commitRangeInternal(range, { suppressClick: true });
            } else {
              get().commitRangeInternal(
                { startIdx: anchorIdx, endIdx: anchorIdx },
                { suppressClick: true },
              );
            }
          } else {
            // New start
            get().commitRangeInternal(
              { startIdx: anchorIdx, endIdx: anchorIdx },
              { suppressClick: true },
            );
          }
        }

        set({
          anchorIdx: null,
          hoverIdx: null,
          didDrag: false,
          pointerDownMeta: null,
        });
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
        set({
          anchorIdx: null,
          hoverIdx: null,
          didDrag: false,
          pointerDownMeta: null,
        });

        // Shift+click: extend from committed start
        if (shiftKey && committedRange) {
          const range = config.computeRange(committedRange.startIdx, idx);
          if (range) {
            get().commitRangeInternal(range);
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
            get().commitRangeInternal(range);
          } else {
            get().commitRangeInternal({ startIdx: idx, endIdx: idx });
          }
          return;
        }

        // New start
        get().commitRangeInternal({ startIdx: idx, endIdx: idx });
      },

      setHoveredIdx: (idx) => set({ hoveredIdx: idx }),
      resetDrag: () =>
        set({
          anchorIdx: null,
          hoverIdx: null,
          hoveredIdx: null,
          didDrag: false,
          pointerDownMeta: null,
        }),
    };
  });
