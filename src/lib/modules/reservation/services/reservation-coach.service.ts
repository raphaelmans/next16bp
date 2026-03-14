import { addDays, addMinutes, endOfDay } from "date-fns";
import { MAX_BOOKING_WINDOW_DAYS } from "@/common/booking-window";
import { env } from "@/lib/env";
import { postCoachReservationMessage } from "@/lib/modules/chat/ops/post-coach-reservation-message";
import {
  CoachNotActiveError,
  CoachNotFoundError,
} from "@/lib/modules/coach/errors/coach.errors";
import type { ICoachRepository } from "@/lib/modules/coach/repositories/coach.repository";
import type { ICoachAddonRepository } from "@/lib/modules/coach-addon/repositories/coach-addon.repository";
import type { ICoachBlockRepository } from "@/lib/modules/coach-block/repositories/coach-block.repository";
import type { ICoachHoursRepository } from "@/lib/modules/coach-hours/repositories/coach-hours.repository";
import type { ICoachRateRuleRepository } from "@/lib/modules/coach-rate-rule/repositories/coach-rate-rule.repository";
import type { NotificationDeliveryService } from "@/lib/modules/notification-delivery/services/notification-delivery.service";
import type { IPaymentProofRepository } from "@/lib/modules/payment-proof/repositories/payment-proof.repository";
import {
  IncompleteProfileError,
  ProfileNotFoundError,
} from "@/lib/modules/profile/errors/profile.errors";
import type { IProfileRepository } from "@/lib/modules/profile/repositories/profile.repository";
import { STORAGE_BUCKETS } from "@/lib/modules/storage/dtos";
import type { IObjectStorageService } from "@/lib/modules/storage/services/object-storage.service";
import type {
  CoachRecord,
  PaymentProofRecord,
  ReservationEventRecord,
  ReservationRecord,
} from "@/lib/shared/infra/db/schema";
import { logger } from "@/lib/shared/infra/logger";
import type { RequestContext } from "@/lib/shared/kernel/context";
import type { TransactionManager } from "@/lib/shared/kernel/transaction";
import {
  computeSchedulePriceDetailed,
  type ScheduleAddon,
} from "@/lib/shared/lib/schedule-availability";
import { getInvalidSelectedAddonIds } from "@/lib/shared/lib/selected-addon-validation";
import type {
  CancelCoachReservationDTO,
  CoachReservationWithDetails,
  ConfirmCoachPaymentDTO,
  CreateReservationForCoachDTO,
  GetCoachReservationsDTO,
  RejectCoachReservationDTO,
} from "../dtos/reservation-coach.dto";
import {
  BookingWindowExceededError,
  InvalidReservationAddonSelectionError,
  InvalidReservationStatusError,
  NoAvailabilityError,
  ReservationExpiredError,
  ReservationNotFoundError,
  ReservationStartTimeInPastError,
} from "../errors/reservation.errors";
import type { IReservationRepository } from "../repositories/reservation.repository";
import type { IReservationEventRepository } from "../repositories/reservation-event.repository";

const DEFAULT_OWNER_REVIEW_MINUTES = 45;
const DEFAULT_PAYMENT_HOLD_MINUTES = 45;

export interface CoachReservationCreationResult extends ReservationRecord {
  coachName: string;
  totalPriceCents: number;
  currency: string;
  pricingWarnings: string[];
}

export interface CoachReservationDetail {
  reservation: ReservationRecord;
  events: ReservationEventRecord[];
  coach: CoachRecord;
  paymentProof: {
    id: string;
    referenceNumber: string | null;
    notes: string | null;
    fileUrl: string | null;
    createdAt: string;
  } | null;
}

export interface ICoachReservationService {
  createForCoach(
    userId: string,
    profileId: string,
    data: CreateReservationForCoachDTO,
  ): Promise<CoachReservationCreationResult>;
  acceptReservation(
    userId: string,
    reservationId: string,
  ): Promise<ReservationRecord>;
  rejectReservation(
    userId: string,
    data: RejectCoachReservationDTO,
  ): Promise<ReservationRecord>;
  confirmPayment(
    userId: string,
    data: ConfirmCoachPaymentDTO,
  ): Promise<ReservationRecord>;
  cancelReservation(
    userId: string,
    data: CancelCoachReservationDTO,
  ): Promise<ReservationRecord>;
  getForCoach(
    userId: string,
    filters: GetCoachReservationsDTO,
  ): Promise<CoachReservationWithDetails[]>;
  getReservationDetail(
    userId: string,
    reservationId: string,
  ): Promise<CoachReservationDetail>;
  getPendingCount(userId: string): Promise<number>;
}

export class CoachReservationService implements ICoachReservationService {
  constructor(
    private reservationRepository: IReservationRepository,
    private reservationEventRepository: IReservationEventRepository,
    private profileRepository: IProfileRepository,
    private coachRepository: ICoachRepository,
    private coachHoursRepository: ICoachHoursRepository,
    private coachRateRuleRepository: ICoachRateRuleRepository,
    private coachAddonRepository: ICoachAddonRepository,
    private coachBlockRepository: ICoachBlockRepository,
    private transactionManager: TransactionManager,
    private notificationDeliveryService: NotificationDeliveryService,
    private paymentProofRepository?: IPaymentProofRepository,
    private storageService?: IObjectStorageService,
  ) {}

  private async getCoachByUserId(userId: string): Promise<CoachRecord> {
    const coach = await this.coachRepository.findByUserId(userId);
    if (!coach) {
      throw new CoachNotFoundError();
    }
    return coach;
  }

  private async verifyCoachOwnsReservation(
    userId: string,
    reservation: ReservationRecord,
  ): Promise<CoachRecord> {
    const coach = await this.getCoachByUserId(userId);
    if (reservation.coachId !== coach.id) {
      throw new ReservationNotFoundError(reservation.id);
    }
    return coach;
  }

  private assertStartTimeNotInPast(startTime: Date): void {
    const now = new Date();
    if (startTime.getTime() < now.getTime()) {
      throw new ReservationStartTimeInPastError(startTime, now);
    }
  }

  private assertWithinBookingWindow(startTime: Date): void {
    const maxStartTime = endOfDay(addDays(new Date(), MAX_BOOKING_WINDOW_DAYS));
    if (startTime > maxStartTime) {
      throw new BookingWindowExceededError(startTime, maxStartTime);
    }
  }

  private async computeCoachPricing(options: {
    coachId: string;
    startTime: Date;
    durationMinutes: number;
    timeZone: string;
    selectedAddons?: { addonId: string; quantity: number }[];
    ctx?: RequestContext;
  }): Promise<{
    endTime: Date;
    totalPriceCents: number;
    currency: string;
    pricingBreakdown: import("@/common/pricing-breakdown").PricingBreakdown;
    pricingWarnings: string[];
  } | null> {
    const { coachId, startTime, durationMinutes, timeZone, selectedAddons } =
      options;

    const [hoursWindows, rateRules, addons] = await Promise.all([
      this.coachHoursRepository.findByCoachId(coachId),
      this.coachRateRuleRepository.findByCoachId(coachId),
      this.coachAddonRepository.findActiveByCoachIds([coachId]),
    ]);

    const addonRules = await this.coachAddonRepository.findRateRulesByAddonIds(
      addons.map((addon) => addon.id),
    );

    const allowedAddonIds = new Set<string>();
    for (const addon of addons) {
      if (addon.isActive) {
        allowedAddonIds.add(addon.id);
      }
    }

    const invalidAddonIds = getInvalidSelectedAddonIds({
      selectedAddons,
      allowedAddonIds,
    });
    if (invalidAddonIds.length > 0) {
      throw new InvalidReservationAddonSelectionError({
        invalidAddonIds,
      });
    }

    const coachAddons: ScheduleAddon[] = addons.map((addon) => ({
      addon,
      rules: addonRules.filter((rule) => rule.addonId === addon.id),
    }));

    const computed = computeSchedulePriceDetailed({
      startTime,
      durationMinutes,
      timeZone,
      hoursWindows,
      rateRules,
      priceOverrides: [],
      addons: coachAddons,
      venueAddons: [],
      selectedAddons,
      enableAddonPricing: env.ENABLE_ADDON_PRICING_V2 !== false,
    });

    if (!computed.result) {
      return null;
    }

    return {
      endTime: computed.result.endTime,
      totalPriceCents: computed.result.totalPriceCents,
      currency: computed.result.currency,
      pricingBreakdown: computed.result.pricingBreakdown,
      pricingWarnings: computed.result.warnings.map(
        (warning) => warning.message,
      ),
    };
  }

  private async isCoachRangeAvailable(options: {
    coachId: string;
    startTime: Date;
    endTime: Date;
    ctx?: RequestContext;
  }): Promise<boolean> {
    const { coachId, startTime, endTime, ctx } = options;

    const [reservations, blocks] = await Promise.all([
      this.reservationRepository.findOverlappingActiveByCoachIds(
        [coachId],
        startTime,
        endTime,
        ctx,
      ),
      this.coachBlockRepository.findOverlappingByCoachId(
        coachId,
        startTime,
        endTime,
      ),
    ]);

    return reservations.length === 0 && blocks.length === 0;
  }

  private async resolvePaymentProof(
    reservationId: string,
  ): Promise<CoachReservationDetail["paymentProof"]> {
    if (!this.paymentProofRepository) {
      return null;
    }

    const proof =
      await this.paymentProofRepository.findByReservationId(reservationId);
    if (!proof) {
      return null;
    }

    return this.attachSignedPaymentProofUrl(proof);
  }

  private async attachSignedPaymentProofUrl(
    proof: PaymentProofRecord,
  ): Promise<NonNullable<CoachReservationDetail["paymentProof"]>> {
    let fileUrl = proof.fileUrl ?? null;

    if (this.storageService && proof.filePath) {
      fileUrl = await this.storageService.createSignedUrl(
        STORAGE_BUCKETS.PAYMENT_PROOFS,
        proof.filePath,
        60 * 5,
      );
    }

    return {
      id: proof.id,
      referenceNumber: proof.referenceNumber ?? null,
      notes: proof.notes ?? null,
      fileUrl,
      createdAt: proof.createdAt.toISOString(),
    };
  }

  private async postCoachChatMessageBestEffort(input: {
    reservationId: string;
    playerUserId: string;
    coachUserId: string;
    kind: "created" | "payment_marked" | "confirmed" | "cancelled";
    reason?: string;
  }) {
    try {
      await postCoachReservationMessage(input);
    } catch (error) {
      logger.warn(
        { err: error, reservationId: input.reservationId, kind: input.kind },
        "Failed to post coach reservation system chat message",
      );
    }
  }

  async createForCoach(
    userId: string,
    profileId: string,
    data: CreateReservationForCoachDTO,
  ): Promise<CoachReservationCreationResult> {
    const profile = await this.profileRepository.findById(profileId);
    if (!profile) {
      throw new ProfileNotFoundError(profileId);
    }
    if (!profile.name || !profile.email) {
      throw new IncompleteProfileError();
    }

    const coach = await this.coachRepository.findById(data.coachId);
    if (!coach) {
      throw new CoachNotFoundError(data.coachId);
    }
    if (!coach.isActive) {
      throw new CoachNotActiveError(coach.id);
    }

    const startTime = new Date(data.startTime);
    this.assertStartTimeNotInPast(startTime);
    this.assertWithinBookingWindow(startTime);

    const pricing = await this.computeCoachPricing({
      coachId: coach.id,
      startTime,
      durationMinutes: data.durationMinutes,
      timeZone: coach.timeZone,
      selectedAddons: data.selectedAddons,
    });

    if (!pricing) {
      throw new NoAvailabilityError({
        startTime: startTime.toISOString(),
        durationMinutes: data.durationMinutes,
      });
    }

    const isAvailable = await this.isCoachRangeAvailable({
      coachId: coach.id,
      startTime,
      endTime: pricing.endTime,
    });

    if (!isAvailable) {
      throw new NoAvailabilityError({
        startTime: startTime.toISOString(),
        durationMinutes: data.durationMinutes,
      });
    }

    const expiresAt = addMinutes(new Date(), DEFAULT_OWNER_REVIEW_MINUTES);

    const result = await this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };

      const overlapping =
        await this.reservationRepository.findOverlappingActiveByCoachIds(
          [coach.id],
          startTime,
          pricing.endTime,
          ctx,
        );

      if (overlapping.length > 0) {
        throw new NoAvailabilityError({
          startTime: startTime.toISOString(),
          durationMinutes: data.durationMinutes,
        });
      }

      const created = await this.reservationRepository.create(
        {
          coachId: coach.id,
          courtId: null,
          playerId: profileId,
          startTime,
          endTime: pricing.endTime,
          totalPriceCents: pricing.totalPriceCents,
          currency: pricing.currency,
          pricingBreakdown: pricing.pricingBreakdown,
          status: "CREATED",
          expiresAt,
          playerNameSnapshot: profile.name,
          playerEmailSnapshot: profile.email,
          playerPhoneSnapshot: profile.phone ?? null,
        },
        ctx,
      );

      await this.reservationEventRepository.create(
        {
          reservationId: created.id,
          fromStatus: null,
          toStatus: "CREATED",
          triggeredByUserId: userId,
          triggeredByRole: "PLAYER",
          notes: `Player booked coach session with ${coach.name}`,
        },
        ctx,
      );

      return created;
    });

    logger.info(
      {
        event: "coach_reservation.created",
        reservationId: result.id,
        coachId: coach.id,
        playerId: profileId,
        startTime: startTime.toISOString(),
        endTime: pricing.endTime.toISOString(),
        totalPriceCents: pricing.totalPriceCents,
        currency: pricing.currency,
      },
      "Coach reservation created",
    );

    try {
      await this.notificationDeliveryService.enqueueCoachBookingCreated({
        reservationId: result.id,
        coachId: coach.id,
        coachName: coach.name,
        startTimeIso: result.startTime.toISOString(),
        endTimeIso: result.endTime.toISOString(),
        totalPriceCents: result.totalPriceCents,
        currency: result.currency,
        playerName: result.playerNameSnapshot ?? profile.name,
        playerEmail: result.playerEmailSnapshot ?? profile.email,
        playerPhone: result.playerPhoneSnapshot ?? profile.phone ?? null,
        expiresAtIso: result.expiresAt?.toISOString() ?? null,
      });
    } catch (error) {
      logger.warn(
        { err: error, reservationId: result.id },
        "Failed to enqueue coach booking creation notification",
      );
    }

    await this.postCoachChatMessageBestEffort({
      reservationId: result.id,
      playerUserId: profile.userId,
      coachUserId: coach.userId,
      kind: "created",
    });

    return {
      ...result,
      coachName: coach.name,
      totalPriceCents: pricing.totalPriceCents,
      currency: pricing.currency,
      pricingWarnings: pricing.pricingWarnings,
    };
  }

  async acceptReservation(
    userId: string,
    reservationId: string,
  ): Promise<ReservationRecord> {
    const sourceReservation =
      await this.reservationRepository.findById(reservationId);
    if (!sourceReservation) {
      throw new ReservationNotFoundError(reservationId);
    }

    const coach = await this.verifyCoachOwnsReservation(
      userId,
      sourceReservation,
    );
    const playerProfile = sourceReservation.playerId
      ? await this.profileRepository.findById(sourceReservation.playerId)
      : null;

    const updated = await this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };

      const reservation = await this.reservationRepository.findByIdForUpdate(
        reservationId,
        ctx,
      );
      if (!reservation) {
        throw new ReservationNotFoundError(reservationId);
      }

      if (reservation.status !== "CREATED") {
        throw new InvalidReservationStatusError(
          reservationId,
          reservation.status,
          ["CREATED"],
        );
      }

      if (
        reservation.expiresAt &&
        new Date(reservation.expiresAt) < new Date()
      ) {
        throw new ReservationExpiredError(reservationId);
      }

      const now = new Date();

      if (reservation.totalPriceCents > 0) {
        const expiresAt = addMinutes(now, DEFAULT_PAYMENT_HOLD_MINUTES);

        const updated = await this.reservationRepository.update(
          reservationId,
          {
            status: "AWAITING_PAYMENT",
            expiresAt,
          },
          ctx,
        );

        await this.reservationEventRepository.create(
          {
            reservationId,
            fromStatus: "CREATED",
            toStatus: "AWAITING_PAYMENT",
            triggeredByUserId: userId,
            triggeredByRole: "OWNER",
            notes: "Coach accepted reservation - awaiting payment",
          },
          ctx,
        );

        logger.info(
          {
            event: "coach_reservation.accepted",
            reservationId,
            coachId: reservation.coachId,
          },
          "Coach reservation accepted",
        );

        try {
          await this.notificationDeliveryService.enqueuePlayerCoachBookingAwaitingPayment(
            {
              reservationId,
              coachId: coach.id,
              coachName: coach.name,
              startTimeIso: updated.startTime.toISOString(),
              endTimeIso: updated.endTime.toISOString(),
              expiresAtIso: expiresAt.toISOString(),
              totalPriceCents: updated.totalPriceCents,
              currency: updated.currency,
            },
            ctx,
          );
        } catch (error) {
          logger.warn(
            { err: error, reservationId },
            "Failed to enqueue coach booking awaiting-payment notification",
          );
        }

        return updated;
      }

      const updated = await this.reservationRepository.update(
        reservationId,
        {
          status: "CONFIRMED",
          confirmedAt: now,
          expiresAt: null,
        },
        ctx,
      );

      await this.reservationEventRepository.create(
        {
          reservationId,
          fromStatus: "CREATED",
          toStatus: "CONFIRMED",
          triggeredByUserId: userId,
          triggeredByRole: "OWNER",
          notes: "Coach accepted free reservation - auto-confirmed",
        },
        ctx,
      );

      logger.info(
        {
          event: "coach_reservation.confirmed",
          reservationId,
          coachId: reservation.coachId,
        },
        "Coach reservation auto-confirmed (free)",
      );

      try {
        await this.notificationDeliveryService.enqueuePlayerCoachBookingConfirmed(
          {
            reservationId,
            coachId: coach.id,
            coachName: coach.name,
            startTimeIso: updated.startTime.toISOString(),
            endTimeIso: updated.endTime.toISOString(),
          },
          ctx,
        );
      } catch (error) {
        logger.warn(
          { err: error, reservationId },
          "Failed to enqueue coach booking confirmation notification",
        );
      }

      return updated;
    });

    if (
      updated.status === "CONFIRMED" &&
      playerProfile?.userId &&
      sourceReservation.coachId
    ) {
      await this.postCoachChatMessageBestEffort({
        reservationId: updated.id,
        playerUserId: playerProfile.userId,
        coachUserId: coach.userId,
        kind: "confirmed",
      });
    }

    return updated;
  }

  async rejectReservation(
    userId: string,
    data: RejectCoachReservationDTO,
  ): Promise<ReservationRecord> {
    const sourceReservation = await this.reservationRepository.findById(
      data.reservationId,
    );
    if (!sourceReservation) {
      throw new ReservationNotFoundError(data.reservationId);
    }

    const coach = await this.verifyCoachOwnsReservation(
      userId,
      sourceReservation,
    );

    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };

      const reservation = await this.reservationRepository.findByIdForUpdate(
        data.reservationId,
        ctx,
      );
      if (!reservation) {
        throw new ReservationNotFoundError(data.reservationId);
      }

      if (reservation.status !== "CREATED") {
        throw new InvalidReservationStatusError(
          data.reservationId,
          reservation.status,
          ["CREATED"],
        );
      }

      const now = new Date();

      const updated = await this.reservationRepository.update(
        data.reservationId,
        {
          status: "CANCELLED",
          cancelledAt: now,
          cancellationReason: data.reason,
          expiresAt: null,
        },
        ctx,
      );

      await this.reservationEventRepository.create(
        {
          reservationId: data.reservationId,
          fromStatus: "CREATED",
          toStatus: "CANCELLED",
          triggeredByUserId: userId,
          triggeredByRole: "OWNER",
          notes: `Coach rejected reservation: ${data.reason}`,
        },
        ctx,
      );

      logger.info(
        {
          event: "coach_reservation.rejected",
          reservationId: data.reservationId,
          coachId: reservation.coachId,
          reason: data.reason,
        },
        "Coach reservation rejected",
      );

      try {
        await this.notificationDeliveryService.enqueuePlayerCoachBookingRejected(
          {
            reservationId: data.reservationId,
            coachId: coach.id,
            coachName: coach.name,
            startTimeIso: updated.startTime.toISOString(),
            endTimeIso: updated.endTime.toISOString(),
            reason: data.reason,
          },
          ctx,
        );
      } catch (error) {
        logger.warn(
          { err: error, reservationId: data.reservationId },
          "Failed to enqueue coach booking rejection notification",
        );
      }

      return updated;
    });
  }

  async confirmPayment(
    userId: string,
    data: ConfirmCoachPaymentDTO,
  ): Promise<ReservationRecord> {
    const sourceReservation = await this.reservationRepository.findById(
      data.reservationId,
    );
    if (!sourceReservation) {
      throw new ReservationNotFoundError(data.reservationId);
    }

    const coach = await this.verifyCoachOwnsReservation(
      userId,
      sourceReservation,
    );
    const playerProfile = sourceReservation.playerId
      ? await this.profileRepository.findById(sourceReservation.playerId)
      : null;

    const updated = await this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };

      const reservation = await this.reservationRepository.findByIdForUpdate(
        data.reservationId,
        ctx,
      );
      if (!reservation) {
        throw new ReservationNotFoundError(data.reservationId);
      }

      if (reservation.status !== "PAYMENT_MARKED_BY_USER") {
        throw new InvalidReservationStatusError(
          data.reservationId,
          reservation.status,
          ["PAYMENT_MARKED_BY_USER"],
        );
      }

      const now = new Date();

      const updated = await this.reservationRepository.update(
        data.reservationId,
        {
          status: "CONFIRMED",
          confirmedAt: now,
          expiresAt: null,
        },
        ctx,
      );

      await this.reservationEventRepository.create(
        {
          reservationId: data.reservationId,
          fromStatus: "PAYMENT_MARKED_BY_USER",
          toStatus: "CONFIRMED",
          triggeredByUserId: userId,
          triggeredByRole: "OWNER",
          notes: data.notes
            ? `Coach confirmed payment: ${data.notes}`
            : "Coach confirmed payment",
        },
        ctx,
      );

      logger.info(
        {
          event: "coach_reservation.payment_confirmed",
          reservationId: data.reservationId,
          coachId: reservation.coachId,
        },
        "Coach reservation payment confirmed",
      );

      try {
        await this.notificationDeliveryService.enqueuePlayerCoachBookingConfirmed(
          {
            reservationId: data.reservationId,
            coachId: coach.id,
            coachName: coach.name,
            startTimeIso: updated.startTime.toISOString(),
            endTimeIso: updated.endTime.toISOString(),
          },
          ctx,
        );
      } catch (error) {
        logger.warn(
          { err: error, reservationId: data.reservationId },
          "Failed to enqueue coach booking confirmation notification",
        );
      }

      return updated;
    });

    if (playerProfile?.userId) {
      await this.postCoachChatMessageBestEffort({
        reservationId: updated.id,
        playerUserId: playerProfile.userId,
        coachUserId: coach.userId,
        kind: "confirmed",
      });
    }

    return updated;
  }

  async cancelReservation(
    userId: string,
    data: CancelCoachReservationDTO,
  ): Promise<ReservationRecord> {
    const sourceReservation = await this.reservationRepository.findById(
      data.reservationId,
    );
    if (!sourceReservation) {
      throw new ReservationNotFoundError(data.reservationId);
    }

    const coach = await this.verifyCoachOwnsReservation(
      userId,
      sourceReservation,
    );
    const playerProfile = sourceReservation.playerId
      ? await this.profileRepository.findById(sourceReservation.playerId)
      : null;

    const updated = await this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };

      const reservation = await this.reservationRepository.findByIdForUpdate(
        data.reservationId,
        ctx,
      );
      if (!reservation) {
        throw new ReservationNotFoundError(data.reservationId);
      }

      if (
        reservation.status === "CANCELLED" ||
        reservation.status === "EXPIRED"
      ) {
        throw new InvalidReservationStatusError(
          data.reservationId,
          reservation.status,
          [
            "CREATED",
            "AWAITING_PAYMENT",
            "PAYMENT_MARKED_BY_USER",
            "CONFIRMED",
          ],
        );
      }

      const now = new Date();

      const updated = await this.reservationRepository.update(
        data.reservationId,
        {
          status: "CANCELLED",
          cancelledAt: now,
          cancellationReason: data.reason,
          expiresAt: null,
        },
        ctx,
      );

      await this.reservationEventRepository.create(
        {
          reservationId: data.reservationId,
          fromStatus: reservation.status,
          toStatus: "CANCELLED",
          triggeredByUserId: userId,
          triggeredByRole: "OWNER",
          notes: `Coach cancelled reservation: ${data.reason}`,
        },
        ctx,
      );

      logger.info(
        {
          event: "coach_reservation.cancelled",
          reservationId: data.reservationId,
          coachId: reservation.coachId,
          fromStatus: reservation.status,
          reason: data.reason,
        },
        "Coach reservation cancelled by coach",
      );

      try {
        await this.notificationDeliveryService.enqueueCoachBookingCancelled(
          {
            reservationId: data.reservationId,
            coachId: coach.id,
            coachName: coach.name,
            startTimeIso: updated.startTime.toISOString(),
            endTimeIso: updated.endTime.toISOString(),
            reason: data.reason,
          },
          "player",
          ctx,
        );
      } catch (error) {
        logger.warn(
          { err: error, reservationId: data.reservationId },
          "Failed to enqueue coach booking cancellation notification",
        );
      }

      return updated;
    });

    if (playerProfile?.userId) {
      await this.postCoachChatMessageBestEffort({
        reservationId: updated.id,
        playerUserId: playerProfile.userId,
        coachUserId: coach.userId,
        kind: "cancelled",
        reason: data.reason,
      });
    }

    return updated;
  }

  async getForCoach(
    userId: string,
    filters: GetCoachReservationsDTO,
  ): Promise<CoachReservationWithDetails[]> {
    const coach = await this.getCoachByUserId(userId);

    return this.reservationRepository.findWithDetailsByCoach(coach.id, {
      status: filters.status,
      statuses: filters.statuses,
      timeBucket: filters.timeBucket,
      limit: filters.limit,
      offset: filters.offset,
    });
  }

  async getReservationDetail(
    userId: string,
    reservationId: string,
  ): Promise<CoachReservationDetail> {
    const reservation =
      await this.reservationRepository.findById(reservationId);
    if (!reservation) {
      throw new ReservationNotFoundError(reservationId);
    }

    const coach = await this.verifyCoachOwnsReservation(userId, reservation);

    const [events, paymentProof] = await Promise.all([
      this.reservationEventRepository.findByReservationId(reservationId),
      this.resolvePaymentProof(reservationId),
    ]);

    return {
      reservation,
      events,
      coach,
      paymentProof,
    };
  }

  async getPendingCount(userId: string): Promise<number> {
    const coach = await this.getCoachByUserId(userId);

    return this.reservationRepository.countByCoachAndStatuses(coach.id, [
      "CREATED",
      "AWAITING_PAYMENT",
      "PAYMENT_MARKED_BY_USER",
    ]);
  }
}
