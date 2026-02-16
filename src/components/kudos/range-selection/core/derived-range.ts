import type { RangeSelectionConfig, RangeSelectionRange } from "../types";

type ActiveRangeState = {
  anchorIdx: number | null;
  hoverIdx: number | null;
  committedRange: RangeSelectionRange | null;
  config: RangeSelectionConfig;
};

type AwaitingEndClickState = {
  anchorIdx: number | null;
  committedRange: RangeSelectionRange | null;
};

type HoverPreviewState = {
  anchorIdx: number | null;
  hoveredIdx: number | null;
  committedRange: RangeSelectionRange | null;
  config: RangeSelectionConfig;
};

export function deriveActiveRange({
  anchorIdx,
  hoverIdx,
  committedRange,
  config,
}: ActiveRangeState): RangeSelectionRange | null {
  if (anchorIdx !== null && hoverIdx !== null) {
    const clamped = config.clampToContiguous(anchorIdx, hoverIdx);
    return config.computeRange(anchorIdx, clamped) ?? committedRange;
  }
  return committedRange;
}

export function deriveIsAwaitingEndClick({
  anchorIdx,
  committedRange,
}: AwaitingEndClickState): boolean {
  return (
    committedRange !== null &&
    committedRange.startIdx === committedRange.endIdx &&
    anchorIdx === null
  );
}

export function deriveHoverPreviewRange({
  anchorIdx,
  hoveredIdx,
  committedRange,
  config,
}: HoverPreviewState): RangeSelectionRange | null {
  if (!deriveIsAwaitingEndClick({ anchorIdx, committedRange })) return null;
  if (hoveredIdx === null || !committedRange) return null;
  if (hoveredIdx === committedRange.startIdx) return null;
  return config.computeRange(committedRange.startIdx, hoveredIdx);
}

export function selectActiveStartIdx(state: ActiveRangeState): number | null {
  return deriveActiveRange(state)?.startIdx ?? null;
}

export function selectActiveEndIdx(state: ActiveRangeState): number | null {
  return deriveActiveRange(state)?.endIdx ?? null;
}
