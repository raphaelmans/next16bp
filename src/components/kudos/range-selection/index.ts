export {
  deriveActiveRange,
  deriveHoverPreviewRange,
  deriveIsAwaitingEndClick,
  selectActiveEndIdx,
  selectActiveStartIdx,
} from "./core/derived-range";
export {
  RangeSelectionProvider,
  useRangeSelection,
} from "./range-selection-provider";
export {
  createRangeSelectionStore,
  type RangeSelectionState,
  type RangeSelectionStoreApi,
} from "./range-selection-store";
export type {
  CellVisualState,
  RangeSelectionConfig,
  RangeSelectionPointerMeta,
  RangeSelectionRange,
} from "./types";
export { useCellState } from "./use-cell-state";
