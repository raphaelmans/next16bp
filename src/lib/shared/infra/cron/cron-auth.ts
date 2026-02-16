import { NextResponse } from "next/server";
import { logger } from "@/lib/shared/infra/logger";

type CronAuthResult =
  | { ok: true }
  | {
      ok: false;
      response: NextResponse;
    };

export function verifyCronAuth(request: Request): CronAuthResult {
  const cronSecret = process.env.CRON_SECRET;
  const isDevelopmentLike =
    process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test";

  if (!cronSecret && !isDevelopmentLike) {
    logger.error(
      {
        event: "cron.auth.failed",
        reason: "missing_cron_secret",
        env: process.env.NODE_ENV,
        hasCronSecret: false,
      },
      "Cron auth failed: CRON_SECRET is not configured",
    );

    return {
      ok: false,
      response: NextResponse.json(
        { error: "CRON_SECRET is not configured" },
        { status: 500 },
      ),
    };
  }

  if (!cronSecret && isDevelopmentLike) {
    return { ok: true };
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    logger.warn(
      {
        event: "cron.auth.failed",
        reason: "unauthorized",
        env: process.env.NODE_ENV,
        hasCronSecret: true,
      },
      "Cron auth failed: invalid authorization header",
    );

    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { ok: true };
}
