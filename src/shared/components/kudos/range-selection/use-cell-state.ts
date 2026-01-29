"use client";

import { useShallow } from "zustand/shallow";
import { useRangeSelection } from "./range-selection-provider";
import type { CellVisualState } from "./types";

/**
 * Per-cell selector hook. Returns visual state for a specific cell index.
 * Only triggers re-render when this cell's visual state actually changes.
 */
export function useCellState(idx: number): CellVisualState {
  return useRangeSelection(
    useShallow((s) => {
      const { anchorIdx, hoverIdx, committedRange, config, hoveredIdx } = s;

      // Derive activeRange
      let activeRange = committedRange;
      if (anchorIdx !== null && hoverIdx !== null) {
        const clamped = config.clampToContiguous(anchorIdx, hoverIdx);
        activeRange = config.computeRange(anchorIdx, clamped) ?? committedRange;
      }

      const inRange =
        activeRange !== null &&
        idx >= activeRange.startIdx &&
        idx <= activeRange.endIdx;
      const isStart = activeRange !== null && idx === activeRange.startIdx;
      const isEnd = activeRange !== null && idx === activeRange.endIdx;

      // Hover preview for two-click flow
      const isDragging = anchorIdx !== null;
      const isAwaitingEndClick =
        committedRange !== null &&
        committedRange.startIdx === committedRange.endIdx &&
        !isDragging;

      let inHoverPreview = false;
      if (
        isAwaitingEndClick &&
        committedRange &&
        hoveredIdx !== null &&
        hoveredIdx !== committedRange.startIdx
      ) {
        const hpRange = config.computeRange(
          committedRange.startIdx,
          hoveredIdx,
        );
        if (hpRange) {
          inHoverPreview =
            idx >= hpRange.startIdx && idx <= hpRange.endIdx && !inRange;
        }
      }

      const isPendingStart =
        isAwaitingEndClick &&
        committedRange !== null &&
        idx === committedRange.startIdx;

      return { inRange, isStart, isEnd, inHoverPreview, isPendingStart };
    }),
  );
}
