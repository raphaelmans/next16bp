import { addMinutes } from "date-fns";
import { type NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { NotificationDeliveryJobRepository } from "@/lib/modules/notification-delivery/repositories/notification-delivery-job.repository";
import { getContainer } from "@/lib/shared/infra/container";
import { makeEmailService } from "@/lib/shared/infra/email/email.factory";
import { logger } from "@/lib/shared/infra/logger";
import { makeSmsService } from "@/lib/shared/infra/sms/sms.factory";

const MAX_ATTEMPTS = 5;
const BACKOFF_MINUTES = [1, 5, 15, 60, 360];
const BATCH_LIMIT = 25;

type VerificationRequestedPayload = {
  requestId: string;
  placeId: string;
  placeName: string;
  organizationId: string;
  organizationName?: string | null;
  requestedByUserId: string;
  requestNotes?: string | null;
};

const getAppUrl = (): string => {
  const appUrl = env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  return appUrl ?? "";
};

const parseVerificationPayload = (
  payload: Record<string, unknown> | null | undefined,
): VerificationRequestedPayload | null => {
  if (!payload) return null;
  const requestId = payload.requestId;
  const placeId = payload.placeId;
  const placeName = payload.placeName;
  const organizationId = payload.organizationId;
  const requestedByUserId = payload.requestedByUserId;

  if (
    typeof requestId !== "string" ||
    typeof placeId !== "string" ||
    typeof placeName !== "string" ||
    typeof organizationId !== "string" ||
    typeof requestedByUserId !== "string"
  ) {
    return null;
  }

  return {
    requestId,
    placeId,
    placeName,
    organizationId,
    organizationName:
      typeof payload.organizationName === "string"
        ? payload.organizationName
        : null,
    requestedByUserId,
    requestNotes:
      typeof payload.requestNotes === "string" ? payload.requestNotes : null,
  };
};

const buildVerificationMessages = (
  payload: VerificationRequestedPayload,
  appUrl: string,
) => {
  const reviewPath = `/admin/verification/${payload.requestId}`;
  const reviewUrl = appUrl ? `${appUrl}${reviewPath}` : reviewPath;

  const subject = `New venue verification request: ${payload.placeName}`;

  const lines = [
    "New venue verification request",
    "",
    `Place: ${payload.placeName}`,
    payload.organizationName
      ? `Organization: ${payload.organizationName}`
      : `Organization ID: ${payload.organizationId}`,
    `Request ID: ${payload.requestId}`,
    `Requested by: ${payload.requestedByUserId}`,
    payload.requestNotes ? `Notes: ${payload.requestNotes}` : "Notes: (none)",
    "",
    `Review: ${reviewUrl}`,
  ];

  const emailText = lines.join("\n");
  const smsText = `Verification request: ${payload.placeName}. Review: ${reviewUrl}`;

  return { subject, emailText, smsText };
};

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const jobRepository = new NotificationDeliveryJobRepository(
    getContainer().db,
  );
  const jobs = await jobRepository.claimBatch({
    limit: BATCH_LIMIT,
    now,
    maxAttempts: MAX_ATTEMPTS,
  });

  if (!jobs.length) {
    return NextResponse.json({
      success: true,
      message: "No notification jobs to process",
      processed: 0,
      timestamp: now.toISOString(),
    });
  }

  const emailService = makeEmailService();
  const smsService = makeSmsService();
  const appUrl = getAppUrl();

  let sentCount = 0;
  let failedCount = 0;
  let skippedCount = 0;

  for (const job of jobs) {
    if (!job.target) {
      skippedCount += 1;
      await jobRepository.update(job.id, {
        status: "SKIPPED",
        lastError: "MISSING_TARGET",
        nextAttemptAt: null,
      });
      continue;
    }

    if (job.eventType !== "place_verification.requested") {
      skippedCount += 1;
      await jobRepository.update(job.id, {
        status: "SKIPPED",
        lastError: `UNSUPPORTED_EVENT_TYPE:${job.eventType}`,
        nextAttemptAt: null,
      });
      continue;
    }

    const payload = parseVerificationPayload(
      job.payload as Record<string, unknown> | null,
    );

    if (!payload) {
      skippedCount += 1;
      await jobRepository.update(job.id, {
        status: "SKIPPED",
        lastError: "INVALID_PAYLOAD",
        nextAttemptAt: null,
      });
      continue;
    }

    const { subject, emailText, smsText } = buildVerificationMessages(
      payload,
      appUrl,
    );

    try {
      const attemptCount = job.attemptCount + 1;
      let providerMessageId: string | undefined;

      if (job.channel === "EMAIL") {
        const result = await emailService.sendEmail({
          from: env.CONTACT_US_FROM_EMAIL,
          to: job.target,
          subject,
          text: emailText,
          headers: {
            "Idempotency-Key": job.idempotencyKey,
          },
        });
        providerMessageId = result.id;
      } else if (job.channel === "SMS") {
        const result = await smsService.sendSms({
          to: job.target,
          message: smsText,
        });
        providerMessageId = result.id;
      } else {
        throw new Error(`Unsupported channel: ${job.channel}`);
      }

      sentCount += 1;
      await jobRepository.update(job.id, {
        status: "SENT",
        attemptCount,
        providerMessageId,
        sentAt: now,
        lastError: null,
        nextAttemptAt: null,
      });
    } catch (error) {
      failedCount += 1;
      const attemptCount = job.attemptCount + 1;
      const message = error instanceof Error ? error.message : "Unknown error";
      const isFinalAttempt = attemptCount >= MAX_ATTEMPTS;
      const backoffIndex = Math.min(
        attemptCount - 1,
        BACKOFF_MINUTES.length - 1,
      );

      await jobRepository.update(job.id, {
        status: "FAILED",
        attemptCount,
        lastError: message,
        nextAttemptAt: isFinalAttempt
          ? null
          : addMinutes(now, BACKOFF_MINUTES[backoffIndex]),
      });

      logger.error(
        {
          event: "notification_delivery.failed",
          jobId: job.id,
          eventType: job.eventType,
          channel: job.channel,
          attemptCount,
          error: message,
        },
        "Notification delivery failed",
      );
    }
  }

  const response = {
    success: failedCount === 0,
    processed: jobs.length,
    sentCount,
    failedCount,
    skippedCount,
    timestamp: now.toISOString(),
  };

  logger.info(
    {
      event: "notification_delivery.dispatch_complete",
      ...response,
    },
    "Notification delivery dispatch completed",
  );

  return NextResponse.json(response);
}

export const dynamic = "force-dynamic";
