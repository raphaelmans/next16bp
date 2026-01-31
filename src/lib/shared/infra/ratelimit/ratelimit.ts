import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { RATE_LIMIT_TIERS, type RateLimitTier } from "./config";

/**
 * Cache for rate limiter instances by tier.
 * Each tier gets its own rate limiter with independent limits.
 */
const rateLimiters = new Map<RateLimitTier, Ratelimit>();

/**
 * Creates or retrieves a rate limiter for the specified tier.
 * Uses lazy initialization and caching for efficiency.
 *
 * @param tier - The rate limit tier to use
 * @returns Ratelimit instance for the specified tier
 */
export function getRateLimiter(tier: RateLimitTier): Ratelimit {
  const existing = rateLimiters.get(tier);
  if (existing) {
    return existing;
  }

  const config = RATE_LIMIT_TIERS[tier];
  const limiter = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(config.requests, config.window),
    prefix: `@kudoscourts/ratelimit/${tier}`,
    analytics: true,
  });

  rateLimiters.set(tier, limiter);
  return limiter;
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
