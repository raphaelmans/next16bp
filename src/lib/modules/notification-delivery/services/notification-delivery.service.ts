import { normalizePhMobile } from "@/common/phone";
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
      if (email) {
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
      if (normalizedPhone) {
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
}
