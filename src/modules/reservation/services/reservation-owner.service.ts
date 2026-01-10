import {
  CourtNotFoundError,
  NotCourtOwnerError,
} from "@/modules/court/errors/court.errors";
import type { ICourtRepository } from "@/modules/court/repositories/court.repository";
import { NotOrganizationOwnerError } from "@/modules/organization/errors/organization.errors";
import type { IOrganizationRepository } from "@/modules/organization/repositories/organization.repository";
import { SlotNotFoundError } from "@/modules/time-slot/errors/time-slot.errors";
import type { ITimeSlotRepository } from "@/modules/time-slot/repositories/time-slot.repository";
import type {
  ReservationRecord,
  TimeSlotRecord,
} from "@/shared/infra/db/schema";
import { logger } from "@/shared/infra/logger";
import type { RequestContext } from "@/shared/kernel/context";
import type { TransactionManager } from "@/shared/kernel/transaction";
import type {
  ConfirmPaymentDTO,
  GetOrgReservationsDTO,
  RejectReservationDTO,
  ReservationWithDetails,
} from "../dtos";
import {
  InvalidReservationStatusError,
  ReservationNotFoundError,
} from "../errors/reservation.errors";
import type { IReservationRepository } from "../repositories/reservation.repository";
import type { IReservationEventRepository } from "../repositories/reservation-event.repository";

export interface IReservationOwnerService {
  confirmPayment(
    userId: string,
    data: ConfirmPaymentDTO,
  ): Promise<ReservationRecord>;
  rejectReservation(
    userId: string,
    data: RejectReservationDTO,
  ): Promise<ReservationRecord>;
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
    private timeSlotRepository: ITimeSlotRepository,
    private courtRepository: ICourtRepository,
    private organizationRepository: IOrganizationRepository,
    private transactionManager: TransactionManager,
  ) {}

  /**
   * Verify that the user owns the court via organization ownership
   * Returns the time slot for the reservation
   */
  private async verifyCourtOwnership(
    userId: string,
    timeSlotId: string,
    ctx?: RequestContext,
  ): Promise<TimeSlotRecord> {
    const slot = await this.timeSlotRepository.findById(timeSlotId, ctx);
    if (!slot) {
      throw new SlotNotFoundError(timeSlotId);
    }

    const court = await this.courtRepository.findById(slot.courtId, ctx);
    if (!court) {
      throw new CourtNotFoundError(slot.courtId);
    }

    if (!court.organizationId) {
      throw new NotCourtOwnerError();
    }

    const org = await this.organizationRepository.findById(
      court.organizationId,
      ctx,
    );
    if (!org || org.ownerUserId !== userId) {
      throw new NotCourtOwnerError();
    }

    return slot;
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

      // Verify ownership
      await this.verifyCourtOwnership(userId, reservation.timeSlotId, ctx);

      // Verify status
      if (reservation.status !== "PAYMENT_MARKED_BY_USER") {
        throw new InvalidReservationStatusError(
          data.reservationId,
          reservation.status,
          ["PAYMENT_MARKED_BY_USER"],
        );
      }

      // Update reservation status to CONFIRMED
      const updated = await this.reservationRepository.update(
        data.reservationId,
        {
          status: "CONFIRMED",
          confirmedAt: new Date(),
        },
        ctx,
      );

      // Update slot status to BOOKED
      await this.timeSlotRepository.update(
        reservation.timeSlotId,
        { status: "BOOKED" },
        ctx,
      );

      // Create audit event
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

      // Verify ownership
      await this.verifyCourtOwnership(userId, reservation.timeSlotId, ctx);

      // Verify status - can reject AWAITING_PAYMENT or PAYMENT_MARKED_BY_USER
      if (
        reservation.status !== "AWAITING_PAYMENT" &&
        reservation.status !== "PAYMENT_MARKED_BY_USER"
      ) {
        throw new InvalidReservationStatusError(
          data.reservationId,
          reservation.status,
          ["AWAITING_PAYMENT", "PAYMENT_MARKED_BY_USER"],
        );
      }

      const previousStatus = reservation.status;

      // Update reservation status to CANCELLED
      const updated = await this.reservationRepository.update(
        data.reservationId,
        {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancellationReason: data.reason,
        },
        ctx,
      );

      // Release slot back to AVAILABLE
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

  async getPendingForCourt(
    userId: string,
    courtId: string,
  ): Promise<ReservationRecord[]> {
    // Verify user owns this court
    const court = await this.courtRepository.findById(courtId);
    if (!court) {
      throw new CourtNotFoundError(courtId);
    }

    if (!court.organizationId) {
      throw new NotCourtOwnerError();
    }

    const org = await this.organizationRepository.findById(
      court.organizationId,
    );
    if (!org || org.ownerUserId !== userId) {
      throw new NotCourtOwnerError();
    }

    // Get all time slots for this court
    const slots = await this.timeSlotRepository.findByCourtAndDateRange(
      courtId,
      new Date(0), // From beginning
      new Date(8640000000000000), // Max date
    );

    // Get reservations with PAYMENT_MARKED_BY_USER status for these slots
    const pendingReservations: ReservationRecord[] = [];
    for (const slot of slots) {
      const reservations = await this.reservationRepository.findByTimeSlotId(
        slot.id,
      );
      const pending = reservations.filter(
        (r) => r.status === "PAYMENT_MARKED_BY_USER",
      );
      pendingReservations.push(...pending);
    }

    return pendingReservations;
  }

  async getForOrganization(
    userId: string,
    filters: GetOrgReservationsDTO,
  ): Promise<ReservationWithDetails[]> {
    // Verify user owns this organization
    const org = await this.organizationRepository.findById(
      filters.organizationId,
    );
    if (!org || org.ownerUserId !== userId) {
      throw new NotOrganizationOwnerError();
    }

    // Use new repository method with joins for efficient querying
    return this.reservationRepository.findWithDetailsByOrganization(
      filters.organizationId,
      {
        courtId: filters.courtId,
        status: filters.status,
        limit: filters.limit,
        offset: filters.offset,
      },
    );
  }

  /**
   * Get count of pending reservations (PAYMENT_MARKED_BY_USER) for an organization
   */
  async getPendingCount(
    userId: string,
    organizationId: string,
  ): Promise<number> {
    // Verify user owns this organization
    const org = await this.organizationRepository.findById(organizationId);
    if (!org || org.ownerUserId !== userId) {
      throw new NotOrganizationOwnerError();
    }

    // Use the efficient repository method
    return this.reservationRepository.countByOrganizationAndStatuses(
      organizationId,
      ["PAYMENT_MARKED_BY_USER"],
    );
  }
}
