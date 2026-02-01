import { z } from "zod";
import { normalizePhMobile } from "@/common/phone";
import { makeNotificationDeliveryJobRepository } from "@/lib/modules/notification-delivery/factories/notification-delivery.factory";
import type { InsertNotificationDeliveryJob } from "@/lib/shared/infra/db/schema";
import { adminProcedure, router } from "@/lib/shared/infra/trpc/trpc";

const baseTargetSchema = z.object({
  email: z.string().email().optional().or(z.literal("")),
  phoneNumber: z.string().min(1).optional().or(z.literal("")),
});

const toEmail = (value: string | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const toPhone = (value: string | undefined) => {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const normalized = normalizePhMobile(trimmed);
  return normalized || null;
};

const buildTestIdempotencyKey = (eventType: string, runId: string) =>
  `test:${eventType}:${runId}`;

export const notificationDeliveryAdminRouter = router({
  enqueueReservationCreatedTest: adminProcedure
    .input(
      baseTargetSchema.merge(
        z.object({
          placeName: z.string().min(1),
          courtLabel: z.string().min(1),
          startTimeIso: z.string().min(1),
          endTimeIso: z.string().min(1),
          totalPriceCents: z.coerce.number().int().nonnegative(),
          currency: z.string().min(1).default("PHP"),
          playerName: z.string().min(1).default("Test Player"),
          playerEmail: z.string().email().optional().or(z.literal("")),
          playerPhone: z.string().optional().or(z.literal("")),
          expiresAtIso: z.string().optional().or(z.literal("")),
        }),
      ),
    )
    .mutation(async ({ input }) => {
      const email = toEmail(input.email);
      const phoneNumber = toPhone(input.phoneNumber);
      if (!email && !phoneNumber) {
        return { jobCount: 0, message: "Provide email and/or phoneNumber" };
      }

      const jobRepo = makeNotificationDeliveryJobRepository();
      const runId = globalThis.crypto.randomUUID();
      const reservationId = globalThis.crypto.randomUUID();
      const organizationId = globalThis.crypto.randomUUID();
      const placeId = globalThis.crypto.randomUUID();
      const courtId = globalThis.crypto.randomUUID();

      const payload = {
        reservationId,
        organizationId,
        placeId,
        placeName: input.placeName,
        courtId,
        courtLabel: input.courtLabel,
        startTimeIso: input.startTimeIso,
        endTimeIso: input.endTimeIso,
        totalPriceCents: input.totalPriceCents,
        currency: input.currency,
        playerName: input.playerName,
        playerEmail: toEmail(input.playerEmail ?? undefined),
        playerPhone: toPhone(input.playerPhone ?? undefined),
        expiresAtIso: input.expiresAtIso?.trim()
          ? input.expiresAtIso.trim()
          : null,
      };

      const jobs: InsertNotificationDeliveryJob[] = [];

      if (email) {
        jobs.push({
          eventType: "reservation.created",
          channel: "EMAIL",
          target: email,
          payload,
          idempotencyKey: `${buildTestIdempotencyKey("reservation.created", runId)}:email`,
        });
      }

      if (phoneNumber) {
        jobs.push({
          eventType: "reservation.created",
          channel: "SMS",
          target: phoneNumber,
          payload,
          idempotencyKey: `${buildTestIdempotencyKey("reservation.created", runId)}:sms`,
        });
      }

      await jobRepo.createMany(jobs);
      return {
        jobCount: jobs.length,
        runId,
        ids: { reservationId, organizationId, placeId, courtId },
      };
    }),

  enqueuePlaceVerificationReviewedTest: adminProcedure
    .input(
      baseTargetSchema.merge(
        z.object({
          status: z.enum(["APPROVED", "REJECTED"]),
          placeName: z.string().min(1),
          reviewNotes: z.string().optional().or(z.literal("")),
        }),
      ),
    )
    .mutation(async ({ input }) => {
      const email = toEmail(input.email);
      const phoneNumber = toPhone(input.phoneNumber);
      if (!email && !phoneNumber) {
        return { jobCount: 0, message: "Provide email and/or phoneNumber" };
      }

      const jobRepo = makeNotificationDeliveryJobRepository();
      const runId = globalThis.crypto.randomUUID();
      const requestId = globalThis.crypto.randomUUID();
      const organizationId = globalThis.crypto.randomUUID();
      const placeId = globalThis.crypto.randomUUID();

      const eventType =
        input.status === "APPROVED"
          ? "place_verification.approved"
          : "place_verification.rejected";

      const payload = {
        requestId,
        organizationId,
        placeId,
        placeName: input.placeName,
        status: input.status,
        reviewNotes: input.reviewNotes?.trim()
          ? input.reviewNotes.trim()
          : null,
      };

      const jobs: InsertNotificationDeliveryJob[] = [];

      if (email) {
        jobs.push({
          eventType,
          channel: "EMAIL",
          target: email,
          payload,
          idempotencyKey: `${buildTestIdempotencyKey(eventType, runId)}:email`,
        });
      }

      if (phoneNumber) {
        jobs.push({
          eventType,
          channel: "SMS",
          target: phoneNumber,
          payload,
          idempotencyKey: `${buildTestIdempotencyKey(eventType, runId)}:sms`,
        });
      }

      await jobRepo.createMany(jobs);
      return {
        jobCount: jobs.length,
        runId,
        ids: { requestId, organizationId, placeId },
        eventType,
      };
    }),

  enqueueClaimReviewedTest: adminProcedure
    .input(
      baseTargetSchema.merge(
        z.object({
          status: z.enum(["APPROVED", "REJECTED"]),
          placeName: z.string().min(1),
          reviewNotes: z.string().optional().or(z.literal("")),
        }),
      ),
    )
    .mutation(async ({ input }) => {
      const email = toEmail(input.email);
      const phoneNumber = toPhone(input.phoneNumber);
      if (!email && !phoneNumber) {
        return { jobCount: 0, message: "Provide email and/or phoneNumber" };
      }

      const jobRepo = makeNotificationDeliveryJobRepository();
      const runId = globalThis.crypto.randomUUID();
      const requestId = globalThis.crypto.randomUUID();
      const organizationId = globalThis.crypto.randomUUID();
      const placeId = globalThis.crypto.randomUUID();

      const eventType =
        input.status === "APPROVED"
          ? "claim_request.approved"
          : "claim_request.rejected";

      const payload = {
        requestId,
        organizationId,
        placeId,
        placeName: input.placeName,
        status: input.status,
        reviewNotes: input.reviewNotes?.trim()
          ? input.reviewNotes.trim()
          : null,
      };

      const jobs: InsertNotificationDeliveryJob[] = [];

      if (email) {
        jobs.push({
          eventType,
          channel: "EMAIL",
          target: email,
          payload,
          idempotencyKey: `${buildTestIdempotencyKey(eventType, runId)}:email`,
        });
      }

      if (phoneNumber) {
        jobs.push({
          eventType,
          channel: "SMS",
          target: phoneNumber,
          payload,
          idempotencyKey: `${buildTestIdempotencyKey(eventType, runId)}:sms`,
        });
      }

      await jobRepo.createMany(jobs);
      return {
        jobCount: jobs.length,
        runId,
        ids: { requestId, organizationId, placeId },
        eventType,
      };
    }),

  dispatchNow: adminProcedure
    .input(
      z.object({
        confirm: z.literal(true),
      }),
    )
    .mutation(async ({ ctx }) => {
      const cronSecret = process.env.CRON_SECRET;
      const headers: Record<string, string> = {};
      if (process.env.NODE_ENV === "production" && !cronSecret) {
        return {
          ok: false,
          status: 500,
          body: "CRON_SECRET is not configured",
        };
      }
      if (cronSecret) {
        headers.authorization = `Bearer ${cronSecret}`;
      }

      const appUrl = ctx.origin;
      const url = `${appUrl}/api/cron/dispatch-notification-delivery`;
      const res = await fetch(url, { method: "GET", headers });
      const text = await res.text();

      if (!res.ok) {
        return {
          ok: false,
          status: res.status,
          body: text,
        };
      }

      try {
        return {
          ok: true,
          status: res.status,
          body: JSON.parse(text) as unknown,
        };
      } catch {
        return {
          ok: true,
          status: res.status,
          body: text,
        };
      }
    }),
});
