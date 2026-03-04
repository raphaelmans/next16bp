/**
 * Sorts hours in schedule order for overnight-aware grids.
 *
 * Detects the largest gap between consecutive hours and rotates the
 * array so that gap becomes the break point.
 *
 * Example: input {0, 6, 7, …, 23} → output [6, 7, …, 23, 0]
 * (the 5-hour gap 1–5 AM becomes the split)
 *
 * For a normal daytime schedule (no wrap) the ascending sort is returned as-is.
 */
export function sortHoursInScheduleOrder(hours: number[]): number[] {
  if (hours.length <= 1) return [...hours];

  const sorted = [...hours].sort((a, b) => a - b);

  let maxGap = 0;
  let gapAfterIdx = sorted.length - 1; // default: gap after last element (wrap 23→0)

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i] as number;
    const next = sorted[(i + 1) % sorted.length] as number;
    const gap = (next - current + 24) % 24;
    if (gap > maxGap) {
      maxGap = gap;
      gapAfterIdx = i;
    }
  }

  // If the largest gap is after the last element, ascending order is already correct
  if (gapAfterIdx === sorted.length - 1 || maxGap <= 1) return sorted;

  return [
    ...sorted.slice(gapAfterIdx + 1),
    ...sorted.slice(0, gapAfterIdx + 1),
  ];
}
