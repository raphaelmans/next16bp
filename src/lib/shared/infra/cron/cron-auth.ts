import { NextResponse } from "next/server";

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
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { ok: true };
}
