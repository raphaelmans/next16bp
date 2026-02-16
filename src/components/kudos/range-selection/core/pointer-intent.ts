import type { RangeSelectionPointerMeta } from "../types";

const DEFAULT_DRAG_THRESHOLD_PX = 6;

export function getPointerDistanceSquared(
  from: RangeSelectionPointerMeta,
  to: RangeSelectionPointerMeta,
): number {
  const dx = to.clientX - from.clientX;
  const dy = to.clientY - from.clientY;
  return dx * dx + dy * dy;
}

export function hasExceededDragThreshold(
  down: RangeSelectionPointerMeta,
  current: RangeSelectionPointerMeta,
  thresholdPx = DEFAULT_DRAG_THRESHOLD_PX,
): boolean {
  return getPointerDistanceSquared(down, current) > thresholdPx * thresholdPx;
}
