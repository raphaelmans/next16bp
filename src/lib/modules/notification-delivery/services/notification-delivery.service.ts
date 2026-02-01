import { normalizePhMobile } from "@/common/phone";
import { env } from "@/lib/env";
import type { InsertNotificationDeliveryJob } from "@/lib/shared/infra/db/schema";
import { logger } from "@/lib/shared/infra/logger";
import type { RequestContext } from "@/lib/shared/kernel/context";
import type { INotificationDeliveryJobRepository } from "../repositories/notification-delivery-job.repository";
import type { INotificationRecipientRepository } from "../repositories/notification-recipient.repository";

export type AdminVerificationRequestedPayload = {
  requestId: string;
  placeId: string;
  placeName: string;
  organizationId: string;
  organizationName?: string | null;
  requestedByUserId: string;
  requestNotes?: string | null;
};

export type OwnerReservationCreatedPayload = {
  reservationId: string;
  organizationId: string;
  placeId: string;
  placeName: string;
  courtId: string;
  courtLabel: string;
  startTimeIso: string;
  endTimeIso: string;
  totalPriceCents: number;
  currency: string;
  playerName: string;
  playerEmail?: string | null;
  playerPhone?: string | null;
  expiresAtIso?: string | null;
};

export type OwnerPlaceVerificationReviewedPayload = {
  requestId: string;
  organizationId: string;
  placeId: string;
  placeName: string;
  status: "APPROVED" | "REJECTED";
  reviewNotes?: string | null;
};

export type OwnerClaimReviewedPayload = {
  requestId: string;
  organizationId: string;
  placeId: string;
  placeName: string;
  status: "APPROVED" | "REJECTED";
  reviewNotes?: string | null;
};

export class NotificationDeliveryService {
  constructor(
    private jobRepository: INotificationDeliveryJobRepository,
    private recipientRepository: INotificationRecipientRepository,
  ) {}

  async enqueueAdminVerificationRequested(
    payload: AdminVerificationRequestedPayload,
    ctx?: RequestContext,
  ): Promise<{ jobCount: number; recipientCount: number }> {
    const recipients = await this.recipientRepository.findAdminRecipients(ctx);

    const jobs: InsertNotificationDeliveryJob[] = [];
    const basePayload = {
      requestId: payload.requestId,
      placeId: payload.placeId,
      placeName: payload.placeName,
      organizationId: payload.organizationId,
      organizationName: payload.organizationName ?? null,
      requestedByUserId: payload.requestedByUserId,
      requestNotes: payload.requestNotes ?? null,
    };

    for (const recipient of recipients) {
      const email = recipient.email?.trim();
      if (env.NOTIFICATION_EMAIL_ENABLED !== false && email) {
        jobs.push({
          eventType: "place_verification.requested",
          channel: "EMAIL",
          target: email,
          organizationId: payload.organizationId,
          placeVerificationRequestId: payload.requestId,
          payload: basePayload,
          idempotencyKey: `place_verification.requested:${payload.requestId}:admin:${recipient.userId}:email`,
        });
      }

      const normalizedPhone = recipient.phoneNumber
        ? normalizePhMobile(recipient.phoneNumber)
        : "";
      if (env.NOTIFICATION_SMS_ENABLED !== false && normalizedPhone) {
        jobs.push({
          eventType: "place_verification.requested",
          channel: "SMS",
          target: normalizedPhone,
          organizationId: payload.organizationId,
          placeVerificationRequestId: payload.requestId,
          payload: basePayload,
          idempotencyKey: `place_verification.requested:${payload.requestId}:admin:${recipient.userId}:sms`,
        });
      }
    }

    if (!jobs.length) {
      logger.warn(
        {
          event: "notification_delivery.no_admin_recipients",
          requestId: payload.requestId,
          placeId: payload.placeId,
          organizationId: payload.organizationId,
          recipientCount: recipients.length,
        },
        "No admin recipients found for verification request",
      );
      return { jobCount: 0, recipientCount: recipients.length };
    }

    await this.jobRepository.createMany(jobs, ctx);

    logger.info(
      {
        event: "notification_delivery.jobs_enqueued",
        eventType: "place_verification.requested",
        requestId: payload.requestId,
        organizationId: payload.organizationId,
        jobCount: jobs.length,
        recipientCount: recipients.length,
      },
      "Enqueued admin verification notification jobs",
    );

    return { jobCount: jobs.length, recipientCount: recipients.length };
  }

  async enqueueOwnerReservationCreated(
    payload: OwnerReservationCreatedPayload,
    ctx?: RequestContext,
  ): Promise<{ jobCount: number }> {
    const recipient =
      await this.recipientRepository.findOwnerRecipientByOrganizationId(
        payload.organizationId,
        ctx,
      );

    if (!recipient) {
      logger.warn(
        {
          event: "notification_delivery.no_owner_recipient",
          eventType: "reservation.created",
          reservationId: payload.reservationId,
          organizationId: payload.organizationId,
        },
        "No owner recipient found for reservation.created",
      );
      return { jobCount: 0 };
    }

    const jobs: InsertNotificationDeliveryJob[] = [];
    const basePayload = {
      reservationId: payload.reservationId,
      organizationId: payload.organizationId,
      placeId: payload.placeId,
      placeName: payload.placeName,
      courtId: payload.courtId,
      courtLabel: payload.courtLabel,
      startTimeIso: payload.startTimeIso,
      endTimeIso: payload.endTimeIso,
      totalPriceCents: payload.totalPriceCents,
      currency: payload.currency,
      playerName: payload.playerName,
      playerEmail: payload.playerEmail ?? null,
      playerPhone: payload.playerPhone ?? null,
      expiresAtIso: payload.expiresAtIso ?? null,
    };

    const email = recipient.email?.trim();
    if (env.NOTIFICATION_EMAIL_ENABLED !== false && email) {
      jobs.push({
        eventType: "reservation.created",
        channel: "EMAIL",
        target: email,
        organizationId: payload.organizationId,
        reservationId: payload.reservationId,
        payload: basePayload,
        idempotencyKey: `reservation.created:${payload.reservationId}:org:${payload.organizationId}:email`,
      });
    }

    const normalizedPhone = recipient.phoneNumber
      ? normalizePhMobile(recipient.phoneNumber)
      : "";
    if (env.NOTIFICATION_SMS_ENABLED !== false && normalizedPhone) {
      jobs.push({
        eventType: "reservation.created",
        channel: "SMS",
        target: normalizedPhone,
        organizationId: payload.organizationId,
        reservationId: payload.reservationId,
        payload: basePayload,
        idempotencyKey: `reservation.created:${payload.reservationId}:org:${payload.organizationId}:sms`,
      });
    }

    if (!jobs.length) {
      logger.warn(
        {
          event: "notification_delivery.no_owner_contact",
          eventType: "reservation.created",
          reservationId: payload.reservationId,
          organizationId: payload.organizationId,
        },
        "Owner has no email/phone for reservation.created",
      );
      return { jobCount: 0 };
    }

    await this.jobRepository.createMany(jobs, ctx);

    logger.info(
      {
        event: "notification_delivery.jobs_enqueued",
        eventType: "reservation.created",
        reservationId: payload.reservationId,
        organizationId: payload.organizationId,
        jobCount: jobs.length,
      },
      "Enqueued owner reservation.created notification jobs",
    );

    return { jobCount: jobs.length };
  }

  async enqueueOwnerPlaceVerificationReviewed(
    payload: OwnerPlaceVerificationReviewedPayload,
    ctx?: RequestContext,
  ): Promise<{ jobCount: number }> {
    const recipient =
      await this.recipientRepository.findOwnerRecipientByOrganizationId(
        payload.organizationId,
        ctx,
      );

    if (!recipient) {
      logger.warn(
        {
          event: "notification_delivery.no_owner_recipient",
          eventType: `place_verification.${payload.status.toLowerCase()}`,
          requestId: payload.requestId,
          organizationId: payload.organizationId,
        },
        "No owner recipient found for place verification review",
      );
      return { jobCount: 0 };
    }

    const eventType =
      payload.status === "APPROVED"
        ? "place_verification.approved"
        : "place_verification.rejected";

    const jobs: InsertNotificationDeliveryJob[] = [];
    const basePayload = {
      requestId: payload.requestId,
      organizationId: payload.organizationId,
      placeId: payload.placeId,
      placeName: payload.placeName,
      status: payload.status,
      reviewNotes: payload.reviewNotes ?? null,
    };

    const email = recipient.email?.trim();
    if (env.NOTIFICATION_EMAIL_ENABLED !== false && email) {
      jobs.push({
        eventType,
        channel: "EMAIL",
        target: email,
        organizationId: payload.organizationId,
        placeVerificationRequestId: payload.requestId,
        payload: basePayload,
        idempotencyKey: `${eventType}:${payload.requestId}:org:${payload.organizationId}:email`,
      });
    }

    const normalizedPhone = recipient.phoneNumber
      ? normalizePhMobile(recipient.phoneNumber)
      : "";
    if (env.NOTIFICATION_SMS_ENABLED !== false && normalizedPhone) {
      jobs.push({
        eventType,
        channel: "SMS",
        target: normalizedPhone,
        organizationId: payload.organizationId,
        placeVerificationRequestId: payload.requestId,
        payload: basePayload,
        idempotencyKey: `${eventType}:${payload.requestId}:org:${payload.organizationId}:sms`,
      });
    }

    if (!jobs.length) {
      logger.warn(
        {
          event: "notification_delivery.no_owner_contact",
          eventType,
          requestId: payload.requestId,
          organizationId: payload.organizationId,
        },
        "Owner has no email/phone for place verification review",
      );
      return { jobCount: 0 };
    }

    await this.jobRepository.createMany(jobs, ctx);

    logger.info(
      {
        event: "notification_delivery.jobs_enqueued",
        eventType,
        requestId: payload.requestId,
        organizationId: payload.organizationId,
        jobCount: jobs.length,
      },
      "Enqueued owner place verification review notification jobs",
    );

    return { jobCount: jobs.length };
  }

  async enqueueOwnerClaimReviewed(
    payload: OwnerClaimReviewedPayload,
    ctx?: RequestContext,
  ): Promise<{ jobCount: number }> {
    const recipient =
      await this.recipientRepository.findOwnerRecipientByOrganizationId(
        payload.organizationId,
        ctx,
      );

    if (!recipient) {
      logger.warn(
        {
          event: "notification_delivery.no_owner_recipient",
          eventType: `claim_request.${payload.status.toLowerCase()}`,
          requestId: payload.requestId,
          organizationId: payload.organizationId,
        },
        "No owner recipient found for claim request review",
      );
      return { jobCount: 0 };
    }

    const eventType =
      payload.status === "APPROVED"
        ? "claim_request.approved"
        : "claim_request.rejected";

    const jobs: InsertNotificationDeliveryJob[] = [];
    const basePayload = {
      requestId: payload.requestId,
      organizationId: payload.organizationId,
      placeId: payload.placeId,
      placeName: payload.placeName,
      status: payload.status,
      reviewNotes: payload.reviewNotes ?? null,
    };

    const email = recipient.email?.trim();
    if (env.NOTIFICATION_EMAIL_ENABLED !== false && email) {
      jobs.push({
        eventType,
        channel: "EMAIL",
        target: email,
        organizationId: payload.organizationId,
        payload: basePayload,
        idempotencyKey: `${eventType}:${payload.requestId}:org:${payload.organizationId}:email`,
      });
    }

    const normalizedPhone = recipient.phoneNumber
      ? normalizePhMobile(recipient.phoneNumber)
      : "";
    if (env.NOTIFICATION_SMS_ENABLED !== false && normalizedPhone) {
      jobs.push({
        eventType,
        channel: "SMS",
        target: normalizedPhone,
        organizationId: payload.organizationId,
        payload: basePayload,
        idempotencyKey: `${eventType}:${payload.requestId}:org:${payload.organizationId}:sms`,
      });
    }

    if (!jobs.length) {
      logger.warn(
        {
          event: "notification_delivery.no_owner_contact",
          eventType,
          requestId: payload.requestId,
          organizationId: payload.organizationId,
        },
        "Owner has no email/phone for claim request review",
      );
      return { jobCount: 0 };
    }

    await this.jobRepository.createMany(jobs, ctx);

    logger.info(
      {
        event: "notification_delivery.jobs_enqueued",
        eventType,
        requestId: payload.requestId,
        organizationId: payload.organizationId,
        jobCount: jobs.length,
      },
      "Enqueued owner claim request review notification jobs",
    );

    return { jobCount: jobs.length };
  }
}
