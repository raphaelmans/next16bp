import { addMinutes, differenceInMinutes } from "date-fns";
import {
  CourtNotFoundError,
  NotCourtOwnerError,
} from "@/modules/court/errors/court.errors";
import type { ICourtRepository } from "@/modules/court/repositories/court.repository";
import { CourtBlockOverlapsReservationError } from "@/modules/court-block/errors/court-block.errors";
import type { ICourtBlockRepository } from "@/modules/court-block/repositories/court-block.repository";
import type { ICourtHoursRepository } from "@/modules/court-hours/repositories/court-hours.repository";
import type { ICourtPriceOverrideRepository } from "@/modules/court-price-override/repositories/court-price-override.repository";
import type { ICourtRateRuleRepository } from "@/modules/court-rate-rule/repositories/court-rate-rule.repository";
import { GuestProfileNotFoundError } from "@/modules/guest-profile/errors/guest-profile.errors";
import type { IGuestProfileRepository } from "@/modules/guest-profile/repositories/guest-profile.repository";
import { NotOrganizationOwnerError } from "@/modules/organization/errors/organization.errors";
import type { IOrganizationRepository } from "@/modules/organization/repositories/organization.repository";
import type { IOrganizationReservationPolicyRepository } from "@/modules/organization-payment/repositories/organization-reservation-policy.repository";
import type { IPaymentProofRepository } from "@/modules/payment-proof/repositories/payment-proof.repository";
import { PlaceNotFoundError } from "@/modules/place/errors/place.errors";
import type { IPlaceRepository } from "@/modules/place/repositories/place.repository";
import type { ReservationRecord } from "@/shared/infra/db/schema";
import { logger } from "@/shared/infra/logger";
import type { RequestContext } from "@/shared/kernel/context";
import type { TransactionManager } from "@/shared/kernel/transaction";
import { computeSchedulePrice } from "@/shared/lib/schedule-availability";
import type {
  ConfirmPaidOfflineDTO,
  ConfirmPaymentDTO,
  CreateGuestBookingDTO,
  GetActiveForCourtRangeDTO,
  GetOrgReservationsDTO,
  RejectReservationDTO,
  ReservationWithDetails,
} from "../dtos";
import {
  InvalidReservationStatusError,
  ReservationDurationInvalidError,
  ReservationExpiredError,
  ReservationNotFoundError,
  ReservationPaymentNotRequiredError,
  ReservationPricingUnavailableError,
  ReservationTimeRangeInvalidError,
} from "../errors/reservation.errors";
import type { IReservationRepository } from "../repositories/reservation.repository";
import type { IReservationEventRepository } from "../repositories/reservation-event.repository";

const DEFAULT_PAYMENT_HOLD_MINUTES = 45;

export interface IReservationOwnerService {
  acceptReservation(
    userId: string,
    reservationId: string,
  ): Promise<ReservationRecord>;
  confirmPayment(
    userId: string,
    data: ConfirmPaymentDTO,
  ): Promise<ReservationRecord>;
  confirmPaidOffline(
    userId: string,
    data: ConfirmPaidOfflineDTO,
  ): Promise<ReservationRecord>;
  rejectReservation(
    userId: string,
    data: RejectReservationDTO,
  ): Promise<ReservationRecord>;
  createGuestBooking(
    userId: string,
    data: CreateGuestBookingDTO,
  ): Promise<ReservationRecord>;
  getActiveForCourtRange(
    userId: string,
    data: GetActiveForCourtRangeDTO,
  ): Promise<ReservationRecord[]>;
  getPendingForCourt(
    userId: string,
    courtId: string,
  ): Promise<ReservationRecord[]>;
  getForOrganization(
    userId: string,
    filters: GetOrgReservationsDTO,
  ): Promise<ReservationWithDetails[]>;
  getPendingCount(userId: string, organizationId: string): Promise<number>;
}

export class ReservationOwnerService implements IReservationOwnerService {
  constructor(
    private reservationRepository: IReservationRepository,
    private reservationEventRepository: IReservationEventRepository,
    private courtRepository: ICourtRepository,
    private placeRepository: IPlaceRepository,
    private organizationReservationPolicyRepository: IOrganizationReservationPolicyRepository,
    private organizationRepository: IOrganizationRepository,
    private transactionManager: TransactionManager,
    private paymentProofRepository?: IPaymentProofRepository,
    private guestProfileRepository?: IGuestProfileRepository,
    private courtHoursRepository?: ICourtHoursRepository,
    private courtRateRuleRepository?: ICourtRateRuleRepository,
    private courtPriceOverrideRepository?: ICourtPriceOverrideRepository,
    private courtBlockRepository?: ICourtBlockRepository,
  ) {}

  private requireCourtPlaceId(placeId: string | null): string {
    if (!placeId) {
      throw new PlaceNotFoundError();
    }
    return placeId;
  }

  /**
   * Verify that the user owns the place for a court.
   */
  private async verifyCourtOwnership(
    userId: string,
    courtId: string,
    ctx?: RequestContext,
  ): Promise<void> {
    const court = await this.courtRepository.findById(courtId, ctx);
    if (!court) {
      throw new CourtNotFoundError(courtId);
    }

    const placeId = this.requireCourtPlaceId(court.placeId);
    const place = await this.placeRepository.findById(placeId, ctx);
    if (!place) {
      throw new PlaceNotFoundError(placeId);
    }

    if (!place.organizationId) {
      throw new NotCourtOwnerError();
    }

    const org = await this.organizationRepository.findById(
      place.organizationId,
      ctx,
    );
    if (!org || org.ownerUserId !== userId) {
      throw new NotCourtOwnerError();
    }
  }

  private async getPaymentHoldMinutes(
    courtId: string,
    ctx?: RequestContext,
  ): Promise<number> {
    const court = await this.courtRepository.findById(courtId, ctx);
    if (!court) {
      throw new CourtNotFoundError(courtId);
    }

    const placeId = this.requireCourtPlaceId(court.placeId);
    const place = await this.placeRepository.findById(placeId, ctx);
    if (!place) {
      throw new PlaceNotFoundError(placeId);
    }

    if (!place.organizationId) {
      return DEFAULT_PAYMENT_HOLD_MINUTES;
    }

    const policy =
      await this.organizationReservationPolicyRepository.ensureForOrganization(
        place.organizationId,
        ctx,
      );

    return policy.paymentHoldMinutes ?? DEFAULT_PAYMENT_HOLD_MINUTES;
  }

  async acceptReservation(
    userId: string,
    reservationId: string,
  ): Promise<ReservationRecord> {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };

      const reservation = await this.reservationRepository.findByIdForUpdate(
        reservationId,
        ctx,
      );
      if (!reservation) {
        throw new ReservationNotFoundError(reservationId);
      }

      await this.verifyCourtOwnership(userId, reservation.courtId, ctx);

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
        const paymentHoldMinutes = await this.getPaymentHoldMinutes(
          reservation.courtId,
          ctx,
        );
        const expiresAt = addMinutes(now, paymentHoldMinutes);

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
            notes: "Owner accepted reservation - awaiting payment",
          },
          ctx,
        );

        logger.info(
          {
            event: "reservation.accepted",
            reservationId,
            ownerId: userId,
            status: "AWAITING_PAYMENT",
          },
          "Reservation accepted by owner",
        );

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
          notes: "Owner accepted reservation - free booking",
        },
        ctx,
      );

      logger.info(
        {
          event: "reservation.confirmed",
          reservationId,
          ownerId: userId,
        },
        "Reservation confirmed by owner",
      );

      return updated;
    });
  }

  async confirmPayment(
    userId: string,
    data: ConfirmPaymentDTO,
  ): Promise<ReservationRecord> {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };

      const reservation = await this.reservationRepository.findByIdForUpdate(
        data.reservationId,
        ctx,
      );

      if (!reservation) {
        throw new ReservationNotFoundError(data.reservationId);
      }

      await this.verifyCourtOwnership(userId, reservation.courtId, ctx);

      if (reservation.status !== "PAYMENT_MARKED_BY_USER") {
        throw new InvalidReservationStatusError(
          data.reservationId,
          reservation.status,
          ["PAYMENT_MARKED_BY_USER"],
        );
      }

      if (
        reservation.expiresAt &&
        new Date(reservation.expiresAt) < new Date()
      ) {
        throw new ReservationExpiredError(data.reservationId);
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
          notes: data.notes ?? "Payment confirmed by owner",
        },
        ctx,
      );

      logger.info(
        {
          event: "reservation.confirmed",
          reservationId: data.reservationId,
          ownerId: userId,
        },
        "Reservation payment confirmed by owner",
      );

      return updated;
    });
  }

  async confirmPaidOffline(
    userId: string,
    data: ConfirmPaidOfflineDTO,
  ): Promise<ReservationRecord> {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };

      const reservation = await this.reservationRepository.findByIdForUpdate(
        data.reservationId,
        ctx,
      );
      if (!reservation) {
        throw new ReservationNotFoundError(data.reservationId);
      }

      await this.verifyCourtOwnership(userId, reservation.courtId, ctx);

      if (reservation.status !== "CREATED") {
        throw new InvalidReservationStatusError(
          data.reservationId,
          reservation.status,
          ["CREATED"],
        );
      }

      if (reservation.totalPriceCents <= 0) {
        throw new ReservationPaymentNotRequiredError({
          reservationId: data.reservationId,
          totalPriceCents: reservation.totalPriceCents,
        });
      }

      if (
        reservation.expiresAt &&
        new Date(reservation.expiresAt) < new Date()
      ) {
        throw new ReservationExpiredError(data.reservationId);
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

      // Create payment proof record for audit trail
      if (this.paymentProofRepository) {
        await this.paymentProofRepository.create(
          {
            reservationId: data.reservationId,
            referenceNumber: data.paymentReference,
            notes: "Paid offline",
            fileUrl: null,
          },
          ctx,
        );
      }

      await this.reservationEventRepository.create(
        {
          reservationId: data.reservationId,
          fromStatus: "CREATED",
          toStatus: "CONFIRMED",
          triggeredByUserId: userId,
          triggeredByRole: "OWNER",
          notes: `Owner confirmed - paid offline (ref: ${data.paymentReference})`,
        },
        ctx,
      );

      logger.info(
        {
          event: "reservation.confirmed_paid_offline",
          reservationId: data.reservationId,
          ownerId: userId,
          paymentReference: data.paymentReference,
        },
        "Reservation confirmed as paid offline by owner",
      );

      return updated;
    });
  }

  async rejectReservation(
    userId: string,
    data: RejectReservationDTO,
  ): Promise<ReservationRecord> {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };

      const reservation = await this.reservationRepository.findByIdForUpdate(
        data.reservationId,
        ctx,
      );
      if (!reservation) {
        throw new ReservationNotFoundError(data.reservationId);
      }

      await this.verifyCourtOwnership(userId, reservation.courtId, ctx);

      if (
        reservation.status !== "CREATED" &&
        reservation.status !== "AWAITING_PAYMENT" &&
        reservation.status !== "PAYMENT_MARKED_BY_USER"
      ) {
        throw new InvalidReservationStatusError(
          data.reservationId,
          reservation.status,
          ["CREATED", "AWAITING_PAYMENT", "PAYMENT_MARKED_BY_USER"],
        );
      }

      const previousStatus = reservation.status;

      const updated = await this.reservationRepository.update(
        data.reservationId,
        {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancellationReason: data.reason,
          expiresAt: null,
        },
        ctx,
      );

      await this.reservationEventRepository.create(
        {
          reservationId: data.reservationId,
          fromStatus: previousStatus,
          toStatus: "CANCELLED",
          triggeredByUserId: userId,
          triggeredByRole: "OWNER",
          notes: `Rejected by owner: ${data.reason}`,
        },
        ctx,
      );

      logger.info(
        {
          event: "reservation.rejected",
          reservationId: data.reservationId,
          ownerId: userId,
          reason: data.reason,
        },
        "Reservation rejected by owner",
      );

      return updated;
    });
  }

  async createGuestBooking(
    userId: string,
    data: CreateGuestBookingDTO,
  ): Promise<ReservationRecord> {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };

      const court = await this.courtRepository.findById(data.courtId, ctx);
      if (!court) {
        throw new CourtNotFoundError(data.courtId);
      }

      const placeId = this.requireCourtPlaceId(court.placeId);
      const place = await this.placeRepository.findById(placeId, ctx);
      if (!place) {
        throw new PlaceNotFoundError(placeId);
      }

      if (!place.organizationId) {
        throw new NotCourtOwnerError();
      }

      const org = await this.organizationRepository.findById(
        place.organizationId,
        ctx,
      );
      if (!org || org.ownerUserId !== userId) {
        throw new NotCourtOwnerError();
      }

      // Verify guest profile exists and belongs to same org
      if (!this.guestProfileRepository) {
        throw new Error("GuestProfileRepository not configured");
      }
      const guest = await this.guestProfileRepository.findById(
        data.guestProfileId,
        ctx,
      );
      if (!guest || guest.organizationId !== place.organizationId) {
        throw new GuestProfileNotFoundError(data.guestProfileId);
      }

      const startTime = new Date(data.startTime);
      const endTime = new Date(data.endTime);

      if (
        Number.isNaN(startTime.getTime()) ||
        Number.isNaN(endTime.getTime()) ||
        endTime <= startTime
      ) {
        throw new ReservationTimeRangeInvalidError({
          startTime: data.startTime,
          endTime: data.endTime,
        });
      }

      const durationMinutes = differenceInMinutes(endTime, startTime);

      if (durationMinutes <= 0 || durationMinutes % 60 !== 0) {
        throw new ReservationDurationInvalidError({
          durationMinutes,
        });
      }

      // Check overlaps with existing reservations
      const overlappingReservations =
        await this.reservationRepository.findOverlappingActiveByCourtIds(
          [data.courtId],
          startTime,
          endTime,
          ctx,
        );
      if (overlappingReservations.length > 0) {
        throw new CourtBlockOverlapsReservationError({
          courtId: data.courtId,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        });
      }

      // Check overlaps with court blocks
      if (this.courtBlockRepository) {
        const overlappingBlocks =
          await this.courtBlockRepository.findOverlappingByCourtIds(
            [data.courtId],
            startTime,
            endTime,
            {},
            ctx,
          );
        if (overlappingBlocks.length > 0) {
          throw new CourtBlockOverlapsReservationError({
            courtId: data.courtId,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
          });
        }
      }

      if (
        !this.courtHoursRepository ||
        !this.courtRateRuleRepository ||
        !this.courtPriceOverrideRepository
      ) {
        throw new ReservationPricingUnavailableError({
          courtId: data.courtId,
          startTime: data.startTime,
          durationMinutes,
        });
      }

      const [hours, rules, overrides] = await Promise.all([
        this.courtHoursRepository.findByCourtIds([data.courtId], ctx),
        this.courtRateRuleRepository.findByCourtIds([data.courtId], ctx),
        this.courtPriceOverrideRepository.findOverlappingByCourtIds(
          [data.courtId],
          startTime,
          endTime,
          ctx,
        ),
      ]);

      const pricing = computeSchedulePrice({
        startTime,
        durationMinutes,
        timeZone: place.timeZone,
        hoursWindows: hours,
        rateRules: rules,
        priceOverrides: overrides,
      });

      if (!pricing) {
        throw new ReservationPricingUnavailableError({
          courtId: data.courtId,
          startTime: data.startTime,
          durationMinutes,
        });
      }

      const totalPriceCents = pricing.totalPriceCents;
      const currency = pricing.currency;

      const now = new Date();

      const created = await this.reservationRepository.create(
        {
          courtId: data.courtId,
          startTime,
          endTime,
          totalPriceCents,
          currency,
          playerId: null,
          guestProfileId: data.guestProfileId,
          playerNameSnapshot: guest.displayName,
          playerEmailSnapshot: guest.email ?? null,
          playerPhoneSnapshot: guest.phoneNumber ?? null,
          status: "CONFIRMED",
          confirmedAt: now,
          expiresAt: null,
        },
        ctx,
      );

      await this.reservationEventRepository.create(
        {
          reservationId: created.id,
          fromStatus: null,
          toStatus: "CONFIRMED",
          triggeredByUserId: userId,
          triggeredByRole: "OWNER",
          notes: data.notes ?? "Owner created guest booking",
        },
        ctx,
      );

      logger.info(
        {
          event: "reservation.guest_booking_created",
          reservationId: created.id,
          courtId: data.courtId,
          guestProfileId: data.guestProfileId,
          ownerId: userId,
          totalPriceCents,
        },
        "Guest booking created by owner",
      );

      return created;
    });
  }

  async getActiveForCourtRange(
    userId: string,
    data: GetActiveForCourtRangeDTO,
  ): Promise<ReservationRecord[]> {
    await this.verifyCourtOwnership(userId, data.courtId);

    return this.reservationRepository.findOverlappingActiveByCourtIds(
      [data.courtId],
      new Date(data.startTime),
      new Date(data.endTime),
    );
  }

  async getPendingForCourt(
    userId: string,
    courtId: string,
  ): Promise<ReservationRecord[]> {
    await this.verifyCourtOwnership(userId, courtId);

    const created = await this.reservationRepository.findByCourtIdAndStatus(
      courtId,
      "CREATED",
    );
    const paymentMarked =
      await this.reservationRepository.findByCourtIdAndStatus(
        courtId,
        "PAYMENT_MARKED_BY_USER",
      );

    const unique = new Map(
      [...created, ...paymentMarked].map((reservation) => [
        reservation.id,
        reservation,
      ]),
    );

    return Array.from(unique.values());
  }

  async getForOrganization(
    userId: string,
    filters: GetOrgReservationsDTO,
  ): Promise<ReservationWithDetails[]> {
    const org = await this.organizationRepository.findById(
      filters.organizationId,
    );
    if (!org || org.ownerUserId !== userId) {
      throw new NotOrganizationOwnerError();
    }

    return this.reservationRepository.findWithDetailsByOrganization(
      filters.organizationId,
      {
        reservationId: filters.reservationId,
        placeId: filters.placeId,
        courtId: filters.courtId,
        status: filters.status,
        limit: filters.limit,
        offset: filters.offset,
      },
    );
  }

  async getPendingCount(
    userId: string,
    organizationId: string,
  ): Promise<number> {
    const org = await this.organizationRepository.findById(organizationId);
    if (!org || org.ownerUserId !== userId) {
      throw new NotOrganizationOwnerError();
    }

    return this.reservationRepository.countByOrganizationAndStatuses(
      organizationId,
      ["CREATED", "PAYMENT_MARKED_BY_USER"],
    );
  }
}
