import { TRPCError } from "@trpc/server";
import { getRateLimiter, type RateLimitTier } from "../../ratelimit";
import { RateLimitError } from "@/shared/kernel/errors";
import { middleware } from "../trpc";

/**
 * Creates a rate limit middleware for the specified tier.
 * Uses userId for authenticated requests, requestId for anonymous.
 *
 * @param tier - The rate limit tier to apply
 * @returns tRPC middleware that enforces rate limiting
 */
export function createRateLimitMiddleware(tier: RateLimitTier) {
  const limiter = getRateLimiter(tier);

  return middleware(async ({ ctx, next }) => {
    // Use userId if authenticated, otherwise use requestId as fallback
    const identifier = ctx.userId ?? ctx.requestId;

    const { success, limit, remaining } = await limiter.limit(identifier);

    if (!success) {
      ctx.log.warn(
        {
          tier,
          limit,
          remaining,
          identifier: ctx.userId ? "user" : "anonymous",
        },
        "Rate limit exceeded",
      );

      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Rate limit exceeded. Please try again later.",
        cause: new RateLimitError("Rate limit exceeded", {
          tier,
          limit,
          remaining,
        }),
      });
    }

    return next();
  });
}
