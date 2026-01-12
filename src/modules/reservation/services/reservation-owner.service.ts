import { addMinutes } from "date-fns";
import {
  CourtNotFoundError,
  NotCourtOwnerError,
} from "@/modules/court/errors/court.errors";
import type { ICourtRepository } from "@/modules/court/repositories/court.repository";
import { NotOrganizationOwnerError } from "@/modules/organization/errors/organization.errors";
import type { IOrganizationRepository } from "@/modules/organization/repositories/organization.repository";
import { PlaceNotFoundError } from "@/modules/place/errors/place.errors";
import type { IPlaceRepository } from "@/modules/place/repositories/place.repository";
import type { IPlacePolicyRepository } from "@/modules/place/repositories/place-policy.repository";
import { SlotNotFoundError } from "@/modules/time-slot/errors/time-slot.errors";
import type { ITimeSlotRepository } from "@/modules/time-slot/repositories/time-slot.repository";
import type {
  ReservationRecord,
  TimeSlotRecord,
} from "@/shared/infra/db/schema";
import { logger } from "@/shared/infra/logger";
import type { RequestContext } from "@/shared/kernel/context";
import type { TransactionManager } from "@/shared/kernel/transaction";
import { summarizeSlotPricing } from "@/shared/lib/time-slot-availability";
import type {
  ConfirmPaymentDTO,
  GetOrgReservationsDTO,
  RejectReservationDTO,
  ReservationWithDetails,
} from "../dtos";
import {
  InvalidReservationStatusError,
  ReservationExpiredError,
  ReservationNotFoundError,
} from "../errors/reservation.errors";
import type { IReservationRepository } from "../repositories/reservation.repository";
import type { IReservationEventRepository } from "../repositories/reservation-event.repository";

const DEFAULT_PAYMENT_HOLD_MINUTES = 15;

export interface IReservationOwnerService {
  acceptReservation(
    userId: string,
    reservationId: string,
  ): Promise<ReservationRecord>;
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
    private placeRepository: IPlaceRepository,
    private placePolicyRepository: IPlacePolicyRepository,
    private organizationRepository: IOrganizationRepository,
    private transactionManager: TransactionManager,
  ) {}

  /**
   * Verify that the user owns the place for a court
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

    const place = await this.placeRepository.findById(court.placeId, ctx);
    if (!place) {
      throw new PlaceNotFoundError(court.placeId);
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

    return slot;
  }

  private async getPaymentHoldMinutes(
    courtId: string,
    ctx?: RequestContext,
  ): Promise<number> {
    const court = await this.courtRepository.findById(courtId, ctx);
    if (!court) {
      throw new CourtNotFoundError(courtId);
    }

    const policy = await this.placePolicyRepository.findByPlaceId(
      court.placeId,
      ctx,
    );

    return policy?.paymentHoldMinutes ?? DEFAULT_PAYMENT_HOLD_MINUTES;
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

      await this.verifyCourtOwnership(userId, reservation.timeSlotId, ctx);

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

      const slotIds = await this.getReservationSlotIds(
        reservation.id,
        reservation.timeSlotId,
        ctx,
      );

      const slots = await this.timeSlotRepository.findByIdsForUpdate(
        slotIds,
        ctx,
      );
      const slotMap = new Map(slots.map((slot) => [slot.id, slot]));
      const orderedSlots = slotIds
        .map((slotId) => slotMap.get(slotId))
        .filter((slot): slot is TimeSlotRecord => !!slot);

      if (orderedSlots.length !== slotIds.length) {
        const missingId = slotIds.find((slotId) => !slotMap.has(slotId));
        throw new SlotNotFoundError(missingId ?? "unknown");
      }

      const pricing = summarizeSlotPricing(orderedSlots);
      const now = new Date();

      if (pricing.totalPriceCents > 0) {
        const paymentHoldMinutes = await this.getPaymentHoldMinutes(
          orderedSlots[0].courtId,
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

      await this.timeSlotRepository.updateManyStatus(slotIds, "BOOKED", ctx);

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

      if (
        reservation.expiresAt &&
        new Date(reservation.expiresAt) < new Date()
      ) {
        throw new ReservationExpiredError(data.reservationId);
      }

      const now = new Date();

      // Update reservation status to CONFIRMED
      const updated = await this.reservationRepository.update(
        data.reservationId,
        {
          status: "CONFIRMED",
          confirmedAt: now,
          expiresAt: null,
        },
        ctx,
      );

      // Update slot status to BOOKED
      const slotIds = await this.getReservationSlotIds(
        reservation.id,
        reservation.timeSlotId,
        ctx,
      );

      await this.timeSlotRepository.updateManyStatus(slotIds, "BOOKED", ctx);

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
      const slotIds = await this.getReservationSlotIds(
        reservation.id,
        reservation.timeSlotId,
        ctx,
      );

      await this.timeSlotRepository.updateManyStatus(slotIds, "AVAILABLE", ctx);

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

    const place = await this.placeRepository.findById(court.placeId);
    if (!place) {
      throw new PlaceNotFoundError(court.placeId);
    }

    if (!place.organizationId) {
      throw new NotCourtOwnerError();
    }

    const org = await this.organizationRepository.findById(
      place.organizationId,
    );
    if (!org || org.ownerUserId !== userId) {
      throw new NotCourtOwnerError();
    }

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
        reservationId: filters.reservationId,
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
      ["CREATED", "PAYMENT_MARKED_BY_USER"],
    );
  }

  private async getReservationSlotIds(
    reservationId: string,
    fallbackTimeSlotId: string,
    ctx?: RequestContext,
  ): Promise<string[]> {
    const slotIds =
      await this.reservationRepository.findTimeSlotIdsByReservationId(
        reservationId,
        ctx,
      );

    return slotIds.length > 0 ? slotIds : [fallbackTimeSlotId];
  }
}
