import { NextResponse } from "next/server";
import {
  getRateLimiter,
  RateLimiterUnavailableError,
  type RateLimitTier,
} from "@/lib/shared/infra/ratelimit";
import { getClientIdentifier } from "./client-identifier";

export async function enforceRateLimit(args: {
  req: Request;
  tier: RateLimitTier;
  requestId: string;
  identifier?: string;
}) {
  const limiter = getRateLimiter(args.tier);
  const identifier = args.identifier ?? getClientIdentifier(args.req).value;

  let result: Awaited<ReturnType<typeof limiter.limit>>;
  try {
    result = await limiter.limit(identifier);
  } catch (error) {
    if (error instanceof RateLimiterUnavailableError) {
      return {
        ok: false as const,
        response: NextResponse.json(
          {
            code: "SERVICE_UNAVAILABLE",
            message: "Rate limiter unavailable. Please try again later.",
            requestId: args.requestId,
          },
          { status: 503 },
        ),
      };
    }

    throw error;
  }

  if (result.success) {
    return { ok: true as const };
  }

  return {
    ok: false as const,
    response: NextResponse.json(
      {
        code: "TOO_MANY_REQUESTS",
        message: "Rate limit exceeded. Please try again later.",
        requestId: args.requestId,
      },
      { status: 429 },
    ),
  };
}
