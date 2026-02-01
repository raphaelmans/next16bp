import { NextResponse } from "next/server";
import {
  getRateLimiter,
  type RateLimitTier,
} from "@/lib/shared/infra/ratelimit";

const getIp = (req: Request): string | null => {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return null;
};

export async function enforceRateLimit(args: {
  req: Request;
  tier: RateLimitTier;
  requestId: string;
}) {
  const limiter = getRateLimiter(args.tier);
  const identifier = getIp(args.req) ?? args.requestId;
  const result = await limiter.limit(identifier);
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
