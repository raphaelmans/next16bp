import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/lib/env";
import { dispatchNotificationDelivery } from "@/lib/modules/notification-delivery/http/dispatch-notification-delivery.handler";
import { QstashNotificationDispatchTriggerQueue } from "@/lib/modules/notification-delivery/queues/qstash-notification-dispatch-trigger.queue";
import { logger } from "@/lib/shared/infra/logger";
import { verifyQstashSignature } from "@/lib/shared/infra/qstash/qstash-signature";

const CRON_BATCH_LIMIT = 25;
const MAX_DISPATCH_PASSES = 5;

const dispatchKickPayloadSchema = z
  .object({
    reason: z.string().optional(),
    triggeredAtIso: z.string().optional(),
    jobCount: z.number().int().positive().optional(),
  })
  .passthrough();

type DispatchResponseBody = {
  processed?: number;
  sentCount?: number;
  failedCount?: number;
  skippedCount?: number;
};

function verifyQueueTriggerAuth(request: NextRequest, body: string) {
  const expectedUrl = request.nextUrl.toString();
  const signature = request.headers.get("upstash-signature");

  const verification = verifyQstashSignature({
    signature,
    body,
    url: expectedUrl,
    currentSigningKey: env.QSTASH_CURRENT_SIGNING_KEY,
    nextSigningKey: env.QSTASH_NEXT_SIGNING_KEY,
  });

  if (verification.ok) {
    return { ok: true as const };
  }

  const isDevelopmentLike =
    process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test";
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (
    isDevelopmentLike &&
    cronSecret &&
    authHeader === `Bearer ${cronSecret}`
  ) {
    logger.warn(
      {
        event: "notification_delivery.queue_trigger_auth_bypass",
        reason: verification.reason,
      },
      "Using local cron secret fallback for notification queue trigger auth",
    );
    return { ok: true as const };
  }

  if (!env.QSTASH_CURRENT_SIGNING_KEY && !env.QSTASH_NEXT_SIGNING_KEY) {
    logger.error(
      {
        event: "notification_delivery.queue_trigger_auth_failed",
        reason: "missing_signing_keys",
      },
      "QStash signing keys are not configured",
    );

    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "QStash signing keys are not configured" },
        { status: 500 },
      ),
    };
  }

  logger.warn(
    {
      event: "notification_delivery.queue_trigger_auth_failed",
      reason: verification.reason,
    },
    "QStash signature verification failed",
  );

  return {
    ok: false as const,
    response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
  };
}

async function parseDispatchResponseBody(
  response: Response,
): Promise<DispatchResponseBody | null> {
  try {
    const body = (await response.clone().json()) as unknown;
    if (!body || typeof body !== "object") {
      return null;
    }

    return body as DispatchResponseBody;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const auth = verifyQueueTriggerAuth(request, rawBody);
  if (!auth.ok) {
    return auth.response;
  }

  let parsedBody: unknown = {};
  if (rawBody) {
    try {
      parsedBody = JSON.parse(rawBody) as unknown;
    } catch {
      return NextResponse.json(
        {
          error: "Invalid JSON payload",
        },
        { status: 400 },
      );
    }
  }

  const payloadResult = dispatchKickPayloadSchema.safeParse(parsedBody);
  if (!payloadResult.success) {
    return NextResponse.json(
      {
        error: "Invalid dispatch kick payload",
      },
      { status: 400 },
    );
  }

  const totals = {
    processed: 0,
    sentCount: 0,
    failedCount: 0,
    skippedCount: 0,
  };

  let lastProcessed = 0;
  let passes = 0;

  for (; passes < MAX_DISPATCH_PASSES; passes += 1) {
    const dispatchResponse = await dispatchNotificationDelivery(request, {
      skipCronAuth: true,
    });

    if (!dispatchResponse.ok) {
      return dispatchResponse;
    }

    const dispatchBody = await parseDispatchResponseBody(dispatchResponse);
    if (!dispatchBody) {
      return NextResponse.json(
        {
          error: "Invalid dispatch response payload",
        },
        { status: 500 },
      );
    }

    const processed = dispatchBody.processed ?? 0;
    lastProcessed = processed;

    totals.processed += processed;
    totals.sentCount += dispatchBody.sentCount ?? 0;
    totals.failedCount += dispatchBody.failedCount ?? 0;
    totals.skippedCount += dispatchBody.skippedCount ?? 0;

    if (processed < CRON_BATCH_LIMIT) {
      break;
    }
  }

  if (lastProcessed >= CRON_BATCH_LIMIT) {
    const queue = QstashNotificationDispatchTriggerQueue.fromEnv();
    if (queue) {
      void queue
        .publishDispatchKick({
          reason: "backlog_drain",
          triggeredAtIso: new Date().toISOString(),
          jobCount: lastProcessed,
        })
        .catch((error) => {
          const message =
            error instanceof Error ? error.message : "Unknown error";

          logger.error(
            {
              event: "notification_delivery.queue_backlog_kick_failed",
              error: message,
            },
            "Failed to publish notification backlog dispatch kick",
          );
        });
    }
  }

  logger.info(
    {
      event: "notification_delivery.queue_trigger_completed",
      passes: passes + 1,
      ...totals,
      triggerReason: payloadResult.data.reason ?? null,
    },
    "Notification delivery queue trigger completed",
  );

  return NextResponse.json({
    success: totals.failedCount === 0,
    source: "qstash",
    passes: passes + 1,
    ...totals,
    timestamp: new Date().toISOString(),
  });
}

export const dynamic = "force-dynamic";
