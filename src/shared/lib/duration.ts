const MIN_DURATION_MINUTES = 60;
const MAX_DURATION_MINUTES = 1440;

export function normalizeDurationMinutes(
  value: unknown,
  fallbackMinutes = MIN_DURATION_MINUTES,
): number {
  const minutes = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(minutes) || !Number.isInteger(minutes)) {
    return fallbackMinutes;
  }
  if (
    minutes < MIN_DURATION_MINUTES ||
    minutes > MAX_DURATION_MINUTES ||
    minutes % 60 !== 0
  ) {
    return fallbackMinutes;
  }
  return minutes;
}
