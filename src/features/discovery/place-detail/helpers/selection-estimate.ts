type SelectionSummary = {
  startTime: string;
  endTime: string;
  totalCents?: number;
  currency: string;
};

type IsSelectionEstimateReadyParams = {
  selectedStartTime?: string;
  durationMinutes: number;
  selectionSummary: SelectionSummary | null;
};

/**
 * Ensures summary pricing belongs to the current selection and has a concrete total.
 */
export function isSelectionEstimateReady({
  selectedStartTime,
  durationMinutes,
  selectionSummary,
}: IsSelectionEstimateReadyParams): boolean {
  if (!selectedStartTime || !selectionSummary) return false;
  if (selectionSummary.startTime !== selectedStartTime) return false;
  if (typeof selectionSummary.totalCents !== "number") return false;

  const expectedEndMs =
    Date.parse(selectedStartTime) + durationMinutes * 60_000;
  const summaryEndMs = Date.parse(selectionSummary.endTime);
  if (!Number.isFinite(expectedEndMs) || !Number.isFinite(summaryEndMs)) {
    return false;
  }
  return expectedEndMs === summaryEndMs;
}
