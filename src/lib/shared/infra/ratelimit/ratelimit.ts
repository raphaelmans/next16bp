import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { RATE_LIMIT_TIERS, type RateLimitTier } from "./config";

type RateLimiter = {
  limit: (identifier: string) => Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
    pending: Promise<void>;
  }>;
};

export class RateLimiterUnavailableError extends Error {
  constructor(message = "Rate limiter backend is not configured") {
    super(message);
    this.name = "RateLimiterUnavailableError";
  }
}

const isRateLimiterConfigured = () =>
  Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
  );

const isDevelopmentLikeEnv = () =>
  process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test";

/**
 * Cache for rate limiter instances by tier.
 * Each tier gets its own rate limiter with independent limits.
 */
const rateLimiters = new Map<RateLimitTier, RateLimiter>();

/**
 * Creates or retrieves a rate limiter for the specified tier.
 * Uses lazy initialization and caching for efficiency.
 *
 * @param tier - The rate limit tier to use
 * @returns Ratelimit instance for the specified tier
 */
export function getRateLimiter(tier: RateLimitTier): RateLimiter {
  const existing = rateLimiters.get(tier);
  if (existing) {
    return existing;
  }

  if (!isRateLimiterConfigured()) {
    if (isDevelopmentLikeEnv()) {
      const noop: RateLimiter = {
        limit: async () => ({
          success: true,
          limit: 0,
          remaining: 0,
          reset: 0,
          pending: Promise.resolve(),
        }),
      };

      rateLimiters.set(tier, noop);
      return noop;
    }

    const unavailable: RateLimiter = {
      limit: async () => {
        throw new RateLimiterUnavailableError();
      },
    };

    rateLimiters.set(tier, unavailable);
    return unavailable;
  }

  const config = RATE_LIMIT_TIERS[tier];
  const limiter = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(config.requests, config.window),
    prefix: `@kudoscourts/ratelimit/${tier}`,
    analytics: true,
  });

  rateLimiters.set(tier, limiter as unknown as RateLimiter);
  return limiter as unknown as RateLimiter;
}

/**
 * Creates a fresh rate limiter instance (useful for testing).
 *
 * @param tier - The rate limit tier to use
 * @returns New Ratelimit instance
 */
export function createRateLimiter(tier: RateLimitTier): Ratelimit {
  const config = RATE_LIMIT_TIERS[tier];
  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(config.requests, config.window),
    prefix: `@kudoscourts/ratelimit/${tier}`,
    analytics: true,
  });
}
