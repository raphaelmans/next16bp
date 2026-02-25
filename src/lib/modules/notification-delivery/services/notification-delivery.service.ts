import { after } from "next/server";
import { normalizePhMobile } from "@/common/phone";
import { env } from "@/lib/env";
import type { IMobilePushTokenRepository } from "@/lib/modules/mobile-push-token/repositories/mobile-push-token.repository";
import type { IPushSubscriptionRepository } from "@/lib/modules/push-subscription/repositories/push-subscription.repository";
import type { InsertNotificationDeliveryJob } from "@/lib/shared/infra/db/schema";
import { logger } from "@/lib/shared/infra/logger";
import type { RequestContext } from "@/lib/shared/kernel/context";
import type { IUserNotificationRepository } from "../../user-notification/repositories/user-notification.repository";
import type { INotificationDispatchTriggerQueue } from "../queues/notification-dispatch-trigger.queue";
import type { INotificationDeliveryJobRepository } from "../repositories/notification-delivery-job.repository";
import type { INotificationRecipientRepository } from "../repositories/notification-recipient.repository";
import { buildNotificationContent } from "../shared/domain";

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

export type ReservationGroupItemSummary = {
  reservationId: string;
  courtId: string;
  courtLabel: string;
  startTimeIso: string;
  endTimeIso: string;
  totalPriceCents: number;
  currency: string;
  expiresAtIso?: string | null;
};

export type OwnerReservationGroupCreatedPayload = {
  reservationGroupId: string;
  representativeReservationId: string;
  organizationId: string;
  placeId: string;
  placeName: string;
  totalPriceCents: number;
  currency: string;
  playerName: string;
  playerEmail?: string | null;
  playerPhone?: string | null;
  itemCount: number;
  startTimeIso: string;
  endTimeIso: string;
  expiresAtIso?: string | null;
  items: ReservationGroupItemSummary[];
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

export type PlayerReservationAwaitingPaymentPayload = {
  reservationId: string;
  placeName: string;
  courtLabel: string;
  startTimeIso: string;
  endTimeIso: string;
  expiresAtIso: string | null;
  totalPriceCents: number;
  currency: string;
};

export type PlayerReservationGroupAwaitingPaymentPayload = {
  reservationGroupId: string;
  representativeReservationId: string;
  placeName: string;
  courtLabel: string;
  startTimeIso: string;
  endTimeIso: string;
  expiresAtIso: string | null;
  totalPriceCents: number;
  currency: string;
  itemCount: number;
  items: ReservationGroupItemSummary[];
};

export type OwnerReservationPaymentMarkedPayload = {
  reservationId: string;
  placeName: string;
  courtLabel: string;
  startTimeIso: string;
  endTimeIso: string;
  playerName: string;
};

export type OwnerReservationGroupPaymentMarkedPayload = {
  reservationGroupId: string;
  representativeReservationId: string;
  organizationId: string;
  placeName: string;
  courtLabel: string;
  startTimeIso: string;
  endTimeIso: string;
  playerName: string;
  itemCount: number;
  items: ReservationGroupItemSummary[];
};

export type PlayerReservationConfirmedPayload = {
  reservationId: string;
  placeName: string;
  courtLabel: string;
  startTimeIso: string;
  endTimeIso: string;
};

export type PlayerReservationGroupConfirmedPayload = {
  reservationGroupId: string;
  representativeReservationId: string;
  placeName: string;
  courtLabel: string;
  startTimeIso: string;
  endTimeIso: string;
  itemCount: number;
  items: ReservationGroupItemSummary[];
};

export type PlayerReservationRejectedPayload = {
  reservationId: string;
  placeName: string;
  courtLabel: string;
  startTimeIso: string;
  endTimeIso: string;
  reason?: string | null;
};

export type PlayerReservationGroupRejectedPayload = {
  reservationGroupId: string;
  representativeReservationId: string;
  placeName: string;
  courtLabel: string;
  startTimeIso: string;
  endTimeIso: string;
  itemCount: number;
  items: ReservationGroupItemSummary[];
  reason?: string | null;
};

export type OwnerReservationPingPayload = {
  reservationId: string;
  organizationId: string;
  placeName: string;
  courtLabel: string;
  playerName: string;
  startTimeIso: string;
  endTimeIso: string;
};

export type OwnerReservationCancelledPayload = {
  reservationId: string;
  placeName: string;
  courtLabel: string;
  startTimeIso: string;
  endTimeIso: string;
  playerName: string;
  reason?: string | null;
};

export type OwnerReservationGroupCancelledPayload = {
  reservationGroupId: string;
  representativeReservationId: string;
  organizationId: string;
  placeName: string;
  courtLabel: string;
  startTimeIso: string;
  endTimeIso: string;
  playerName: string;
  itemCount: number;
  items: ReservationGroupItemSummary[];
  reason?: string | null;
};

export class NotificationDeliveryService {
  constructor(
    private jobRepository: INotificationDeliveryJobRepository,
    private recipientRepository: INotificationRecipientRepository,
    private pushSubscriptionRepository: IPushSubscriptionRepository,
    private mobilePushTokenRepository: IMobilePushTokenRepository,
    private userNotificationRepository: IUserNotificationRepository,
    private dispatchTriggerQueue: INotificationDispatchTriggerQueue | null = null,
  ) {}

  private publishDispatchKickAsync(jobCount: number) {
    const dispatchTriggerQueue = this.dispatchTriggerQueue;
    if (!dispatchTriggerQueue || jobCount <= 0) return;

    after(async () => {
      try {
        await dispatchTriggerQueue.publishDispatchKick({
          reason: "jobs_enqueued",
          triggeredAtIso: new Date().toISOString(),
          jobCount,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        logger.error(
          {
            event: "notification_delivery.dispatch_kick_failed",
            jobCount,
            error: message,
          },
          "Failed to publish notification delivery dispatch kick",
        );
      }
    });
  }

  private async createJobsAndTriggerDispatch(
    jobs: InsertNotificationDeliveryJob[],
    ctx?: RequestContext,
  ) {
    await this.jobRepository.createMany(jobs, ctx);
    this.publishDispatchKickAsync(jobs.length);
  }

  private async enqueueWebPushForUser(options: {
    userId: string;
    eventType: string;
    payload: Record<string, unknown>;
    reservationId?: string;
    organizationId?: string;
    placeVerificationRequestId?: string;
    idempotencyKeyBase: string;
    ctx?: RequestContext;
  }): Promise<InsertNotificationDeliveryJob[]> {
    if (env.NOTIFICATION_WEB_PUSH_ENABLED === false) return [];

    const subscriptions =
      await this.pushSubscriptionRepository.listActiveByUserId(
        options.userId,
        options.ctx,
      );

    if (!subscriptions.length) return [];

    return subscriptions.map((sub) => ({
      eventType: options.eventType,
      channel: "WEB_PUSH",
      target: sub.id,
      organizationId: options.organizationId,
      reservationId: options.reservationId,
      placeVerificationRequestId: options.placeVerificationRequestId,
      payload: options.payload,
      idempotencyKey: `${options.idempotencyKeyBase}:web_push:${sub.id}`,
    }));
  }

  private async enqueueMobilePushForUser(options: {
    userId: string;
    eventType: string;
    payload: Record<string, unknown>;
    reservationId?: string;
    organizationId?: string;
    placeVerificationRequestId?: string;
    idempotencyKeyBase: string;
    ctx?: RequestContext;
  }): Promise<InsertNotificationDeliveryJob[]> {
    if (env.NOTIFICATION_MOBILE_PUSH_ENABLED === false) return [];

    const tokens = await this.mobilePushTokenRepository.listActiveByUserId(
      options.userId,
      options.ctx,
    );

    if (!tokens.length) return [];

    return tokens.map((token) => ({
      eventType: options.eventType,
      channel: "MOBILE_PUSH",
      target: token.id,
      organizationId: options.organizationId,
      reservationId: options.reservationId,
      placeVerificationRequestId: options.placeVerificationRequestId,
      payload: options.payload,
      idempotencyKey: `${options.idempotencyKeyBase}:mobile_push:${token.id}`,
    }));
  }

  private async createInboxNotification(options: {
    userId: string;
    eventType: string;
    payload: Record<string, unknown>;
    idempotencyKeyBase: string;
    ctx?: RequestContext;
  }): Promise<void> {
    const content = buildNotificationContent(
      options.eventType,
      options.payload,
      env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "",
    );

    if ("error" in content) {
      logger.warn(
        {
          event: "notification_delivery.inbox_content_unavailable",
          eventType: options.eventType,
          userId: options.userId,
          error: content.error,
        },
        "Skipping inbox record due to missing/invalid content",
      );
      return;
    }

    await this.userNotificationRepository.createMany(
      [
        {
          userId: options.userId,
          eventType: options.eventType,
          title: content.push.title,
          body: content.push.body,
          href: content.push.url,
          payload: options.payload,
          idempotencyKey: `${options.idempotencyKeyBase}:inbox:${options.userId}`,
        },
      ],
      options.ctx,
    );
  }

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
      const idempotencyKeyBase = `place_verification.requested:${payload.requestId}:admin:${recipient.userId}`;
      await this.createInboxNotification({
        userId: recipient.userId,
        eventType: "place_verification.requested",
        payload: basePayload,
        idempotencyKeyBase,
        ctx,
      });

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

      const webPushJobs = await this.enqueueWebPushForUser({
        userId: recipient.userId,
        eventType: "place_verification.requested",
        organizationId: payload.organizationId,
        placeVerificationRequestId: payload.requestId,
        payload: basePayload,
        idempotencyKeyBase,
        ctx,
      });
      jobs.push(...webPushJobs);

      const mobilePushJobs = await this.enqueueMobilePushForUser({
        userId: recipient.userId,
        eventType: "place_verification.requested",
        organizationId: payload.organizationId,
        placeVerificationRequestId: payload.requestId,
        payload: basePayload,
        idempotencyKeyBase,
        ctx,
      });
      jobs.push(...mobilePushJobs);
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

    await this.createJobsAndTriggerDispatch(jobs, ctx);

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
    const idempotencyKeyBase = `reservation.created:${payload.reservationId}:org:${payload.organizationId}`;

    await this.createInboxNotification({
      userId: recipient.ownerUserId,
      eventType: "reservation.created",
      payload: basePayload,
      idempotencyKeyBase,
      ctx,
    });

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

    const webPushJobs = await this.enqueueWebPushForUser({
      userId: recipient.ownerUserId,
      eventType: "reservation.created",
      organizationId: payload.organizationId,
      reservationId: payload.reservationId,
      payload: basePayload,
      idempotencyKeyBase,
      ctx,
    });
    jobs.push(...webPushJobs);

    const mobilePushJobs = await this.enqueueMobilePushForUser({
      userId: recipient.ownerUserId,
      eventType: "reservation.created",
      organizationId: payload.organizationId,
      reservationId: payload.reservationId,
      payload: basePayload,
      idempotencyKeyBase,
      ctx,
    });
    jobs.push(...mobilePushJobs);

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

    await this.createJobsAndTriggerDispatch(jobs, ctx);

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

  async enqueueOwnerReservationGroupCreated(
    payload: OwnerReservationGroupCreatedPayload,
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
          eventType: "reservation_group.created",
          reservationGroupId: payload.reservationGroupId,
          organizationId: payload.organizationId,
        },
        "No owner recipient found for reservation_group.created",
      );
      return { jobCount: 0 };
    }

    const jobs: InsertNotificationDeliveryJob[] = [];
    const basePayload = {
      reservationGroupId: payload.reservationGroupId,
      representativeReservationId: payload.representativeReservationId,
      organizationId: payload.organizationId,
      placeId: payload.placeId,
      placeName: payload.placeName,
      totalPriceCents: payload.totalPriceCents,
      currency: payload.currency,
      playerName: payload.playerName,
      playerEmail: payload.playerEmail ?? null,
      playerPhone: payload.playerPhone ?? null,
      itemCount: payload.itemCount,
      startTimeIso: payload.startTimeIso,
      endTimeIso: payload.endTimeIso,
      expiresAtIso: payload.expiresAtIso ?? null,
      items: payload.items,
    };
    const idempotencyKeyBase = `reservation_group.created:${payload.reservationGroupId}:org:${payload.organizationId}`;

    await this.createInboxNotification({
      userId: recipient.ownerUserId,
      eventType: "reservation_group.created",
      payload: basePayload,
      idempotencyKeyBase,
      ctx,
    });

    const email = recipient.email?.trim();
    if (env.NOTIFICATION_EMAIL_ENABLED !== false && email) {
      jobs.push({
        eventType: "reservation_group.created",
        channel: "EMAIL",
        target: email,
        organizationId: payload.organizationId,
        reservationId: payload.representativeReservationId,
        payload: basePayload,
        idempotencyKey: `reservation_group.created:${payload.reservationGroupId}:org:${payload.organizationId}:email`,
      });
    }

    const normalizedPhone = recipient.phoneNumber
      ? normalizePhMobile(recipient.phoneNumber)
      : "";
    if (env.NOTIFICATION_SMS_ENABLED !== false && normalizedPhone) {
      jobs.push({
        eventType: "reservation_group.created",
        channel: "SMS",
        target: normalizedPhone,
        organizationId: payload.organizationId,
        reservationId: payload.representativeReservationId,
        payload: basePayload,
        idempotencyKey: `reservation_group.created:${payload.reservationGroupId}:org:${payload.organizationId}:sms`,
      });
    }

    const webPushJobs = await this.enqueueWebPushForUser({
      userId: recipient.ownerUserId,
      eventType: "reservation_group.created",
      organizationId: payload.organizationId,
      reservationId: payload.representativeReservationId,
      payload: basePayload,
      idempotencyKeyBase,
      ctx,
    });
    jobs.push(...webPushJobs);

    const mobilePushJobs = await this.enqueueMobilePushForUser({
      userId: recipient.ownerUserId,
      eventType: "reservation_group.created",
      organizationId: payload.organizationId,
      reservationId: payload.representativeReservationId,
      payload: basePayload,
      idempotencyKeyBase,
      ctx,
    });
    jobs.push(...mobilePushJobs);

    if (!jobs.length) {
      logger.warn(
        {
          event: "notification_delivery.no_owner_contact",
          eventType: "reservation_group.created",
          reservationGroupId: payload.reservationGroupId,
          organizationId: payload.organizationId,
        },
        "Owner has no email/phone for reservation_group.created",
      );
      return { jobCount: 0 };
    }

    await this.createJobsAndTriggerDispatch(jobs, ctx);

    logger.info(
      {
        event: "notification_delivery.jobs_enqueued",
        eventType: "reservation_group.created",
        reservationGroupId: payload.reservationGroupId,
        organizationId: payload.organizationId,
        jobCount: jobs.length,
      },
      "Enqueued owner reservation_group.created notification jobs",
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
    const idempotencyKeyBase = `${eventType}:${payload.requestId}:org:${payload.organizationId}`;

    await this.createInboxNotification({
      userId: recipient.ownerUserId,
      eventType,
      payload: basePayload,
      idempotencyKeyBase,
      ctx,
    });

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

    const webPushJobs = await this.enqueueWebPushForUser({
      userId: recipient.ownerUserId,
      eventType,
      organizationId: payload.organizationId,
      placeVerificationRequestId: payload.requestId,
      payload: basePayload,
      idempotencyKeyBase,
      ctx,
    });
    jobs.push(...webPushJobs);

    const mobilePushJobs = await this.enqueueMobilePushForUser({
      userId: recipient.ownerUserId,
      eventType,
      organizationId: payload.organizationId,
      placeVerificationRequestId: payload.requestId,
      payload: basePayload,
      idempotencyKeyBase,
      ctx,
    });
    jobs.push(...mobilePushJobs);

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

    await this.createJobsAndTriggerDispatch(jobs, ctx);

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
    const idempotencyKeyBase = `${eventType}:${payload.requestId}:org:${payload.organizationId}`;

    await this.createInboxNotification({
      userId: recipient.ownerUserId,
      eventType,
      payload: basePayload,
      idempotencyKeyBase,
      ctx,
    });

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

    const webPushJobs = await this.enqueueWebPushForUser({
      userId: recipient.ownerUserId,
      eventType,
      organizationId: payload.organizationId,
      payload: basePayload,
      idempotencyKeyBase,
      ctx,
    });
    jobs.push(...webPushJobs);

    const mobilePushJobs = await this.enqueueMobilePushForUser({
      userId: recipient.ownerUserId,
      eventType,
      organizationId: payload.organizationId,
      payload: basePayload,
      idempotencyKeyBase,
      ctx,
    });
    jobs.push(...mobilePushJobs);

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

    await this.createJobsAndTriggerDispatch(jobs, ctx);

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

  async enqueuePlayerReservationAwaitingPayment(
    payload: PlayerReservationAwaitingPaymentPayload,
    ctx?: RequestContext,
  ): Promise<{ jobCount: number }> {
    const recipient =
      await this.recipientRepository.findPlayerRecipientByReservationId(
        payload.reservationId,
        ctx,
      );
    if (!recipient) {
      return { jobCount: 0 };
    }

    const basePayload = {
      reservationId: payload.reservationId,
      placeName: payload.placeName,
      courtLabel: payload.courtLabel,
      startTimeIso: payload.startTimeIso,
      endTimeIso: payload.endTimeIso,
      expiresAtIso: payload.expiresAtIso,
      totalPriceCents: payload.totalPriceCents,
      currency: payload.currency,
    };
    const idempotencyKeyBase = `reservation.awaiting_payment:${payload.reservationId}:user:${recipient.userId}`;

    const jobs: InsertNotificationDeliveryJob[] = [];

    await this.createInboxNotification({
      userId: recipient.userId,
      eventType: "reservation.awaiting_payment",
      payload: basePayload,
      idempotencyKeyBase,
      ctx,
    });

    const webPushJobs = await this.enqueueWebPushForUser({
      userId: recipient.userId,
      eventType: "reservation.awaiting_payment",
      reservationId: payload.reservationId,
      payload: basePayload,
      idempotencyKeyBase,
      ctx,
    });
    jobs.push(...webPushJobs);

    const mobilePushJobs = await this.enqueueMobilePushForUser({
      userId: recipient.userId,
      eventType: "reservation.awaiting_payment",
      reservationId: payload.reservationId,
      payload: basePayload,
      idempotencyKeyBase,
      ctx,
    });
    jobs.push(...mobilePushJobs);

    await this.createJobsAndTriggerDispatch(jobs, ctx);
    return { jobCount: jobs.length };
  }

  async enqueuePlayerReservationGroupAwaitingPayment(
    payload: PlayerReservationGroupAwaitingPaymentPayload,
    ctx?: RequestContext,
  ): Promise<{ jobCount: number }> {
    const recipient =
      await this.recipientRepository.findPlayerRecipientByReservationId(
        payload.representativeReservationId,
        ctx,
      );
    if (!recipient) {
      return { jobCount: 0 };
    }

    const basePayload = {
      reservationGroupId: payload.reservationGroupId,
      representativeReservationId: payload.representativeReservationId,
      placeName: payload.placeName,
      courtLabel: payload.courtLabel,
      startTimeIso: payload.startTimeIso,
      endTimeIso: payload.endTimeIso,
      expiresAtIso: payload.expiresAtIso,
      totalPriceCents: payload.totalPriceCents,
      currency: payload.currency,
      itemCount: payload.itemCount,
      items: payload.items,
    };
    const idempotencyKeyBase = `reservation_group.awaiting_payment:${payload.reservationGroupId}:user:${recipient.userId}`;

    const jobs: InsertNotificationDeliveryJob[] = [];

    await this.createInboxNotification({
      userId: recipient.userId,
      eventType: "reservation_group.awaiting_payment",
      payload: basePayload,
      idempotencyKeyBase,
      ctx,
    });

    const webPushJobs = await this.enqueueWebPushForUser({
      userId: recipient.userId,
      eventType: "reservation_group.awaiting_payment",
      reservationId: payload.representativeReservationId,
      payload: basePayload,
      idempotencyKeyBase,
      ctx,
    });
    jobs.push(...webPushJobs);

    const mobilePushJobs = await this.enqueueMobilePushForUser({
      userId: recipient.userId,
      eventType: "reservation_group.awaiting_payment",
      reservationId: payload.representativeReservationId,
      payload: basePayload,
      idempotencyKeyBase,
      ctx,
    });
    jobs.push(...mobilePushJobs);

    await this.createJobsAndTriggerDispatch(jobs, ctx);
    return { jobCount: jobs.length };
  }

  async enqueueOwnerReservationPaymentMarked(
    payload: OwnerReservationPaymentMarkedPayload,
    ctx?: RequestContext,
  ): Promise<{ jobCount: number }> {
    const owner =
      await this.recipientRepository.findOwnerRecipientByReservationId(
        payload.reservationId,
        ctx,
      );
    if (!owner) {
      return { jobCount: 0 };
    }

    const basePayload = {
      reservationId: payload.reservationId,
      placeName: payload.placeName,
      courtLabel: payload.courtLabel,
      startTimeIso: payload.startTimeIso,
      endTimeIso: payload.endTimeIso,
      playerName: payload.playerName,
    };
    const idempotencyKeyBase = `reservation.payment_marked:${payload.reservationId}:org:${owner.organizationId}`;

    const jobs: InsertNotificationDeliveryJob[] = [];

    await this.createInboxNotification({
      userId: owner.ownerUserId,
      eventType: "reservation.payment_marked",
      payload: basePayload,
      idempotencyKeyBase,
      ctx,
    });

    const webPushJobs = await this.enqueueWebPushForUser({
      userId: owner.ownerUserId,
      eventType: "reservation.payment_marked",
      reservationId: payload.reservationId,
      organizationId: owner.organizationId,
      payload: basePayload,
      idempotencyKeyBase,
      ctx,
    });
    jobs.push(...webPushJobs);

    const mobilePushJobs = await this.enqueueMobilePushForUser({
      userId: owner.ownerUserId,
      eventType: "reservation.payment_marked",
      reservationId: payload.reservationId,
      organizationId: owner.organizationId,
      payload: basePayload,
      idempotencyKeyBase,
      ctx,
    });
    jobs.push(...mobilePushJobs);

    await this.createJobsAndTriggerDispatch(jobs, ctx);
    return { jobCount: jobs.length };
  }

  async enqueueOwnerReservationGroupPaymentMarked(
    payload: OwnerReservationGroupPaymentMarkedPayload,
    ctx?: RequestContext,
  ): Promise<{ jobCount: number }> {
    const owner =
      await this.recipientRepository.findOwnerRecipientByOrganizationId(
        payload.organizationId,
        ctx,
      );
    if (!owner) {
      return { jobCount: 0 };
    }

    const basePayload = {
      reservationGroupId: payload.reservationGroupId,
      representativeReservationId: payload.representativeReservationId,
      organizationId: payload.organizationId,
      placeName: payload.placeName,
      courtLabel: payload.courtLabel,
      startTimeIso: payload.startTimeIso,
      endTimeIso: payload.endTimeIso,
      playerName: payload.playerName,
      itemCount: payload.itemCount,
      items: payload.items,
    };
    const idempotencyKeyBase = `reservation_group.payment_marked:${payload.reservationGroupId}:org:${owner.organizationId}`;

    const jobs: InsertNotificationDeliveryJob[] = [];

    await this.createInboxNotification({
      userId: owner.ownerUserId,
      eventType: "reservation_group.payment_marked",
      payload: basePayload,
      idempotencyKeyBase,
      ctx,
    });

    const webPushJobs = await this.enqueueWebPushForUser({
      userId: owner.ownerUserId,
      eventType: "reservation_group.payment_marked",
      reservationId: payload.representativeReservationId,
      organizationId: owner.organizationId,
      payload: basePayload,
      idempotencyKeyBase,
      ctx,
    });
    jobs.push(...webPushJobs);

    const mobilePushJobs = await this.enqueueMobilePushForUser({
      userId: owner.ownerUserId,
      eventType: "reservation_group.payment_marked",
      reservationId: payload.representativeReservationId,
      organizationId: owner.organizationId,
      payload: basePayload,
      idempotencyKeyBase,
      ctx,
    });
    jobs.push(...mobilePushJobs);

    await this.createJobsAndTriggerDispatch(jobs, ctx);
    return { jobCount: jobs.length };
  }

  async enqueuePlayerReservationConfirmed(
    payload: PlayerReservationConfirmedPayload,
    ctx?: RequestContext,
  ): Promise<{ jobCount: number }> {
    const recipient =
      await this.recipientRepository.findPlayerRecipientByReservationId(
        payload.reservationId,
        ctx,
      );
    if (!recipient) {
      return { jobCount: 0 };
    }

    const basePayload = {
      reservationId: payload.reservationId,
      placeName: payload.placeName,
      courtLabel: payload.courtLabel,
      startTimeIso: payload.startTimeIso,
      endTimeIso: payload.endTimeIso,
    };
    const idempotencyKeyBase = `reservation.confirmed:${payload.reservationId}:user:${recipient.userId}`;

    const jobs: InsertNotificationDeliveryJob[] = [];

    await this.createInboxNotification({
      userId: recipient.userId,
      eventType: "reservation.confirmed",
      payload: basePayload,
      idempotencyKeyBase,
      ctx,
    });

    const webPushJobs = await this.enqueueWebPushForUser({
      userId: recipient.userId,
      eventType: "reservation.confirmed",
      reservationId: payload.reservationId,
      payload: basePayload,
      idempotencyKeyBase,
      ctx,
    });
    jobs.push(...webPushJobs);

    const mobilePushJobs = await this.enqueueMobilePushForUser({
      userId: recipient.userId,
      eventType: "reservation.confirmed",
      reservationId: payload.reservationId,
      payload: basePayload,
      idempotencyKeyBase,
      ctx,
    });
    jobs.push(...mobilePushJobs);

    await this.createJobsAndTriggerDispatch(jobs, ctx);
    return { jobCount: jobs.length };
  }

  async enqueuePlayerReservationGroupConfirmed(
    payload: PlayerReservationGroupConfirmedPayload,
    ctx?: RequestContext,
  ): Promise<{ jobCount: number }> {
    const recipient =
      await this.recipientRepository.findPlayerRecipientByReservationId(
        payload.representativeReservationId,
        ctx,
      );
    if (!recipient) {
      return { jobCount: 0 };
    }

    const basePayload = {
      reservationGroupId: payload.reservationGroupId,
      representativeReservationId: payload.representativeReservationId,
      placeName: payload.placeName,
      courtLabel: payload.courtLabel,
      startTimeIso: payload.startTimeIso,
      endTimeIso: payload.endTimeIso,
      itemCount: payload.itemCount,
      items: payload.items,
    };
    const idempotencyKeyBase = `reservation_group.confirmed:${payload.reservationGroupId}:user:${recipient.userId}`;

    const jobs: InsertNotificationDeliveryJob[] = [];

    await this.createInboxNotification({
      userId: recipient.userId,
      eventType: "reservation_group.confirmed",
      payload: basePayload,
      idempotencyKeyBase,
      ctx,
    });

    const webPushJobs = await this.enqueueWebPushForUser({
      userId: recipient.userId,
      eventType: "reservation_group.confirmed",
      reservationId: payload.representativeReservationId,
      payload: basePayload,
      idempotencyKeyBase,
      ctx,
    });
    jobs.push(...webPushJobs);

    const mobilePushJobs = await this.enqueueMobilePushForUser({
      userId: recipient.userId,
      eventType: "reservation_group.confirmed",
      reservationId: payload.representativeReservationId,
      payload: basePayload,
      idempotencyKeyBase,
      ctx,
    });
    jobs.push(...mobilePushJobs);

    await this.createJobsAndTriggerDispatch(jobs, ctx);
    return { jobCount: jobs.length };
  }

  async enqueuePlayerReservationRejected(
    payload: PlayerReservationRejectedPayload,
    ctx?: RequestContext,
  ): Promise<{ jobCount: number }> {
    const recipient =
      await this.recipientRepository.findPlayerRecipientByReservationId(
        payload.reservationId,
        ctx,
      );
    if (!recipient) {
      return { jobCount: 0 };
    }

    const basePayload = {
      reservationId: payload.reservationId,
      placeName: payload.placeName,
      courtLabel: payload.courtLabel,
      startTimeIso: payload.startTimeIso,
      endTimeIso: payload.endTimeIso,
      reason: payload.reason ?? null,
    };
    const idempotencyKeyBase = `reservation.rejected:${payload.reservationId}:user:${recipient.userId}`;

    const jobs: InsertNotificationDeliveryJob[] = [];

    await this.createInboxNotification({
      userId: recipient.userId,
      eventType: "reservation.rejected",
      payload: basePayload,
      idempotencyKeyBase,
      ctx,
    });

    const webPushJobs = await this.enqueueWebPushForUser({
      userId: recipient.userId,
      eventType: "reservation.rejected",
      reservationId: payload.reservationId,
      payload: basePayload,
      idempotencyKeyBase,
      ctx,
    });
    jobs.push(...webPushJobs);

    const mobilePushJobs = await this.enqueueMobilePushForUser({
      userId: recipient.userId,
      eventType: "reservation.rejected",
      reservationId: payload.reservationId,
      payload: basePayload,
      idempotencyKeyBase,
      ctx,
    });
    jobs.push(...mobilePushJobs);

    await this.createJobsAndTriggerDispatch(jobs, ctx);
    return { jobCount: jobs.length };
  }

  async enqueuePlayerReservationGroupRejected(
    payload: PlayerReservationGroupRejectedPayload,
    ctx?: RequestContext,
  ): Promise<{ jobCount: number }> {
    const recipient =
      await this.recipientRepository.findPlayerRecipientByReservationId(
        payload.representativeReservationId,
        ctx,
      );
    if (!recipient) {
      return { jobCount: 0 };
    }

    const basePayload = {
      reservationGroupId: payload.reservationGroupId,
      representativeReservationId: payload.representativeReservationId,
      placeName: payload.placeName,
      courtLabel: payload.courtLabel,
      startTimeIso: payload.startTimeIso,
      endTimeIso: payload.endTimeIso,
      itemCount: payload.itemCount,
      items: payload.items,
      reason: payload.reason ?? null,
    };
    const idempotencyKeyBase = `reservation_group.rejected:${payload.reservationGroupId}:user:${recipient.userId}`;

    const jobs: InsertNotificationDeliveryJob[] = [];

    await this.createInboxNotification({
      userId: recipient.userId,
      eventType: "reservation_group.rejected",
      payload: basePayload,
      idempotencyKeyBase,
      ctx,
    });

    const webPushJobs = await this.enqueueWebPushForUser({
      userId: recipient.userId,
      eventType: "reservation_group.rejected",
      reservationId: payload.representativeReservationId,
      payload: basePayload,
      idempotencyKeyBase,
      ctx,
    });
    jobs.push(...webPushJobs);

    const mobilePushJobs = await this.enqueueMobilePushForUser({
      userId: recipient.userId,
      eventType: "reservation_group.rejected",
      reservationId: payload.representativeReservationId,
      payload: basePayload,
      idempotencyKeyBase,
      ctx,
    });
    jobs.push(...mobilePushJobs);

    await this.createJobsAndTriggerDispatch(jobs, ctx);
    return { jobCount: jobs.length };
  }

  async enqueueOwnerReservationPing(
    payload: OwnerReservationPingPayload,
    ctx?: RequestContext,
  ): Promise<{ pinged: boolean }> {
    const recipient =
      await this.recipientRepository.findOwnerRecipientByOrganizationId(
        payload.organizationId,
        ctx,
      );
    if (!recipient) {
      return { pinged: false };
    }

    const windowBucket = Math.floor(Date.now() / (60 * 1000));
    const idempotencyKeyBase = `reservation.ping_owner:${payload.reservationId}:org:${payload.organizationId}:w${windowBucket}`;

    const basePayload = {
      reservationId: payload.reservationId,
      organizationId: payload.organizationId,
      placeName: payload.placeName,
      courtLabel: payload.courtLabel,
      playerName: payload.playerName,
      startTimeIso: payload.startTimeIso,
      endTimeIso: payload.endTimeIso,
    };

    const jobs: InsertNotificationDeliveryJob[] = [];

    await this.createInboxNotification({
      userId: recipient.ownerUserId,
      eventType: "reservation.ping_owner",
      payload: basePayload,
      idempotencyKeyBase,
      ctx,
    });

    const webPushJobs = await this.enqueueWebPushForUser({
      userId: recipient.ownerUserId,
      eventType: "reservation.ping_owner",
      reservationId: payload.reservationId,
      organizationId: payload.organizationId,
      payload: basePayload,
      idempotencyKeyBase,
      ctx,
    });
    jobs.push(...webPushJobs);

    const mobilePushJobs = await this.enqueueMobilePushForUser({
      userId: recipient.ownerUserId,
      eventType: "reservation.ping_owner",
      reservationId: payload.reservationId,
      organizationId: payload.organizationId,
      payload: basePayload,
      idempotencyKeyBase,
      ctx,
    });
    jobs.push(...mobilePushJobs);

    if (jobs.length) {
      await this.createJobsAndTriggerDispatch(jobs, ctx);
    }
    logger.info(
      {
        event: "notification_delivery.jobs_enqueued",
        eventType: "reservation.ping_owner",
        reservationId: payload.reservationId,
        organizationId: payload.organizationId,
        jobCount: jobs.length,
      },
      "Enqueued owner reservation.ping_owner notification jobs",
    );

    return { pinged: true };
  }

  async enqueueOwnerReservationCancelled(
    payload: OwnerReservationCancelledPayload,
    ctx?: RequestContext,
  ): Promise<{ jobCount: number }> {
    const owner =
      await this.recipientRepository.findOwnerRecipientByReservationId(
        payload.reservationId,
        ctx,
      );
    if (!owner) {
      return { jobCount: 0 };
    }

    const basePayload = {
      reservationId: payload.reservationId,
      placeName: payload.placeName,
      courtLabel: payload.courtLabel,
      startTimeIso: payload.startTimeIso,
      endTimeIso: payload.endTimeIso,
      playerName: payload.playerName,
      reason: payload.reason ?? null,
    };
    const idempotencyKeyBase = `reservation.cancelled:${payload.reservationId}:org:${owner.organizationId}`;

    const jobs: InsertNotificationDeliveryJob[] = [];

    await this.createInboxNotification({
      userId: owner.ownerUserId,
      eventType: "reservation.cancelled",
      payload: basePayload,
      idempotencyKeyBase,
      ctx,
    });

    const webPushJobs = await this.enqueueWebPushForUser({
      userId: owner.ownerUserId,
      eventType: "reservation.cancelled",
      reservationId: payload.reservationId,
      organizationId: owner.organizationId,
      payload: basePayload,
      idempotencyKeyBase,
      ctx,
    });
    jobs.push(...webPushJobs);

    const mobilePushJobs = await this.enqueueMobilePushForUser({
      userId: owner.ownerUserId,
      eventType: "reservation.cancelled",
      reservationId: payload.reservationId,
      organizationId: owner.organizationId,
      payload: basePayload,
      idempotencyKeyBase,
      ctx,
    });
    jobs.push(...mobilePushJobs);

    await this.createJobsAndTriggerDispatch(jobs, ctx);
    return { jobCount: jobs.length };
  }

  async enqueueOwnerReservationGroupCancelled(
    payload: OwnerReservationGroupCancelledPayload,
    ctx?: RequestContext,
  ): Promise<{ jobCount: number }> {
    const owner =
      await this.recipientRepository.findOwnerRecipientByOrganizationId(
        payload.organizationId,
        ctx,
      );
    if (!owner) {
      return { jobCount: 0 };
    }

    const basePayload = {
      reservationGroupId: payload.reservationGroupId,
      representativeReservationId: payload.representativeReservationId,
      organizationId: payload.organizationId,
      placeName: payload.placeName,
      courtLabel: payload.courtLabel,
      startTimeIso: payload.startTimeIso,
      endTimeIso: payload.endTimeIso,
      playerName: payload.playerName,
      itemCount: payload.itemCount,
      items: payload.items,
      reason: payload.reason ?? null,
    };
    const idempotencyKeyBase = `reservation_group.cancelled:${payload.reservationGroupId}:org:${owner.organizationId}`;

    const jobs: InsertNotificationDeliveryJob[] = [];

    await this.createInboxNotification({
      userId: owner.ownerUserId,
      eventType: "reservation_group.cancelled",
      payload: basePayload,
      idempotencyKeyBase,
      ctx,
    });

    const webPushJobs = await this.enqueueWebPushForUser({
      userId: owner.ownerUserId,
      eventType: "reservation_group.cancelled",
      reservationId: payload.representativeReservationId,
      organizationId: owner.organizationId,
      payload: basePayload,
      idempotencyKeyBase,
      ctx,
    });
    jobs.push(...webPushJobs);

    const mobilePushJobs = await this.enqueueMobilePushForUser({
      userId: owner.ownerUserId,
      eventType: "reservation_group.cancelled",
      reservationId: payload.representativeReservationId,
      organizationId: owner.organizationId,
      payload: basePayload,
      idempotencyKeyBase,
      ctx,
    });
    jobs.push(...mobilePushJobs);

    await this.createJobsAndTriggerDispatch(jobs, ctx);
    return { jobCount: jobs.length };
  }
}
