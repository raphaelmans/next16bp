import type { IReservableCourtDetailRepository } from "@/modules/court/repositories/reservable-court-detail.repository";
import type { IProfileRepository } from "@/modules/profile/repositories/profile.repository";
import { SlotNotFoundError } from "@/modules/time-slot/errors/time-slot.errors";
import type { ITimeSlotRepository } from "@/modules/time-slot/repositories/time-slot.repository";
import type { ReservationRecord } from "@/shared/infra/db/schema";
import { logger } from "@/shared/infra/logger";
import type { RequestContext } from "@/shared/kernel/context";
import type { TransactionManager } from "@/shared/kernel/transaction";
import type {
  CancelReservationDTO,
  GetMyReservationsDTO,
  MarkPaymentDTO,
} from "../dtos";
import {
  InvalidReservationStatusError,
  NotReservationOwnerError,
  ReservationCancellationWindowError,
  ReservationExpiredError,
  ReservationNotFoundError,
  TermsNotAcceptedError,
} from "../errors/reservation.errors";
import type { IReservationRepository } from "../repositories/reservation.repository";
import type { IReservationEventRepository } from "../repositories/reservation-event.repository";
import type { ICreateFreeReservationUseCase } from "../use-cases/create-free-reservation.use-case";
import type { ICreatePaidReservationUseCase } from "../use-cases/create-paid-reservation.use-case";

const DEFAULT_PAYMENT_HOLD_MINUTES = 15;
const DEFAULT_OWNER_REVIEW_MINUTES = 15;
const DEFAULT_CANCELLATION_CUTOFF_MINUTES = 0;
const DEFAULT_REQUIRES_OWNER_CONFIRMATION = true;

export interface IReservationService {
  createReservation(
    userId: string,
    profileId: string,
    timeSlotId: string,
  ): Promise<ReservationRecord>;
  markPayment(
    userId: string,
    profileId: string,
    data: MarkPaymentDTO,
  ): Promise<ReservationRecord>;
  cancelReservation(
    userId: string,
    profileId: string,
    data: CancelReservationDTO,
  ): Promise<ReservationRecord>;
  getReservationById(reservationId: string): Promise<ReservationRecord>;
  getMyReservations(
    profileId: string,
    filters: GetMyReservationsDTO,
  ): Promise<ReservationRecord[]>;
}

export class ReservationService implements IReservationService {
  constructor(
    private reservationRepository: IReservationRepository,
    private reservationEventRepository: IReservationEventRepository,
    private timeSlotRepository: ITimeSlotRepository,
    _profileRepository: IProfileRepository,
    private reservableCourtDetailRepository: IReservableCourtDetailRepository,
    private createFreeReservationUseCase: ICreateFreeReservationUseCase,
    private createPaidReservationUseCase: ICreatePaidReservationUseCase,
    private transactionManager: TransactionManager,
  ) {}

  async createReservation(
    userId: string,
    profileId: string,
    timeSlotId: string,
  ): Promise<ReservationRecord> {
    // Determine if this is a free or paid court
    const slot = await this.timeSlotRepository.findById(timeSlotId);
    if (!slot) {
      throw new SlotNotFoundError(timeSlotId);
    }

    const courtDetail =
      await this.reservableCourtDetailRepository.findByCourtId(slot.courtId);
    const defaultPriceCents = courtDetail?.defaultPriceCents ?? null;
    const paymentHoldMinutes =
      courtDetail?.paymentHoldMinutes ?? DEFAULT_PAYMENT_HOLD_MINUTES;

    // Free if court is marked free or both slot and default prices are missing
    const isFree =
      courtDetail?.isFree || (slot.priceCents === null && !defaultPriceCents);

    if (isFree) {
      return this.createFreeReservationUseCase.execute(
        userId,
        profileId,
        timeSlotId,
      );
    } else {
      return this.createPaidReservationUseCase.execute(
        userId,
        profileId,
        timeSlotId,
        paymentHoldMinutes,
      );
    }
  }

  async markPayment(
    userId: string,
    profileId: string,
    data: MarkPaymentDTO,
  ): Promise<ReservationRecord> {
    if (!data.termsAccepted) {
      throw new TermsNotAcceptedError();
    }

    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };

      const reservation = await this.reservationRepository.findByIdForUpdate(
        data.reservationId,
        ctx,
      );

      if (!reservation) {
        throw new ReservationNotFoundError(data.reservationId);
      }

      // Verify ownership
      if (reservation.playerId !== profileId) {
        throw new NotReservationOwnerError();
      }

      // Verify status
      if (reservation.status !== "AWAITING_PAYMENT") {
        throw new InvalidReservationStatusError(
          data.reservationId,
          reservation.status,
          ["AWAITING_PAYMENT"],
        );
      }

      // Check expiration
      if (
        reservation.expiresAt &&
        new Date(reservation.expiresAt) < new Date()
      ) {
        throw new ReservationExpiredError(data.reservationId);
      }

      const slot = await this.timeSlotRepository.findById(
        reservation.timeSlotId,
        ctx,
      );
      if (!slot) {
        throw new SlotNotFoundError(reservation.timeSlotId);
      }

      const courtDetail =
        await this.reservableCourtDetailRepository.findByCourtId(
          slot.courtId,
          ctx,
        );

      const requiresOwnerConfirmation =
        courtDetail?.requiresOwnerConfirmation ??
        DEFAULT_REQUIRES_OWNER_CONFIRMATION;
      const ownerReviewMinutes =
        courtDetail?.ownerReviewMinutes ?? DEFAULT_OWNER_REVIEW_MINUTES;
      const now = new Date();

      if (requiresOwnerConfirmation) {
        const reviewExpiresAt = new Date(now);
        reviewExpiresAt.setMinutes(
          reviewExpiresAt.getMinutes() + ownerReviewMinutes,
        );

        const updated = await this.reservationRepository.update(
          data.reservationId,
          {
            status: "PAYMENT_MARKED_BY_USER",
            termsAcceptedAt: now,
            expiresAt: reviewExpiresAt,
          },
          ctx,
        );

        await this.reservationEventRepository.create(
          {
            reservationId: data.reservationId,
            fromStatus: "AWAITING_PAYMENT",
            toStatus: "PAYMENT_MARKED_BY_USER",
            triggeredByUserId: userId,
            triggeredByRole: "PLAYER",
            notes: "Player marked payment as complete",
          },
          ctx,
        );

        logger.info(
          {
            event: "reservation.payment_marked",
            reservationId: data.reservationId,
            playerId: profileId,
          },
          "Player marked payment",
        );

        return updated;
      }

      const updated = await this.reservationRepository.update(
        data.reservationId,
        {
          status: "CONFIRMED",
          confirmedAt: now,
          termsAcceptedAt: now,
          expiresAt: null,
        },
        ctx,
      );

      await this.timeSlotRepository.update(
        reservation.timeSlotId,
        { status: "BOOKED" },
        ctx,
      );

      await this.reservationEventRepository.create(
        {
          reservationId: data.reservationId,
          fromStatus: "AWAITING_PAYMENT",
          toStatus: "CONFIRMED",
          triggeredByUserId: userId,
          triggeredByRole: "PLAYER",
          notes: "Auto-confirmed after payment",
        },
        ctx,
      );

      logger.info(
        {
          event: "reservation.confirmed",
          reservationId: data.reservationId,
          playerId: profileId,
        },
        "Reservation auto-confirmed after payment",
      );

      return updated;
    });
  }

  async cancelReservation(
    userId: string,
    profileId: string,
    data: CancelReservationDTO,
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

      // Verify ownership
      if (reservation.playerId !== profileId) {
        throw new NotReservationOwnerError();
      }

      // Block cancellation for terminal states
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

      const slot = await this.timeSlotRepository.findById(
        reservation.timeSlotId,
        ctx,
      );
      if (!slot) {
        throw new SlotNotFoundError(reservation.timeSlotId);
      }

      const courtDetail =
        await this.reservableCourtDetailRepository.findByCourtId(
          slot.courtId,
          ctx,
        );
      const cancellationCutoffMinutes =
        courtDetail?.cancellationCutoffMinutes ??
        DEFAULT_CANCELLATION_CUTOFF_MINUTES;
      const cutoffTime = new Date(slot.startTime);
      cutoffTime.setMinutes(
        cutoffTime.getMinutes() - cancellationCutoffMinutes,
      );

      if (new Date() > cutoffTime) {
        throw new ReservationCancellationWindowError(
          data.reservationId,
          cancellationCutoffMinutes,
          cutoffTime,
        );
      }

      const previousStatus = reservation.status;

      // Update reservation status
      const updated = await this.reservationRepository.update(
        data.reservationId,
        {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancellationReason: data.reason,
        },
        ctx,
      );

      // Release the time slot back to AVAILABLE
      await this.timeSlotRepository.update(
        reservation.timeSlotId,
        { status: "AVAILABLE" },
        ctx,
      );

      // Create audit event
      await this.reservationEventRepository.create(
        {
          reservationId: data.reservationId,
          fromStatus: previousStatus,
          toStatus: "CANCELLED",
          triggeredByUserId: userId,
          triggeredByRole: "PLAYER",
          notes: data.reason ?? "Cancelled by player",
        },
        ctx,
      );

      logger.info(
        {
          event: "reservation.cancelled",
          reservationId: data.reservationId,
          playerId: profileId,
          previousStatus,
          reason: data.reason,
        },
        "Reservation cancelled by player",
      );

      return updated;
    });
  }

  async getReservationById(reservationId: string): Promise<ReservationRecord> {
    const reservation =
      await this.reservationRepository.findById(reservationId);
    if (!reservation) {
      throw new ReservationNotFoundError(reservationId);
    }
    return reservation;
  }

  async getMyReservations(
    profileId: string,
    filters: GetMyReservationsDTO,
  ): Promise<ReservationRecord[]> {
    return this.reservationRepository.findByPlayerId(
      profileId,
      { limit: filters.limit, offset: filters.offset },
      { status: filters.status, upcoming: filters.upcoming },
    );
  }
}
