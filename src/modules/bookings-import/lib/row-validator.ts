/**
 * Row validation utilities for bookings import
 */

import { isHourAligned } from "./datetime-parser";

export interface ValidationResult {
  errors: string[];
  warnings: string[];
}

export interface RowValidationInput {
  courtId: string | null;
  courtLabel: string | null;
  startTime: Date | null;
  endTime: Date | null;
  timeZone: string;
}

/**
 * Validate a single import row
 * Returns errors (blocking) and warnings (non-blocking)
 */
export function validateRow(input: RowValidationInput): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!input.startTime) {
    errors.push("Start time is required");
  }
  if (!input.endTime) {
    errors.push("End time is required");
  }

  // Court mapping
  if (!input.courtId && !input.courtLabel) {
    errors.push("Court must be specified");
  } else if (!input.courtId && input.courtLabel) {
    errors.push("Court label could not be mapped to an existing court");
  }

  // Time validations (only if we have both times)
  if (input.startTime && input.endTime) {
    // End after start
    if (input.endTime.getTime() <= input.startTime.getTime()) {
      errors.push("End time must be after start time");
    } else {
      // Duration validation
      const durationMinutes =
        (input.endTime.getTime() - input.startTime.getTime()) / 60000;
      if (!Number.isFinite(durationMinutes) || durationMinutes % 60 !== 0) {
        errors.push("Duration must be a multiple of 60 minutes");
      }
    }

    // Hour alignment
    if (!isHourAligned(input.startTime, input.timeZone)) {
      errors.push("Start time must be on the hour (minute 0)");
    }
    if (!isHourAligned(input.endTime, input.timeZone)) {
      errors.push("End time must be on the hour (minute 0)");
    }
  }

  return { errors, warnings };
}

/**
 * Detect duplicate rows within a job
 * Returns a map of row indices to duplicate group indices
 */
export function detectDuplicates(
  rows: Array<{
    courtId: string | null;
    courtLabel?: string | null;
    startTime: Date | null;
    endTime: Date | null;
  }>,
): Map<number, number[]> {
  const duplicates = new Map<number, number[]>();
  const seen = new Map<string, number[]>();

  rows.forEach((row, index) => {
    if (!row.startTime || !row.endTime) return;

    const fallbackLabel = row.courtLabel?.trim().toLowerCase() ?? null;
    const courtKey = row.courtId ?? fallbackLabel;
    if (!courtKey) return;

    const key = `${courtKey}|${row.startTime.getTime()}|${row.endTime.getTime()}`;
    const existing = seen.get(key);

    if (existing) {
      existing.push(index);
    } else {
      seen.set(key, [index]);
    }
  });

  // Mark all groups with more than one row as duplicates
  for (const [_key, indices] of seen) {
    if (indices.length > 1) {
      for (const idx of indices) {
        duplicates.set(
          idx,
          indices.filter((i) => i !== idx),
        );
      }
    }
  }

  return duplicates;
}
