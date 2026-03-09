"use client";

import type { AppError } from "@/common/errors/app-error";

export const LIVE_QUERY_STALE_TIME_MS = 30_000;

export function shouldRetryLiveQuery(
  failureCount: number,
  error: AppError,
): boolean {
  if (
    error.kind === "rate_limited" ||
    error.kind === "validation" ||
    error.kind === "unauthorized" ||
    error.kind === "forbidden" ||
    error.kind === "not_found"
  ) {
    return false;
  }

  return failureCount < 1;
}

export const LIVE_QUERY_OPTIONS = {
  staleTime: LIVE_QUERY_STALE_TIME_MS,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  retry: shouldRetryLiveQuery,
} as const;

export const LIVE_PREFETCH_QUERY_OPTIONS = {
  staleTime: LIVE_QUERY_STALE_TIME_MS,
  retry: false,
} as const;
