import { addMinutes } from "date-fns";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { appRoutes } from "@/common/app-routes";
import { env } from "@/lib/env";
import { MobilePushTokenRepository } from "@/lib/modules/mobile-push-token/repositories/mobile-push-token.repository";
import { NotificationDeliveryJobRepository } from "@/lib/modules/notification-delivery/repositories/notification-delivery-job.repository";
import { PushSubscriptionRepository } from "@/lib/modules/push-subscription/repositories/push-subscription.repository";
import { getContainer } from "@/lib/shared/infra/container";
import { verifyCronAuth } from "@/lib/shared/infra/cron/cron-auth";
import { makeEmailService } from "@/lib/shared/infra/email/email.factory";
import { makeExpoPushService } from "@/lib/shared/infra/expo-push/expo-push.factory";
import { ExpoPushError } from "@/lib/shared/infra/expo-push/expo-push-service";
import { logger } from "@/lib/shared/infra/logger";
import { makeSmsService } from "@/lib/shared/infra/sms/sms.factory";
import { makeWebPushService } from "@/lib/shared/infra/web-push/web-push.factory";
import { WebPushError } from "@/lib/shared/infra/web-push/web-push-service";

const MAX_ATTEMPTS = 5;
const BACKOFF_MINUTES = [1, 5, 15, 60, 360];
const BATCH_LIMIT = 25;

const verificationRequestedSchema = z.object({
  requestId: z.string(),
  placeId: z.string(),
  placeName: z.string(),
  organizationId: z.string(),
  organizationName: z.string().nullable().optional(),
  requestedByUserId: z.string(),
  requestNotes: z.string().nullable().optional(),
});

const reservationCreatedSchema = z.object({
  reservationId: z.string(),
  organizationId: z.string(),
  placeId: z.string(),
  placeName: z.string(),
  courtId: z.string(),
  courtLabel: z.string(),
  startTimeIso: z.string(),
  endTimeIso: z.string(),
  totalPriceCents: z.number(),
  currency: z.string(),
  playerName: z.string(),
  playerEmail: z.string().nullable().optional(),
  playerPhone: z.string().nullable().optional(),
  expiresAtIso: z.string().nullable().optional(),
});

const reservationGroupItemSchema = z.object({
  reservationId: z.string(),
  courtId: z.string(),
  courtLabel: z.string(),
  startTimeIso: z.string(),
  endTimeIso: z.string(),
  totalPriceCents: z.number(),
  currency: z.string(),
  expiresAtIso: z.string().nullable().optional(),
});

const reservationGroupCreatedSchema = z.object({
  reservationGroupId: z.string(),
  representativeReservationId: z.string(),
  organizationId: z.string(),
  placeId: z.string(),
  placeName: z.string(),
  totalPriceCents: z.number(),
  currency: z.string(),
  playerName: z.string(),
  playerEmail: z.string().nullable().optional(),
  playerPhone: z.string().nullable().optional(),
  itemCount: z.number(),
  startTimeIso: z.string(),
  endTimeIso: z.string(),
  expiresAtIso: z.string().nullable().optional(),
  items: z.array(reservationGroupItemSchema),
});

const verificationReviewedSchema = z.object({
  requestId: z.string(),
  organizationId: z.string(),
  placeId: z.string(),
  placeName: z.string(),
  status: z.enum(["APPROVED", "REJECTED"]),
  reviewNotes: z.string().nullable().optional(),
});

const claimReviewedSchema = z.object({
  requestId: z.string(),
  organizationId: z.string(),
  placeId: z.string(),
  placeName: z.string(),
  status: z.enum(["APPROVED", "REJECTED"]),
  reviewNotes: z.string().nullable().optional(),
});

const reservationAwaitingPaymentSchema = z.object({
  reservationId: z.string(),
  placeName: z.string(),
  courtLabel: z.string(),
  startTimeIso: z.string(),
  endTimeIso: z.string(),
  expiresAtIso: z.string().nullable().optional(),
  totalPriceCents: z.number(),
  currency: z.string(),
});

const reservationGroupAwaitingPaymentSchema = z.object({
  reservationGroupId: z.string(),
  representativeReservationId: z.string(),
  placeName: z.string(),
  courtLabel: z.string(),
  startTimeIso: z.string(),
  endTimeIso: z.string(),
  expiresAtIso: z.string().nullable().optional(),
  totalPriceCents: z.number(),
  currency: z.string(),
  itemCount: z.number(),
  items: z.array(reservationGroupItemSchema),
});

const reservationPaymentMarkedSchema = z.object({
  reservationId: z.string(),
  placeName: z.string(),
  courtLabel: z.string(),
  startTimeIso: z.string(),
  endTimeIso: z.string(),
  playerName: z.string(),
});

const reservationGroupPaymentMarkedSchema = z.object({
  reservationGroupId: z.string(),
  representativeReservationId: z.string(),
  organizationId: z.string(),
  placeName: z.string(),
  courtLabel: z.string(),
  startTimeIso: z.string(),
  endTimeIso: z.string(),
  playerName: z.string(),
  itemCount: z.number(),
  items: z.array(reservationGroupItemSchema),
});

const reservationConfirmedSchema = z.object({
  reservationId: z.string(),
  placeName: z.string(),
  courtLabel: z.string(),
  startTimeIso: z.string(),
  endTimeIso: z.string(),
});

const reservationGroupConfirmedSchema = z.object({
  reservationGroupId: z.string(),
  representativeReservationId: z.string(),
  placeName: z.string(),
  courtLabel: z.string(),
  startTimeIso: z.string(),
  endTimeIso: z.string(),
  itemCount: z.number(),
  items: z.array(reservationGroupItemSchema),
});

const reservationRejectedSchema = z.object({
  reservationId: z.string(),
  placeName: z.string(),
  courtLabel: z.string(),
  startTimeIso: z.string(),
  endTimeIso: z.string(),
  reason: z.string().nullable().optional(),
});

const reservationGroupRejectedSchema = z.object({
  reservationGroupId: z.string(),
  representativeReservationId: z.string(),
  placeName: z.string(),
  courtLabel: z.string(),
  startTimeIso: z.string(),
  endTimeIso: z.string(),
  itemCount: z.number(),
  items: z.array(reservationGroupItemSchema),
  reason: z.string().nullable().optional(),
});

const reservationCancelledSchema = z.object({
  reservationId: z.string(),
  placeName: z.string(),
  courtLabel: z.string(),
  startTimeIso: z.string(),
  endTimeIso: z.string(),
  playerName: z.string(),
  reason: z.string().nullable().optional(),
});

const reservationGroupCancelledSchema = z.object({
  reservationGroupId: z.string(),
  representativeReservationId: z.string(),
  organizationId: z.string(),
  placeName: z.string(),
  courtLabel: z.string(),
  startTimeIso: z.string(),
  endTimeIso: z.string(),
  playerName: z.string(),
  itemCount: z.number(),
  items: z.array(reservationGroupItemSchema),
  reason: z.string().nullable().optional(),
});

const testWebPushSchema = z.object({
  title: z.string(),
  body: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  tag: z.string().nullable().optional(),
});

const getAppUrl = (): string => {
  const appUrl = env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  return appUrl ?? "";
};

const parseVerificationPayload = (
  payload: Record<string, unknown> | null | undefined,
) => verificationRequestedSchema.safeParse(payload ?? {});

const parseReservationPayload = (
  payload: Record<string, unknown> | null | undefined,
) => reservationCreatedSchema.safeParse(payload ?? {});

const parseReservationGroupPayload = (
  payload: Record<string, unknown> | null | undefined,
) => reservationGroupCreatedSchema.safeParse(payload ?? {});

const parseVerificationReviewedPayload = (
  payload: Record<string, unknown> | null | undefined,
) => verificationReviewedSchema.safeParse(payload ?? {});

const parseClaimReviewedPayload = (
  payload: Record<string, unknown> | null | undefined,
) => claimReviewedSchema.safeParse(payload ?? {});

const parseReservationAwaitingPaymentPayload = (
  payload: Record<string, unknown> | null | undefined,
) => reservationAwaitingPaymentSchema.safeParse(payload ?? {});

const parseReservationGroupAwaitingPaymentPayload = (
  payload: Record<string, unknown> | null | undefined,
) => reservationGroupAwaitingPaymentSchema.safeParse(payload ?? {});

const parseReservationPaymentMarkedPayload = (
  payload: Record<string, unknown> | null | undefined,
) => reservationPaymentMarkedSchema.safeParse(payload ?? {});

const parseReservationGroupPaymentMarkedPayload = (
  payload: Record<string, unknown> | null | undefined,
) => reservationGroupPaymentMarkedSchema.safeParse(payload ?? {});

const parseReservationConfirmedPayload = (
  payload: Record<string, unknown> | null | undefined,
) => reservationConfirmedSchema.safeParse(payload ?? {});

const parseReservationGroupConfirmedPayload = (
  payload: Record<string, unknown> | null | undefined,
) => reservationGroupConfirmedSchema.safeParse(payload ?? {});

const parseReservationRejectedPayload = (
  payload: Record<string, unknown> | null | undefined,
) => reservationRejectedSchema.safeParse(payload ?? {});

const parseReservationGroupRejectedPayload = (
  payload: Record<string, unknown> | null | undefined,
) => reservationGroupRejectedSchema.safeParse(payload ?? {});

const parseReservationCancelledPayload = (
  payload: Record<string, unknown> | null | undefined,
) => reservationCancelledSchema.safeParse(payload ?? {});

const parseReservationGroupCancelledPayload = (
  payload: Record<string, unknown> | null | undefined,
) => reservationGroupCancelledSchema.safeParse(payload ?? {});

const parseTestWebPushPayload = (
  payload: Record<string, unknown> | null | undefined,
) => testWebPushSchema.safeParse(payload ?? {});

const toLocalCurrency = (totalPriceCents: number, currency: string) => {
  const amount = (totalPriceCents / 100).toFixed(2);
  return `${amount} ${currency}`;
};

const buildVerificationMessages = (
  payload: z.infer<typeof verificationRequestedSchema>,
  appUrl: string,
) => {
  const reviewPath = appRoutes.admin.placeVerification.detail(
    payload.requestId,
  );
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
  const smsText = `KudosCourts: New verification request for ${payload.placeName}. Request ID: ${payload.requestId}. Log in to review.`;

  return { subject, emailText, smsText };
};

const buildReservationCreatedMessages = (
  payload: z.infer<typeof reservationCreatedSchema>,
  appUrl: string,
) => {
  const reservationPath = appRoutes.owner.reservationDetail(
    payload.reservationId,
  );
  const reservationUrl = appUrl
    ? `${appUrl}${reservationPath}`
    : reservationPath;

  const subject = `New reservation: ${payload.placeName} (${payload.courtLabel})`;

  const lines = [
    "New reservation created",
    "",
    `Place: ${payload.placeName}`,
    `Court: ${payload.courtLabel}`,
    `Start: ${payload.startTimeIso}`,
    `End: ${payload.endTimeIso}`,
    `Player: ${payload.playerName}`,
    payload.playerEmail
      ? `Player Email: ${payload.playerEmail}`
      : "Player Email: (none)",
    payload.playerPhone
      ? `Player Phone: ${payload.playerPhone}`
      : "Player Phone: (none)",
    `Total: ${toLocalCurrency(payload.totalPriceCents, payload.currency)}`,
    payload.expiresAtIso
      ? `Owner response due: ${payload.expiresAtIso}`
      : "Owner response due: (not set)",
    "",
    `Review: ${reservationUrl}`,
  ];

  const emailText = lines.join("\n");
  const smsText = `KudosCourts: New reservation at ${payload.placeName} (${payload.courtLabel}) on ${payload.startTimeIso}. Reservation ID: ${payload.reservationId}. Log in to review.`;

  return { subject, emailText, smsText };
};

const buildReservationGroupCreatedMessages = (
  payload: z.infer<typeof reservationGroupCreatedSchema>,
  appUrl: string,
) => {
  const reservationPath = appRoutes.owner.reservationGroupDetail(
    payload.reservationGroupId,
  );
  const reservationUrl = appUrl
    ? `${appUrl}${reservationPath}`
    : reservationPath;

  const subject = `New booking group: ${payload.placeName} (${payload.itemCount} items)`;

  const lines = [
    "New reservation group created",
    "",
    `Place: ${payload.placeName}`,
    `Items: ${payload.itemCount}`,
    `Start: ${payload.startTimeIso}`,
    `End: ${payload.endTimeIso}`,
    `Player: ${payload.playerName}`,
    payload.playerEmail
      ? `Player Email: ${payload.playerEmail}`
      : "Player Email: (none)",
    payload.playerPhone
      ? `Player Phone: ${payload.playerPhone}`
      : "Player Phone: (none)",
    `Total: ${toLocalCurrency(payload.totalPriceCents, payload.currency)}`,
    payload.expiresAtIso
      ? `Owner response due: ${payload.expiresAtIso}`
      : "Owner response due: (not set)",
    "",
    `Review: ${reservationUrl}`,
  ];

  const emailText = lines.join("\n");
  const smsText = `KudosCourts: New booking group at ${payload.placeName} (${payload.itemCount} items). Group ID: ${payload.reservationGroupId}. Log in to review.`;

  return { subject, emailText, smsText };
};

const buildVerificationReviewedMessages = (
  payload: z.infer<typeof verificationReviewedSchema>,
  appUrl: string,
) => {
  const verifyPath = appRoutes.owner.verification.place(payload.placeId);
  const verifyUrl = appUrl ? `${appUrl}${verifyPath}` : verifyPath;
  const statusLabel = payload.status === "APPROVED" ? "approved" : "rejected";

  const subject = `Venue verification ${statusLabel}: ${payload.placeName}`;

  const lines = [
    `Venue verification ${statusLabel}`,
    "",
    `Place: ${payload.placeName}`,
    `Request ID: ${payload.requestId}`,
    payload.reviewNotes ? `Notes: ${payload.reviewNotes}` : "Notes: (none)",
    "",
    `Details: ${verifyUrl}`,
  ];

  const emailText = lines.join("\n");
  const smsText = `KudosCourts: Verification ${statusLabel} for ${payload.placeName}. Request ID: ${payload.requestId}. Log in for details.`;

  return { subject, emailText, smsText };
};

const buildClaimReviewedMessages = (
  payload: z.infer<typeof claimReviewedSchema>,
  appUrl: string,
) => {
  const ownerPlacesPath = appRoutes.owner.places.base;
  const ownerPlacesUrl = appUrl
    ? `${appUrl}${ownerPlacesPath}`
    : ownerPlacesPath;
  const statusLabel = payload.status === "APPROVED" ? "approved" : "rejected";

  const subject = `Ownership claim ${statusLabel}: ${payload.placeName}`;

  const lines = [
    `Ownership claim ${statusLabel}`,
    "",
    `Place: ${payload.placeName}`,
    `Request ID: ${payload.requestId}`,
    payload.reviewNotes ? `Notes: ${payload.reviewNotes}` : "Notes: (none)",
    "",
    `Manage your venues: ${ownerPlacesUrl}`,
  ];

  const emailText = lines.join("\n");
  const smsText = `KudosCourts: Ownership claim ${statusLabel} for ${payload.placeName}. Request ID: ${payload.requestId}. Log in for details.`;

  return { subject, emailText, smsText };
};

export async function GET(request: NextRequest) {
  const now = new Date();
  logger.info(
    {
      event: "notification_delivery.dispatch_started",
      path: request.nextUrl.pathname,
    },
    "Notification delivery dispatch started",
  );

  try {
    const auth = verifyCronAuth(request);
    if (!auth.ok) {
      const status = auth.response.status;
      const authEvent = {
        event: "notification_delivery.dispatch_auth_failed",
        status,
        hasCronSecret: Boolean(process.env.CRON_SECRET),
      };

      if (status >= 500) {
        logger.error(authEvent, "Notification delivery dispatch auth failed");
      } else {
        logger.warn(authEvent, "Notification delivery dispatch auth failed");
      }

      return auth.response;
    }

    const jobRepository = new NotificationDeliveryJobRepository(
      getContainer().db,
    );
    const pushSubscriptionRepository = new PushSubscriptionRepository(
      getContainer().db,
    );
    const mobilePushTokenRepository = new MobilePushTokenRepository(
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

    const emailEnabled = env.NOTIFICATION_EMAIL_ENABLED !== false;
    const smsEnabled = env.NOTIFICATION_SMS_ENABLED !== false;
    const webPushEnabled = env.NOTIFICATION_WEB_PUSH_ENABLED !== false;
    const mobilePushEnabled = env.NOTIFICATION_MOBILE_PUSH_ENABLED !== false;

    let emailService: ReturnType<typeof makeEmailService> | null = null;
    let smsService: ReturnType<typeof makeSmsService> | null = null;
    let webPushService: ReturnType<typeof makeWebPushService> | null = null;
    let expoPushService: ReturnType<typeof makeExpoPushService> | null = null;
    let emailServiceInitError: string | null = null;
    let smsServiceInitError: string | null = null;
    let webPushServiceInitError: string | null = null;
    let expoPushServiceInitError: string | null = null;

    if (emailEnabled) {
      try {
        emailService = makeEmailService();
      } catch (error) {
        emailServiceInitError =
          error instanceof Error ? error.message : "Unknown error";
        logger.error(
          {
            event: "notification_delivery.channel_init_failed",
            channel: "EMAIL",
            error: emailServiceInitError,
          },
          "Email service initialization failed",
        );
      }
    }

    if (smsEnabled) {
      try {
        smsService = makeSmsService();
      } catch (error) {
        smsServiceInitError =
          error instanceof Error ? error.message : "Unknown error";
        logger.error(
          {
            event: "notification_delivery.channel_init_failed",
            channel: "SMS",
            error: smsServiceInitError,
          },
          "SMS service initialization failed",
        );
      }
    }

    if (webPushEnabled) {
      try {
        webPushService = makeWebPushService();
      } catch (error) {
        webPushServiceInitError =
          error instanceof Error ? error.message : "Unknown error";
        logger.error(
          {
            event: "notification_delivery.channel_init_failed",
            channel: "WEB_PUSH",
            error: webPushServiceInitError,
          },
          "Web Push service initialization failed",
        );
      }
    }

    if (mobilePushEnabled) {
      try {
        expoPushService = makeExpoPushService();
      } catch (error) {
        expoPushServiceInitError =
          error instanceof Error ? error.message : "Unknown error";
        logger.error(
          {
            event: "notification_delivery.channel_init_failed",
            channel: "MOBILE_PUSH",
            error: expoPushServiceInitError,
          },
          "Expo Push service initialization failed",
        );
      }
    }

    const appUrl = getAppUrl();

    let sentCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    for (const job of jobs) {
      if (job.channel === "EMAIL" && !emailEnabled) {
        skippedCount += 1;
        await jobRepository.update(job.id, {
          status: "SKIPPED",
          lastError: "DISABLED_CHANNEL:EMAIL",
          nextAttemptAt: null,
        });
        continue;
      }

      if (job.channel === "SMS" && !smsEnabled) {
        skippedCount += 1;
        await jobRepository.update(job.id, {
          status: "SKIPPED",
          lastError: "DISABLED_CHANNEL:SMS",
          nextAttemptAt: null,
        });
        continue;
      }

      if (job.channel === "WEB_PUSH" && !webPushEnabled) {
        skippedCount += 1;
        await jobRepository.update(job.id, {
          status: "SKIPPED",
          lastError: "DISABLED_CHANNEL:WEB_PUSH",
          nextAttemptAt: null,
        });
        continue;
      }

      if (job.channel === "MOBILE_PUSH" && !mobilePushEnabled) {
        skippedCount += 1;
        await jobRepository.update(job.id, {
          status: "SKIPPED",
          lastError: "DISABLED_CHANNEL:MOBILE_PUSH",
          nextAttemptAt: null,
        });
        continue;
      }

      if (!job.target) {
        skippedCount += 1;
        await jobRepository.update(job.id, {
          status: "SKIPPED",
          lastError: "MISSING_TARGET",
          nextAttemptAt: null,
        });
        continue;
      }

      let subject: string | null = null;
      let emailText: string | null = null;
      let smsText: string | null = null;
      let pushTitle: string | null = null;
      let pushBody: string | null = null;
      let pushUrl: string | null = null;
      let pushTag: string | null = null;

      if (job.eventType === "place_verification.requested") {
        const parsed = parseVerificationPayload(
          job.payload as Record<string, unknown> | null,
        );

        if (!parsed.success) {
          skippedCount += 1;
          await jobRepository.update(job.id, {
            status: "SKIPPED",
            lastError: "INVALID_PAYLOAD",
            nextAttemptAt: null,
          });
          continue;
        }

        const messages = buildVerificationMessages(parsed.data, appUrl);
        subject = messages.subject;
        emailText = messages.emailText;
        smsText = messages.smsText;
        pushTitle = "New venue verification request";
        pushBody = `${parsed.data.placeName} needs review`;
        pushUrl = appRoutes.admin.placeVerification.detail(
          parsed.data.requestId,
        );
        pushTag = `place_verification.requested:${parsed.data.requestId}`;
      } else if (job.eventType === "reservation.created") {
        const parsed = parseReservationPayload(
          job.payload as Record<string, unknown> | null,
        );

        if (!parsed.success) {
          skippedCount += 1;
          await jobRepository.update(job.id, {
            status: "SKIPPED",
            lastError: "INVALID_PAYLOAD",
            nextAttemptAt: null,
          });
          continue;
        }

        const messages = buildReservationCreatedMessages(parsed.data, appUrl);
        subject = messages.subject;
        emailText = messages.emailText;
        smsText = messages.smsText;
        pushTitle = "New reservation";
        pushBody = `${parsed.data.placeName} (${parsed.data.courtLabel})`;
        pushUrl = appRoutes.owner.reservationDetail(parsed.data.reservationId);
        pushTag = `reservation.created:${parsed.data.reservationId}`;
      } else if (job.eventType === "reservation_group.created") {
        const parsed = parseReservationGroupPayload(
          job.payload as Record<string, unknown> | null,
        );

        if (!parsed.success) {
          skippedCount += 1;
          await jobRepository.update(job.id, {
            status: "SKIPPED",
            lastError: "INVALID_PAYLOAD",
            nextAttemptAt: null,
          });
          continue;
        }

        const messages = buildReservationGroupCreatedMessages(
          parsed.data,
          appUrl,
        );
        subject = messages.subject;
        emailText = messages.emailText;
        smsText = messages.smsText;
        pushTitle = "New booking group";
        pushBody = `${parsed.data.placeName} (${parsed.data.itemCount} items)`;
        pushUrl = appRoutes.owner.reservationGroupDetail(
          parsed.data.reservationGroupId,
        );
        pushTag = `reservation_group.created:${parsed.data.reservationGroupId}`;
      } else if (
        job.eventType === "place_verification.approved" ||
        job.eventType === "place_verification.rejected"
      ) {
        const parsed = parseVerificationReviewedPayload(
          job.payload as Record<string, unknown> | null,
        );

        if (!parsed.success) {
          skippedCount += 1;
          await jobRepository.update(job.id, {
            status: "SKIPPED",
            lastError: "INVALID_PAYLOAD",
            nextAttemptAt: null,
          });
          continue;
        }

        const messages = buildVerificationReviewedMessages(parsed.data, appUrl);
        subject = messages.subject;
        emailText = messages.emailText;
        smsText = messages.smsText;
        const statusLabel =
          parsed.data.status === "APPROVED" ? "approved" : "rejected";
        pushTitle = `Verification ${statusLabel}`;
        pushBody = parsed.data.placeName;
        pushUrl = appRoutes.owner.verification.place(parsed.data.placeId);
        pushTag = `${job.eventType}:${parsed.data.requestId}`;
      } else if (
        job.eventType === "claim_request.approved" ||
        job.eventType === "claim_request.rejected"
      ) {
        const parsed = parseClaimReviewedPayload(
          job.payload as Record<string, unknown> | null,
        );

        if (!parsed.success) {
          skippedCount += 1;
          await jobRepository.update(job.id, {
            status: "SKIPPED",
            lastError: "INVALID_PAYLOAD",
            nextAttemptAt: null,
          });
          continue;
        }

        const messages = buildClaimReviewedMessages(parsed.data, appUrl);
        subject = messages.subject;
        emailText = messages.emailText;
        smsText = messages.smsText;
        const statusLabel =
          parsed.data.status === "APPROVED" ? "approved" : "rejected";
        pushTitle = `Claim ${statusLabel}`;
        pushBody = parsed.data.placeName;
        pushUrl = appRoutes.owner.places.base;
        pushTag = `${job.eventType}:${parsed.data.requestId}`;
      } else if (job.eventType === "reservation.awaiting_payment") {
        const parsed = parseReservationAwaitingPaymentPayload(
          job.payload as Record<string, unknown> | null,
        );
        if (!parsed.success) {
          skippedCount += 1;
          await jobRepository.update(job.id, {
            status: "SKIPPED",
            lastError: "INVALID_PAYLOAD",
            nextAttemptAt: null,
          });
          continue;
        }
        pushTitle = "Payment needed";
        pushBody = `${parsed.data.placeName} (${parsed.data.courtLabel})`;
        pushUrl = appRoutes.reservations.detail(parsed.data.reservationId);
        pushTag = `reservation.awaiting_payment:${parsed.data.reservationId}`;
      } else if (job.eventType === "reservation_group.awaiting_payment") {
        const parsed = parseReservationGroupAwaitingPaymentPayload(
          job.payload as Record<string, unknown> | null,
        );
        if (!parsed.success) {
          skippedCount += 1;
          await jobRepository.update(job.id, {
            status: "SKIPPED",
            lastError: "INVALID_PAYLOAD",
            nextAttemptAt: null,
          });
          continue;
        }
        pushTitle = "Payment needed";
        pushBody = `${parsed.data.placeName} (${parsed.data.itemCount} items)`;
        pushUrl = appRoutes.reservations.payment(
          parsed.data.representativeReservationId,
        );
        pushTag = `reservation_group.awaiting_payment:${parsed.data.reservationGroupId}`;
      } else if (job.eventType === "reservation.payment_marked") {
        const parsed = parseReservationPaymentMarkedPayload(
          job.payload as Record<string, unknown> | null,
        );
        if (!parsed.success) {
          skippedCount += 1;
          await jobRepository.update(job.id, {
            status: "SKIPPED",
            lastError: "INVALID_PAYLOAD",
            nextAttemptAt: null,
          });
          continue;
        }
        pushTitle = "Payment marked";
        pushBody = `${parsed.data.playerName} marked payment for ${parsed.data.placeName}`;
        pushUrl = appRoutes.owner.reservationDetail(parsed.data.reservationId);
        pushTag = `reservation.payment_marked:${parsed.data.reservationId}`;
      } else if (job.eventType === "reservation_group.payment_marked") {
        const parsed = parseReservationGroupPaymentMarkedPayload(
          job.payload as Record<string, unknown> | null,
        );
        if (!parsed.success) {
          skippedCount += 1;
          await jobRepository.update(job.id, {
            status: "SKIPPED",
            lastError: "INVALID_PAYLOAD",
            nextAttemptAt: null,
          });
          continue;
        }
        pushTitle = "Payment marked";
        pushBody = `${parsed.data.playerName} marked payment for ${parsed.data.placeName}`;
        pushUrl = appRoutes.owner.reservationGroupDetail(
          parsed.data.reservationGroupId,
        );
        pushTag = `reservation_group.payment_marked:${parsed.data.reservationGroupId}`;
      } else if (job.eventType === "reservation.confirmed") {
        const parsed = parseReservationConfirmedPayload(
          job.payload as Record<string, unknown> | null,
        );
        if (!parsed.success) {
          skippedCount += 1;
          await jobRepository.update(job.id, {
            status: "SKIPPED",
            lastError: "INVALID_PAYLOAD",
            nextAttemptAt: null,
          });
          continue;
        }
        pushTitle = "Reservation confirmed";
        pushBody = `${parsed.data.placeName} (${parsed.data.courtLabel})`;
        pushUrl = appRoutes.reservations.detail(parsed.data.reservationId);
        pushTag = `reservation.confirmed:${parsed.data.reservationId}`;
      } else if (job.eventType === "reservation_group.confirmed") {
        const parsed = parseReservationGroupConfirmedPayload(
          job.payload as Record<string, unknown> | null,
        );
        if (!parsed.success) {
          skippedCount += 1;
          await jobRepository.update(job.id, {
            status: "SKIPPED",
            lastError: "INVALID_PAYLOAD",
            nextAttemptAt: null,
          });
          continue;
        }
        pushTitle = "Reservation group confirmed";
        pushBody = `${parsed.data.placeName} (${parsed.data.itemCount} items)`;
        pushUrl = appRoutes.reservations.detail(
          parsed.data.representativeReservationId,
        );
        pushTag = `reservation_group.confirmed:${parsed.data.reservationGroupId}`;
      } else if (job.eventType === "reservation.rejected") {
        const parsed = parseReservationRejectedPayload(
          job.payload as Record<string, unknown> | null,
        );
        if (!parsed.success) {
          skippedCount += 1;
          await jobRepository.update(job.id, {
            status: "SKIPPED",
            lastError: "INVALID_PAYLOAD",
            nextAttemptAt: null,
          });
          continue;
        }
        pushTitle = "Reservation rejected";
        pushBody = parsed.data.placeName;
        pushUrl = appRoutes.reservations.detail(parsed.data.reservationId);
        pushTag = `reservation.rejected:${parsed.data.reservationId}`;
      } else if (job.eventType === "reservation_group.rejected") {
        const parsed = parseReservationGroupRejectedPayload(
          job.payload as Record<string, unknown> | null,
        );
        if (!parsed.success) {
          skippedCount += 1;
          await jobRepository.update(job.id, {
            status: "SKIPPED",
            lastError: "INVALID_PAYLOAD",
            nextAttemptAt: null,
          });
          continue;
        }
        pushTitle = "Reservation group rejected";
        pushBody = parsed.data.placeName;
        pushUrl = appRoutes.reservations.detail(
          parsed.data.representativeReservationId,
        );
        pushTag = `reservation_group.rejected:${parsed.data.reservationGroupId}`;
      } else if (job.eventType === "reservation.cancelled") {
        const parsed = parseReservationCancelledPayload(
          job.payload as Record<string, unknown> | null,
        );
        if (!parsed.success) {
          skippedCount += 1;
          await jobRepository.update(job.id, {
            status: "SKIPPED",
            lastError: "INVALID_PAYLOAD",
            nextAttemptAt: null,
          });
          continue;
        }
        pushTitle = "Reservation cancelled";
        pushBody = `${parsed.data.playerName} cancelled ${parsed.data.placeName}`;
        pushUrl = appRoutes.owner.reservationDetail(parsed.data.reservationId);
        pushTag = `reservation.cancelled:${parsed.data.reservationId}`;
      } else if (job.eventType === "reservation_group.cancelled") {
        const parsed = parseReservationGroupCancelledPayload(
          job.payload as Record<string, unknown> | null,
        );
        if (!parsed.success) {
          skippedCount += 1;
          await jobRepository.update(job.id, {
            status: "SKIPPED",
            lastError: "INVALID_PAYLOAD",
            nextAttemptAt: null,
          });
          continue;
        }
        pushTitle = "Reservation group cancelled";
        pushBody = `${parsed.data.playerName} cancelled ${parsed.data.placeName}`;
        pushUrl = appRoutes.owner.reservationGroupDetail(
          parsed.data.reservationGroupId,
        );
        pushTag = `reservation_group.cancelled:${parsed.data.reservationGroupId}`;
      } else if (job.eventType === "test.web_push") {
        const parsed = parseTestWebPushPayload(
          job.payload as Record<string, unknown> | null,
        );
        if (!parsed.success) {
          skippedCount += 1;
          await jobRepository.update(job.id, {
            status: "SKIPPED",
            lastError: "INVALID_PAYLOAD",
            nextAttemptAt: null,
          });
          continue;
        }
        pushTitle = parsed.data.title;
        pushBody = parsed.data.body ?? null;
        pushUrl = parsed.data.url ?? null;
        pushTag = parsed.data.tag ?? null;
      } else {
        skippedCount += 1;
        await jobRepository.update(job.id, {
          status: "SKIPPED",
          lastError: `UNSUPPORTED_EVENT_TYPE:${job.eventType}`,
          nextAttemptAt: null,
        });
        continue;
      }

      try {
        const attemptCount = job.attemptCount + 1;
        let providerMessageId: string | undefined;

        if (job.channel === "EMAIL") {
          if (emailServiceInitError) {
            throw new Error(
              `EMAIL_SERVICE_INIT_FAILED:${emailServiceInitError}`,
            );
          }
          if (!emailService) {
            throw new Error("Email service is disabled");
          }
          if (!subject || !emailText) {
            throw new Error("MISSING_EMAIL_CONTENT");
          }
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
          if (smsServiceInitError) {
            throw new Error(`SMS_SERVICE_INIT_FAILED:${smsServiceInitError}`);
          }
          if (!smsService) {
            throw new Error("SMS service is disabled");
          }
          if (!smsText) {
            throw new Error("MISSING_SMS_CONTENT");
          }
          const result = await smsService.sendSms({
            to: job.target,
            message: smsText,
          });
          providerMessageId = result.id;
        } else if (job.channel === "WEB_PUSH") {
          if (webPushServiceInitError) {
            throw new Error(
              `WEB_PUSH_SERVICE_INIT_FAILED:${webPushServiceInitError}`,
            );
          }
          if (!webPushService) {
            throw new Error("Web Push service is disabled");
          }

          const subscription = await pushSubscriptionRepository.findById(
            job.target,
          );
          if (!subscription || subscription.revokedAt) {
            skippedCount += 1;
            await jobRepository.update(job.id, {
              status: "SKIPPED",
              attemptCount,
              lastError: subscription
                ? "SUBSCRIPTION_REVOKED"
                : "MISSING_SUBSCRIPTION",
              nextAttemptAt: null,
            });
            continue;
          }

          if (!pushTitle) {
            throw new Error("MISSING_WEB_PUSH_CONTENT");
          }

          const result = await webPushService.sendNotification({
            subscription: {
              endpoint: subscription.endpoint,
              expirationTime: subscription.expirationTime,
              keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth,
              },
            },
            payload: {
              title: pushTitle,
              body: pushBody ?? undefined,
              icon: "/logo.png",
              url: pushUrl ?? undefined,
              tag: pushTag ?? undefined,
              data: {
                url: pushUrl ?? null,
                eventType: job.eventType,
              },
            },
            options: {
              ttlSeconds: 60 * 60,
              urgency: "high",
            },
          });

          providerMessageId = `HTTP:${result.statusCode}`;
        } else if (job.channel === "MOBILE_PUSH") {
          if (expoPushServiceInitError) {
            throw new Error(
              `MOBILE_PUSH_SERVICE_INIT_FAILED:${expoPushServiceInitError}`,
            );
          }
          if (!expoPushService) {
            throw new Error("Expo Push service is disabled");
          }

          const mobilePushToken = await mobilePushTokenRepository.findById(
            job.target,
          );
          if (!mobilePushToken || mobilePushToken.revokedAt) {
            skippedCount += 1;
            await jobRepository.update(job.id, {
              status: "SKIPPED",
              attemptCount,
              lastError: mobilePushToken
                ? "MOBILE_PUSH_TOKEN_REVOKED"
                : "MISSING_MOBILE_PUSH_TOKEN",
              nextAttemptAt: null,
            });
            continue;
          }

          if (!pushTitle) {
            throw new Error("MISSING_MOBILE_PUSH_CONTENT");
          }

          const result = await expoPushService.sendPush({
            to: mobilePushToken.token,
            title: pushTitle,
            body: pushBody ?? undefined,
            sound: "default",
            data: {
              url: pushUrl ?? null,
              eventType: job.eventType,
            },
          });

          providerMessageId = result.ticketId;
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
        const message =
          error instanceof Error ? error.message : "Unknown error";

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

        if (error instanceof WebPushError) {
          const status = error.statusCode;
          if (status === 404 || status === 410) {
            skippedCount += 1;
            failedCount -= 1;

            try {
              await pushSubscriptionRepository.revokeById(job.target);
              await jobRepository.update(job.id, {
                status: "SKIPPED",
                attemptCount,
                lastError: "SUBSCRIPTION_GONE",
                nextAttemptAt: null,
              });
            } catch (persistenceError) {
              const persistenceMessage =
                persistenceError instanceof Error
                  ? persistenceError.message
                  : "Unknown persistence error";

              logger.error(
                {
                  event: "notification_delivery.persistence_failed",
                  jobId: job.id,
                  channel: job.channel,
                  error: persistenceMessage,
                },
                "Failed to persist web push revocation result",
              );

              throw persistenceError;
            }

            continue;
          }
        }

        if (error instanceof ExpoPushError) {
          if (error.code === "DeviceNotRegistered") {
            skippedCount += 1;
            failedCount -= 1;

            try {
              await mobilePushTokenRepository.revokeById(job.target);
              await jobRepository.update(job.id, {
                status: "SKIPPED",
                attemptCount,
                lastError: "MOBILE_PUSH_TOKEN_NOT_REGISTERED",
                nextAttemptAt: null,
              });
            } catch (persistenceError) {
              const persistenceMessage =
                persistenceError instanceof Error
                  ? persistenceError.message
                  : "Unknown persistence error";

              logger.error(
                {
                  event: "notification_delivery.persistence_failed",
                  jobId: job.id,
                  channel: job.channel,
                  error: persistenceMessage,
                },
                "Failed to persist mobile push revocation result",
              );

              throw persistenceError;
            }

            continue;
          }
        }

        const isFinalAttempt = attemptCount >= MAX_ATTEMPTS;
        const backoffIndex = Math.min(
          attemptCount - 1,
          BACKOFF_MINUTES.length - 1,
        );

        try {
          await jobRepository.update(job.id, {
            status: "FAILED",
            attemptCount,
            lastError: message,
            nextAttemptAt: isFinalAttempt
              ? null
              : addMinutes(now, BACKOFF_MINUTES[backoffIndex]),
          });
        } catch (persistenceError) {
          const persistenceMessage =
            persistenceError instanceof Error
              ? persistenceError.message
              : "Unknown persistence error";

          logger.error(
            {
              event: "notification_delivery.persistence_failed",
              jobId: job.id,
              channel: job.channel,
              error: persistenceMessage,
            },
            "Failed to persist notification failure state",
          );

          throw persistenceError;
        }
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
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    logger.error(
      {
        event: "notification_delivery.dispatch_failed",
        error: message,
      },
      "Notification delivery dispatch failed",
    );

    return NextResponse.json(
      {
        success: false,
        error: message,
        timestamp: now.toISOString(),
      },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
