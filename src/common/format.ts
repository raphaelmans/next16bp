import { TZDate } from "@date-fns/tz";
import {
  format,
  formatDistance,
  formatDistanceToNow,
  isToday,
  isTomorrow,
  isYesterday,
} from "date-fns";

/**
 * Format currency from cents to display string
 * @param cents - Amount in cents (e.g., 20000 for PHP 200.00)
 * @param currency - Currency code (default: PHP)
 */
const currencySymbols: Record<string, string> = {
  PHP: "₱",
  USD: "$",
  EUR: "€",
};

export function formatCurrency(
  cents: number,
  currency: string = "PHP",
): string {
  const amount = cents / 100;
  const symbol = currencySymbols[currency] ?? currency;
  return `${symbol}${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format currency from cents as a whole number (no decimals)
 * @param cents - Amount in cents (e.g., 20000 for PHP 200)
 * @param currency - Currency code (default: PHP)
 */
export function formatCurrencyWhole(
  cents: number,
  currency: string = "PHP",
): string {
  const amount = Math.round(cents / 100);
  const symbol = currencySymbols[currency] ?? currency;
  return `${symbol}${amount.toLocaleString("en-US")}`;
}

/**
 * Format date to long format
 * @example "Wednesday, January 15, 2025"
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "EEEE, MMMM d, yyyy");
}

/**
 * Format date to short format
 * @example "Jan 15, 2025"
 */
export function formatDateShort(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "MMM d, yyyy");
}

/**
 * Format time
 * @example "6:00 AM"
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "h:mm a");
}

export function formatInTimeZone(
  date: Date | string,
  timeZone: string,
  pattern: string,
): string {
  const parsed = typeof date === "string" ? new Date(date) : date;
  const zoned = new TZDate(parsed.getTime(), timeZone);
  return format(zoned, pattern);
}

export function formatDateShortInTimeZone(
  date: Date | string,
  timeZone: string,
): string {
  return formatInTimeZone(date, timeZone, "MMM d, yyyy");
}

export function formatTimeInTimeZone(
  date: Date | string,
  timeZone: string,
): string {
  return formatInTimeZone(date, timeZone, "h:mm a");
}

export function formatTimeRangeInTimeZone(
  start: Date | string,
  end: Date | string,
  timeZone: string,
): string {
  return `${formatTimeInTimeZone(start, timeZone)} - ${formatTimeInTimeZone(
    end,
    timeZone,
  )}`;
}

/**
 * Format time range
 * @example "6:00 AM - 7:00 AM"
 */
export function formatTimeRange(
  start: Date | string,
  end: Date | string,
): string {
  return `${formatTime(start)} - ${formatTime(end)}`;
}

/**
 * Format relative time
 * @example "2 hours ago", "in 3 days"
 */
export function formatRelative(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

/**
 * Format relative time from a custom base date
 * @example formatRelativeFrom("2025-01-01", Date.now()) -> "in 2 hours"
 */
export function formatRelativeFrom(
  date: Date | string,
  baseDate: Date | string | number,
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const base =
    typeof baseDate === "number"
      ? new Date(baseDate)
      : typeof baseDate === "string"
        ? new Date(baseDate)
        : baseDate;

  return formatDistance(d, base, { addSuffix: true });
}

/**
 * Format date with smart labels for today/tomorrow/yesterday
 * @example "Today", "Tomorrow", "Jan 15"
 */
export function formatDateSmart(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMM d");
}

/**
 * Format duration in minutes to human readable
 * @example "1h 30min", "45min"
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}min`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}min`;
}

/**
 * Format phone number for display
 * @example "+63 917 123 4567"
 */
export function formatPhoneNumber(phone: string): string {
  // Remove non-digits
  const cleaned = phone.replace(/\D/g, "");

  // Philippine format
  if (cleaned.startsWith("63") && cleaned.length === 12) {
    return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
  }

  // If starts with 09
  if (cleaned.startsWith("09") && cleaned.length === 11) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }

  return phone;
}
