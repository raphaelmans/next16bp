export interface RangeSelectionConfig {
  /** Is cell at index available for selection? */
  isCellAvailable: (idx: number) => boolean;
  /** Compute contiguous range between two indices, null if blocked */
  computeRange: (
    anchorIdx: number,
    targetIdx: number,
  ) => { startIdx: number; endIdx: number } | null;
  /** Clamp target to furthest contiguous reachable index from anchor */
  clampToContiguous: (anchorIdx: number, targetIdx: number) => number;
  /** Commit a range to the parent (calls onChange/onRangeChange) */
  commitRange: (startIdx: number, endIdx: number) => void;
  /** Called when selection is cleared via same-cell reselect. If not provided, clearing is disabled. */
  onClear?: () => void;
}

export interface RangeSelectionRange {
  startIdx: number;
  endIdx: number;
}

export interface RangeSelectionPointerMeta {
  clientX: number;
  clientY: number;
  pointerType?: string;
}

export interface CellVisualState {
  inRange: boolean;
  isStart: boolean;
  isEnd: boolean;
  inHoverPreview: boolean;
  isPendingStart: boolean;
}
