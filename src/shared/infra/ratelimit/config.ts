/**
 * Rate limit tier configurations for API endpoints.
 * Uses sliding window algorithm via Upstash Ratelimit.
 */

export const RATE_LIMIT_TIERS = {
  /** Standard read endpoints - 100 req/min */
  default: { requests: 100, window: "1 m" as const },
  /** Authentication endpoints - 10 req/min */
  auth: { requests: 10, window: "1 m" as const },
  /** Create/update operations - 30 req/min */
  mutation: { requests: 30, window: "1 m" as const },
  /** Sensitive operations (reservations, claims) - 5 req/min */
  sensitive: { requests: 5, window: "1 m" as const },
} as const;

export type RateLimitTier = keyof typeof RATE_LIMIT_TIERS;
