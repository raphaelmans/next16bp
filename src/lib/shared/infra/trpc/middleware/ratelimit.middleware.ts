import { TRPCError } from "@trpc/server";
import { RateLimitError } from "@/lib/shared/kernel/errors";
import {
  getRateLimiter,
  RateLimiterUnavailableError,
  type RateLimitTier,
} from "../../ratelimit";
import { middleware } from "../trpc";

/**
 * Creates a rate limit middleware for the specified tier.
 * Uses userId for authenticated requests, client identifier for anonymous.
 *
 * @param tier - The rate limit tier to apply
 * @returns tRPC middleware that enforces rate limiting
 */
export function createRateLimitMiddleware(tier: RateLimitTier) {
  const limiter = getRateLimiter(tier);

  return middleware(async ({ ctx, next }) => {
    const identifier = ctx.userId ?? ctx.clientIdentifier;

    let result: Awaited<ReturnType<typeof limiter.limit>>;
    try {
      result = await limiter.limit(identifier);
    } catch (error) {
      if (error instanceof RateLimiterUnavailableError) {
        ctx.log.error(
          {
            tier,
            identifierType: ctx.userId ? "user" : ctx.clientIdentifierSource,
          },
          "Rate limiter unavailable",
        );

        throw new TRPCError({
          code: "SERVICE_UNAVAILABLE",
          message: "Rate limiter unavailable. Please try again later.",
          cause: error,
        });
      }

      throw error;
    }

    const { success, limit, remaining } = result;

    if (!success) {
      ctx.log.warn(
        {
          tier,
          limit,
          remaining,
          identifierType: ctx.userId ? "user" : ctx.clientIdentifierSource,
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
