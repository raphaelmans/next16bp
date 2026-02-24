type CourtSelectionMemoryKeyInput = {
  placeId?: string;
  sportId?: string;
  dayKey?: string;
  courtId?: string;
};

export function buildCourtSelectionMemoryKey({
  placeId,
  sportId,
  dayKey,
  courtId,
}: CourtSelectionMemoryKeyInput): string | null {
  if (!placeId || !sportId || !dayKey || !courtId) return null;
  return `${placeId}|${sportId}|${dayKey}|${courtId}`;
}
