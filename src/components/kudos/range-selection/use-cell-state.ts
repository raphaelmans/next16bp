"use client";

import { useShallow } from "zustand/shallow";
import {
  deriveActiveRange,
  deriveHoverPreviewRange,
  deriveIsAwaitingEndClick,
} from "./core/derived-range";
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
      const activeRange = deriveActiveRange({
        anchorIdx,
        hoverIdx,
        committedRange,
        config,
      });

      const inRange =
        activeRange !== null &&
        idx >= activeRange.startIdx &&
        idx <= activeRange.endIdx;
      const isStart = activeRange !== null && idx === activeRange.startIdx;
      const isEnd = activeRange !== null && idx === activeRange.endIdx;

      const isAwaitingEndClick = deriveIsAwaitingEndClick({
        anchorIdx,
        committedRange,
      });
      const hoverPreviewRange = deriveHoverPreviewRange({
        anchorIdx,
        hoveredIdx,
        committedRange,
        config,
      });

      let inHoverPreview = false;
      if (hoverPreviewRange) {
        inHoverPreview =
          idx >= hoverPreviewRange.startIdx &&
          idx <= hoverPreviewRange.endIdx &&
          !inRange;
      }

      const isPendingStart =
        isAwaitingEndClick &&
        committedRange !== null &&
        idx === committedRange.startIdx;

      return { inRange, isStart, isEnd, inHoverPreview, isPendingStart };
    }),
  );
}
