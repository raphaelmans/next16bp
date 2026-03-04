import type { RangeSelectionPointerMeta } from "../types";

const DEFAULT_DRAG_THRESHOLD_PX = 6;
const TOUCH_DRAG_THRESHOLD_PX = 14;

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
  const isTouch =
    down.pointerType === "touch" || current.pointerType === "touch";
  const effectiveThreshold = isTouch ? TOUCH_DRAG_THRESHOLD_PX : thresholdPx;
  return (
    getPointerDistanceSquared(down, current) >
    effectiveThreshold * effectiveThreshold
  );
}
