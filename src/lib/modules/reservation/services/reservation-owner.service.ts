import { addMinutes, differenceInMinutes } from "date-fns";
import { postOwnerConfirmedMessage } from "@/lib/modules/chat/ops/post-owner-confirmed-message";
import {
  CourtNotFoundError,
  NotCourtOwnerError,
} from "@/lib/modules/court/errors/court.errors";
import type { ICourtRepository } from "@/lib/modules/court/repositories/court.repository";
import {
  CourtBlockNotActiveError,
  CourtBlockNotFoundError,
  CourtBlockNotWalkInError,
  CourtBlockOverlapError,
  CourtBlockOverlapsReservationError,
} from "@/lib/modules/court-block/errors/court-block.errors";
import type { ICourtBlockRepository } from "@/lib/modules/court-block/repositories/court-block.repository";
import type { ICourtHoursRepository } from "@/lib/modules/court-hours/repositories/court-hours.repository";
import type { ICourtPriceOverrideRepository } from "@/lib/modules/court-price-override/repositories/court-price-override.repository";
import type { ICourtRateRuleRepository } from "@/lib/modules/court-rate-rule/repositories/court-rate-rule.repository";
import { GuestProfileNotFoundError } from "@/lib/modules/guest-profile/errors/guest-profile.errors";
import type { IGuestProfileRepository } from "@/lib/modules/guest-profile/repositories/guest-profile.repository";
import type { NotificationDeliveryService } from "@/lib/modules/notification-delivery/services/notification-delivery.service";
import { NotOrganizationOwnerError } from "@/lib/modules/organization/errors/organization.errors";
import type { IOrganizationRepository } from "@/lib/modules/organization/repositories/organization.repository";
import type { IOrganizationMemberService } from "@/lib/modules/organization-member/services/organization-member.service";
import type { OrganizationMemberPermission } from "@/lib/modules/organization-member/shared/permissions";
import type { IOrganizationPaymentMethodRepository } from "@/lib/modules/organization-payment/repositories/organization-payment-method.repository";
import type { IOrganizationReservationPolicyRepository } from "@/lib/modules/organization-payment/repositories/organization-reservation-policy.repository";
import type { IPaymentProofRepository } from "@/lib/modules/payment-proof/repositories/payment-proof.repository";
import { PlaceNotFoundError } from "@/lib/modules/place/errors/place.errors";
import type { IPlaceRepository } from "@/lib/modules/place/repositories/place.repository";
import type { IProfileRepository } from "@/lib/modules/profile/repositories/profile.repository";
import { STORAGE_BUCKETS } from "@/lib/modules/storage/dtos";
import type { IObjectStorageService } from "@/lib/modules/storage/services/object-storage.service";
import type { ReservationRecord } from "@/lib/shared/infra/db/schema";
import { logger } from "@/lib/shared/infra/logger";
import type { RequestContext } from "@/lib/shared/kernel/context";
import type { TransactionManager } from "@/lib/shared/kernel/transaction";
import { computeSchedulePrice } from "@/lib/shared/lib/schedule-availability";
import type {
  AcceptReservationGroupDTO,
  ConfirmPaidOfflineDTO,
  ConfirmPaymentDTO,
  ConfirmPaymentGroupDTO,
  ConvertWalkInBlockDTO,
  CreateGuestBookingDTO,
  GetActiveForCourtRangeDTO,
  GetOrgReservationsDTO,
  GetReservationGroupDetailDTO,
  RejectReservationDTO,
  RejectReservationGroupDTO,
  ReservationWithDetails,
} from "../dtos";
import {
  InvalidReservationStatusError,
  ReservationDurationInvalidError,
  ReservationExpiredError,
  ReservationGroupNotFoundError,
  ReservationNotFoundError,
  ReservationPaymentMethodInvalidError,
  ReservationPaymentNotRequiredError,
  ReservationPricingUnavailableError,
  ReservationTimeRangeInvalidError,
} from "../errors/reservation.errors";
import type { IReservationRepository } from "../repositories/reservation.repository";
import type { IReservationEventRepository } from "../repositories/reservation-event.repository";
import type { IExpireStaleReservationsUseCase } from "../use-cases/expire-stale-reservations.use-case";

const DEFAULT_PAYMENT_HOLD_MINUTES = 45;

export interface IReservationOwnerService {
  acceptReservation(
    userId: string,
    reservationId: string,
  ): Promise<ReservationRecord>;
  acceptReservationGroup(
    userId: string,
    data: AcceptReservationGroupDTO,
  ): Promise<ReservationRecord[]>;
  confirmPayment(
    userId: string,
    data: ConfirmPaymentDTO,
  ): Promise<ReservationRecord>;
  confirmPaymentGroup(
    userId: string,
    data: ConfirmPaymentGroupDTO,
  ): Promise<ReservationRecord[]>;
  confirmPaidOffline(
    userId: string,
    data: ConfirmPaidOfflineDTO,
  ): Promise<ReservationRecord>;
  rejectReservation(
    userId: string,
    data: RejectReservationDTO,
  ): Promise<ReservationRecord>;
  rejectReservationGroup(
    userId: string,
    data: RejectReservationGroupDTO,
  ): Promise<ReservationRecord[]>;
  createGuestBooking(
    userId: string,
    data: CreateGuestBookingDTO,
  ): Promise<ReservationRecord>;
  convertWalkInBlockToGuest(
    userId: string,
    data: ConvertWalkInBlockDTO,
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
  getReservationGroupDetail(
    userId: string,
    data: GetReservationGroupDetailDTO,
  ): Promise<{
    reservationGroupId: string;
    reservations: ReservationWithDetails[];
  }>;
  getPendingCount(userId: string, organizationId: string): Promise<number>;
}

export class ReservationOwnerService implements IReservationOwnerService {
  constructor(
    private reservationRepository: IReservationRepository,
    private reservationEventRepository: IReservationEventRepository,
    private courtRepository: ICourtRepository,
    private placeRepository: IPlaceRepository,
    private profileRepository: IProfileRepository,
    private organizationReservationPolicyRepository: IOrganizationReservationPolicyRepository,
    private organizationRepository: IOrganizationRepository,
    private transactionManager: TransactionManager,
    private expireStaleReservationsUseCase: IExpireStaleReservationsUseCase,
    private notificationDeliveryService: NotificationDeliveryService,
    private paymentProofRepository?: IPaymentProofRepository,
    private guestProfileRepository?: IGuestProfileRepository,
    private courtHoursRepository?: ICourtHoursRepository,
    private courtRateRuleRepository?: ICourtRateRuleRepository,
    private courtPriceOverrideRepository?: ICourtPriceOverrideRepository,
    private courtBlockRepository?: ICourtBlockRepository,
    private organizationPaymentMethodRepository?: IOrganizationPaymentMethodRepository,
    private storageService?: IObjectStorageService,
    private organizationMemberService?: Pick<
      IOrganizationMemberService,
      "hasOrganizationPermission"
    >,
  ) {}

  private async attachSignedPaymentProofUrl(
    record: ReservationWithDetails,
  ): Promise<ReservationWithDetails> {
    if (!record.paymentProof) return record;
    if (!this.storageService) {
      return {
        ...record,
        paymentProof: {
          ...record.paymentProof,
          filePath: null,
        },
      };
    }

    const filePath =
      typeof record.paymentProof.filePath === "string" &&
      record.paymentProof.filePath.length > 0
        ? record.paymentProof.filePath
        : null;

    if (!filePath) {
      return {
        ...record,
        paymentProof: {
          ...record.paymentProof,
          filePath: null,
        },
      };
    }

    const signedUrl = await this.storageService.createSignedUrl(
      STORAGE_BUCKETS.PAYMENT_PROOFS,
      filePath,
      60 * 5,
    );

    return {
      ...record,
      paymentProof: {
        ...record.paymentProof,
        fileUrl: signedUrl,
        filePath: null,
      },
    };
  }

  private requireCourtPlaceId(placeId: string | null): string {
    if (!placeId) {
      throw new PlaceNotFoundError();
    }
    return placeId;
  }

  /**
   * Verify that the user has required organization permission for a court.
   * Returns the organization ID.
   */
  private async verifyCourtOwnership(
    userId: string,
    courtId: string,
    permission: OrganizationMemberPermission,
    ctx?: RequestContext,
  ): Promise<string> {
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

    const hasPermission = this.organizationMemberService
      ? await this.organizationMemberService.hasOrganizationPermission(
          userId,
          place.organizationId,
          permission,
          ctx,
        )
      : Boolean(
          (
            await this.organizationRepository.findById(
              place.organizationId,
              ctx,
            )
          )?.ownerUserId === userId,
        );

    if (!hasPermission) {
      throw new NotCourtOwnerError();
    }

    return place.organizationId;
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

  private async postOwnerConfirmedMessageBestEffort(
    reservation: ReservationRecord,
    ownerUserId: string,
  ) {
    try {
      if (!reservation.playerId) {
        return;
      }

      const profile = await this.profileRepository.findById(
        reservation.playerId,
      );
      const playerUserId = profile?.userId;

      if (!playerUserId) {
        return;
      }

      await postOwnerConfirmedMessage({
        reservationId: reservation.id,
        ownerUserId,
        playerUserId,
      });
    } catch (error) {
      logger.warn(
        {
          err: error,
          event: "reservation.owner_confirmed_chat_message_failed",
          reservationId: reservation.id,
          ownerId: ownerUserId,
        },
        "Failed to post owner confirmed chat message",
      );
    }
  }

  private async loadReservationGroupForOwnerAction(
    userId: string,
    reservationGroupId: string,
    ctx: RequestContext,
  ): Promise<{
    reservations: ReservationRecord[];
    courtById: Map<
      string,
      NonNullable<Awaited<ReturnType<ICourtRepository["findById"]>>>
    >;
    placeById: Map<
      string,
      NonNullable<Awaited<ReturnType<IPlaceRepository["findById"]>>>
    >;
  }> {
    const group = await this.reservationRepository.findGroupByIdForUpdate(
      reservationGroupId,
      ctx,
    );
    if (!group) {
      throw new ReservationGroupNotFoundError(reservationGroupId);
    }

    const reservations =
      await this.reservationRepository.findByGroupIdForUpdate(
        reservationGroupId,
        ctx,
      );
    if (reservations.length === 0) {
      throw new ReservationGroupNotFoundError(reservationGroupId);
    }

    const courtIds = Array.from(
      new Set(reservations.map((item) => item.courtId)),
    );
    const courts = await Promise.all(
      courtIds.map((courtId) => this.courtRepository.findById(courtId, ctx)),
    );

    const courtById = new Map<
      string,
      NonNullable<Awaited<ReturnType<ICourtRepository["findById"]>>>
    >();
    for (const [index, court] of courts.entries()) {
      const courtId = courtIds[index];
      if (!court) {
        throw new CourtNotFoundError(courtId);
      }
      courtById.set(court.id, court);
      await this.verifyCourtOwnership(
        userId,
        court.id,
        "reservation.update_status",
        ctx,
      );
    }

    const placeIds = Array.from(
      new Set(
        Array.from(courtById.values()).map((court) =>
          this.requireCourtPlaceId(court.placeId),
        ),
      ),
    );

    const placeRecords = await Promise.all(
      placeIds.map((placeId) => this.placeRepository.findById(placeId, ctx)),
    );

    const placeById = new Map<
      string,
      NonNullable<Awaited<ReturnType<IPlaceRepository["findById"]>>>
    >();
    for (const [index, place] of placeRecords.entries()) {
      const placeId = placeIds[index];
      if (!place) {
        throw new PlaceNotFoundError(placeId);
      }
      placeById.set(place.id, place);
    }

    return {
      reservations,
      courtById,
      placeById,
    };
  }

  async acceptReservation(
    userId: string,
    reservationId: string,
  ): Promise<ReservationRecord> {
    const updated = await this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };

      const reservation = await this.reservationRepository.findByIdForUpdate(
        reservationId,
        ctx,
      );
      if (!reservation) {
        throw new ReservationNotFoundError(reservationId);
      }

      await this.verifyCourtOwnership(
        userId,
        reservation.courtId,
        "reservation.update_status",
        ctx,
      );

      const court = await this.courtRepository.findById(
        reservation.courtId,
        ctx,
      );
      if (!court) {
        throw new CourtNotFoundError(reservation.courtId);
      }
      const placeId = this.requireCourtPlaceId(court.placeId);
      const place = await this.placeRepository.findById(placeId, ctx);
      if (!place) {
        throw new PlaceNotFoundError(placeId);
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

        await this.notificationDeliveryService.enqueuePlayerReservationAwaitingPayment(
          {
            reservationId,
            placeName: place.name,
            courtLabel: court.label,
            startTimeIso: updated.startTime.toISOString(),
            endTimeIso: updated.endTime.toISOString(),
            expiresAtIso: updated.expiresAt
              ? new Date(updated.expiresAt).toISOString()
              : null,
            totalPriceCents: updated.totalPriceCents,
            currency: updated.currency,
          },
          ctx,
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

      await this.notificationDeliveryService.enqueuePlayerReservationConfirmed(
        {
          reservationId,
          placeName: place.name,
          courtLabel: court.label,
          startTimeIso: updated.startTime.toISOString(),
          endTimeIso: updated.endTime.toISOString(),
        },
        ctx,
      );

      return updated;
    });

    if (updated.status === "CONFIRMED") {
      await this.postOwnerConfirmedMessageBestEffort(updated, userId);
    }

    return updated;
  }

  async acceptReservationGroup(
    userId: string,
    data: AcceptReservationGroupDTO,
  ): Promise<ReservationRecord[]> {
    const updatedReservations = await this.transactionManager.run(
      async (tx) => {
        const ctx: RequestContext = { tx };

        const { reservations, courtById, placeById } =
          await this.loadReservationGroupForOwnerAction(
            userId,
            data.reservationGroupId,
            ctx,
          );

        const now = new Date();
        const updated: ReservationRecord[] = [];
        for (const reservation of reservations) {
          if (reservation.status !== "CREATED") {
            throw new InvalidReservationStatusError(
              reservation.id,
              reservation.status,
              ["CREATED"],
            );
          }

          if (
            reservation.expiresAt &&
            new Date(reservation.expiresAt) < new Date()
          ) {
            throw new ReservationExpiredError(reservation.id);
          }

          const court = courtById.get(reservation.courtId);
          if (!court) {
            throw new CourtNotFoundError(reservation.courtId);
          }
          const placeId = this.requireCourtPlaceId(court.placeId);
          const place = placeById.get(placeId);
          if (!place) {
            throw new PlaceNotFoundError(placeId);
          }

          if (reservation.totalPriceCents > 0) {
            const paymentHoldMinutes = await this.getPaymentHoldMinutes(
              reservation.courtId,
              ctx,
            );
            const expiresAt = addMinutes(now, paymentHoldMinutes);
            const itemUpdated = await this.reservationRepository.update(
              reservation.id,
              {
                status: "AWAITING_PAYMENT",
                expiresAt,
              },
              ctx,
            );

            await this.reservationEventRepository.create(
              {
                reservationId: reservation.id,
                fromStatus: "CREATED",
                toStatus: "AWAITING_PAYMENT",
                triggeredByUserId: userId,
                triggeredByRole: "OWNER",
                notes: "Owner accepted reservation group - awaiting payment",
              },
              ctx,
            );

            updated.push(itemUpdated);
            continue;
          }

          const itemUpdated = await this.reservationRepository.update(
            reservation.id,
            {
              status: "CONFIRMED",
              confirmedAt: now,
              expiresAt: null,
            },
            ctx,
          );

          await this.reservationEventRepository.create(
            {
              reservationId: reservation.id,
              fromStatus: "CREATED",
              toStatus: "CONFIRMED",
              triggeredByUserId: userId,
              triggeredByRole: "OWNER",
              notes: "Owner accepted reservation group - free booking",
            },
            ctx,
          );

          updated.push(itemUpdated);
        }

        if (updated.length > 0) {
          const sorted = updated
            .slice()
            .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
          const representative = sorted[0];
          const latest = sorted[sorted.length - 1] ?? representative;
          const representativeCourt = courtById.get(representative.courtId);
          if (!representativeCourt) {
            throw new CourtNotFoundError(representative.courtId);
          }
          const representativePlaceId = this.requireCourtPlaceId(
            representativeCourt.placeId,
          );
          const representativePlace = placeById.get(representativePlaceId);
          if (!representativePlace) {
            throw new PlaceNotFoundError(representativePlaceId);
          }

          const itemSummaries = sorted.map((item) => ({
            reservationId: item.id,
            courtId: item.courtId,
            courtLabel: courtById.get(item.courtId)?.label ?? "Court",
            startTimeIso: item.startTime.toISOString(),
            endTimeIso: item.endTime.toISOString(),
            totalPriceCents: item.totalPriceCents,
            currency: item.currency,
            expiresAtIso: item.expiresAt
              ? new Date(item.expiresAt).toISOString()
              : null,
          }));
          const soonestExpiry = sorted
            .map((item) => item.expiresAt?.getTime() ?? null)
            .filter((value): value is number => value !== null)
            .sort((a, b) => a - b)[0];
          const hasAwaitingPayment = sorted.some(
            (item) => item.status === "AWAITING_PAYMENT",
          );

          if (hasAwaitingPayment) {
            await this.notificationDeliveryService.enqueuePlayerReservationGroupAwaitingPayment(
              {
                reservationGroupId: data.reservationGroupId,
                representativeReservationId: representative.id,
                placeName: representativePlace.name,
                courtLabel:
                  itemSummaries.length > 1
                    ? `${itemSummaries.length} courts`
                    : (itemSummaries[0]?.courtLabel ?? "Court"),
                startTimeIso: representative.startTime.toISOString(),
                endTimeIso: latest.endTime.toISOString(),
                expiresAtIso: soonestExpiry
                  ? new Date(soonestExpiry).toISOString()
                  : null,
                totalPriceCents: sorted.reduce(
                  (sum, item) => sum + item.totalPriceCents,
                  0,
                ),
                currency: representative.currency,
                itemCount: itemSummaries.length,
                items: itemSummaries,
              },
              ctx,
            );
          } else {
            await this.notificationDeliveryService.enqueuePlayerReservationGroupConfirmed(
              {
                reservationGroupId: data.reservationGroupId,
                representativeReservationId: representative.id,
                placeName: representativePlace.name,
                courtLabel:
                  itemSummaries.length > 1
                    ? `${itemSummaries.length} courts`
                    : (itemSummaries[0]?.courtLabel ?? "Court"),
                startTimeIso: representative.startTime.toISOString(),
                endTimeIso: latest.endTime.toISOString(),
                itemCount: itemSummaries.length,
                items: itemSummaries,
              },
              ctx,
            );
          }
        }

        return updated;
      },
    );

    return updatedReservations;
  }

  async confirmPayment(
    userId: string,
    data: ConfirmPaymentDTO,
  ): Promise<ReservationRecord> {
    const updated = await this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };

      const reservation = await this.reservationRepository.findByIdForUpdate(
        data.reservationId,
        ctx,
      );

      if (!reservation) {
        throw new ReservationNotFoundError(data.reservationId);
      }

      await this.verifyCourtOwnership(
        userId,
        reservation.courtId,
        "reservation.update_status",
        ctx,
      );

      const court = await this.courtRepository.findById(
        reservation.courtId,
        ctx,
      );
      if (!court) {
        throw new CourtNotFoundError(reservation.courtId);
      }
      const placeId = this.requireCourtPlaceId(court.placeId);
      const place = await this.placeRepository.findById(placeId, ctx);
      if (!place) {
        throw new PlaceNotFoundError(placeId);
      }

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

      await this.notificationDeliveryService.enqueuePlayerReservationConfirmed(
        {
          reservationId: data.reservationId,
          placeName: place.name,
          courtLabel: court.label,
          startTimeIso: updated.startTime.toISOString(),
          endTimeIso: updated.endTime.toISOString(),
        },
        ctx,
      );

      return updated;
    });

    await this.postOwnerConfirmedMessageBestEffort(updated, userId);

    return updated;
  }

  async confirmPaymentGroup(
    userId: string,
    data: ConfirmPaymentGroupDTO,
  ): Promise<ReservationRecord[]> {
    const updatedReservations = await this.transactionManager.run(
      async (tx) => {
        const ctx: RequestContext = { tx };
        const { reservations, courtById, placeById } =
          await this.loadReservationGroupForOwnerAction(
            userId,
            data.reservationGroupId,
            ctx,
          );

        const now = new Date();
        const updated: ReservationRecord[] = [];
        for (const reservation of reservations) {
          if (reservation.status !== "PAYMENT_MARKED_BY_USER") {
            throw new InvalidReservationStatusError(
              reservation.id,
              reservation.status,
              ["PAYMENT_MARKED_BY_USER"],
            );
          }

          if (
            reservation.expiresAt &&
            new Date(reservation.expiresAt) < new Date()
          ) {
            throw new ReservationExpiredError(reservation.id);
          }

          const court = courtById.get(reservation.courtId);
          if (!court) {
            throw new CourtNotFoundError(reservation.courtId);
          }
          const placeId = this.requireCourtPlaceId(court.placeId);
          const place = placeById.get(placeId);
          if (!place) {
            throw new PlaceNotFoundError(placeId);
          }

          const itemUpdated = await this.reservationRepository.update(
            reservation.id,
            {
              status: "CONFIRMED",
              confirmedAt: now,
              expiresAt: null,
            },
            ctx,
          );

          await this.reservationEventRepository.create(
            {
              reservationId: reservation.id,
              fromStatus: "PAYMENT_MARKED_BY_USER",
              toStatus: "CONFIRMED",
              triggeredByUserId: userId,
              triggeredByRole: "OWNER",
              notes:
                data.notes ?? "Owner confirmed payment for reservation group",
            },
            ctx,
          );

          updated.push(itemUpdated);
        }

        if (updated.length > 0) {
          const sorted = updated
            .slice()
            .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
          const representative = sorted[0];
          const latest = sorted[sorted.length - 1] ?? representative;
          const representativeCourt = courtById.get(representative.courtId);
          if (!representativeCourt) {
            throw new CourtNotFoundError(representative.courtId);
          }
          const representativePlaceId = this.requireCourtPlaceId(
            representativeCourt.placeId,
          );
          const representativePlace = placeById.get(representativePlaceId);
          if (!representativePlace) {
            throw new PlaceNotFoundError(representativePlaceId);
          }

          const itemSummaries = sorted.map((item) => ({
            reservationId: item.id,
            courtId: item.courtId,
            courtLabel: courtById.get(item.courtId)?.label ?? "Court",
            startTimeIso: item.startTime.toISOString(),
            endTimeIso: item.endTime.toISOString(),
            totalPriceCents: item.totalPriceCents,
            currency: item.currency,
            expiresAtIso: item.expiresAt
              ? new Date(item.expiresAt).toISOString()
              : null,
          }));

          await this.notificationDeliveryService.enqueuePlayerReservationGroupConfirmed(
            {
              reservationGroupId: data.reservationGroupId,
              representativeReservationId: representative.id,
              placeName: representativePlace.name,
              courtLabel:
                itemSummaries.length > 1
                  ? `${itemSummaries.length} courts`
                  : (itemSummaries[0]?.courtLabel ?? "Court"),
              startTimeIso: representative.startTime.toISOString(),
              endTimeIso: latest.endTime.toISOString(),
              itemCount: itemSummaries.length,
              items: itemSummaries,
            },
            ctx,
          );
        }

        return updated;
      },
    );

    return updatedReservations;
  }

  async confirmPaidOffline(
    userId: string,
    data: ConfirmPaidOfflineDTO,
  ): Promise<ReservationRecord> {
    const updated = await this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };

      const reservation = await this.reservationRepository.findByIdForUpdate(
        data.reservationId,
        ctx,
      );
      if (!reservation) {
        throw new ReservationNotFoundError(data.reservationId);
      }

      const organizationId = await this.verifyCourtOwnership(
        userId,
        reservation.courtId,
        "reservation.update_status",
        ctx,
      );

      const court = await this.courtRepository.findById(
        reservation.courtId,
        ctx,
      );
      if (!court) {
        throw new CourtNotFoundError(reservation.courtId);
      }
      const placeId = this.requireCourtPlaceId(court.placeId);
      const place = await this.placeRepository.findById(placeId, ctx);
      if (!place) {
        throw new PlaceNotFoundError(placeId);
      }

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

      if (!this.organizationPaymentMethodRepository) {
        throw new ReservationPaymentMethodInvalidError({
          paymentMethodId: data.paymentMethodId,
          organizationId,
          reason: "repository_missing",
        });
      }

      const method = await this.organizationPaymentMethodRepository.findById(
        data.paymentMethodId,
        ctx,
      );
      if (
        !method ||
        method.organizationId !== organizationId ||
        !method.isActive
      ) {
        throw new ReservationPaymentMethodInvalidError({
          paymentMethodId: data.paymentMethodId,
          organizationId,
        });
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
            paymentMethodId: data.paymentMethodId,
            notes: "Paid & Confirmed",
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
          notes: `Owner marked as paid and confirmed (ref: ${data.paymentReference})`,
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
        "Reservation marked as paid and confirmed by owner",
      );

      await this.notificationDeliveryService.enqueuePlayerReservationConfirmed(
        {
          reservationId: data.reservationId,
          placeName: place.name,
          courtLabel: court.label,
          startTimeIso: updated.startTime.toISOString(),
          endTimeIso: updated.endTime.toISOString(),
        },
        ctx,
      );

      return updated;
    });

    await this.postOwnerConfirmedMessageBestEffort(updated, userId);

    return updated;
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

      await this.verifyCourtOwnership(
        userId,
        reservation.courtId,
        "reservation.update_status",
        ctx,
      );

      const court = await this.courtRepository.findById(
        reservation.courtId,
        ctx,
      );
      if (!court) {
        throw new CourtNotFoundError(reservation.courtId);
      }
      const placeId = this.requireCourtPlaceId(court.placeId);
      const place = await this.placeRepository.findById(placeId, ctx);
      if (!place) {
        throw new PlaceNotFoundError(placeId);
      }

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

      await this.notificationDeliveryService.enqueuePlayerReservationRejected(
        {
          reservationId: data.reservationId,
          placeName: place.name,
          courtLabel: court.label,
          startTimeIso: updated.startTime.toISOString(),
          endTimeIso: updated.endTime.toISOString(),
          reason: data.reason,
        },
        ctx,
      );

      return updated;
    });
  }

  async rejectReservationGroup(
    userId: string,
    data: RejectReservationGroupDTO,
  ): Promise<ReservationRecord[]> {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };
      const { reservations, courtById, placeById } =
        await this.loadReservationGroupForOwnerAction(
          userId,
          data.reservationGroupId,
          ctx,
        );

      const updated: ReservationRecord[] = [];
      for (const reservation of reservations) {
        if (
          reservation.status !== "CREATED" &&
          reservation.status !== "AWAITING_PAYMENT" &&
          reservation.status !== "PAYMENT_MARKED_BY_USER"
        ) {
          throw new InvalidReservationStatusError(
            reservation.id,
            reservation.status,
            ["CREATED", "AWAITING_PAYMENT", "PAYMENT_MARKED_BY_USER"],
          );
        }

        const court = courtById.get(reservation.courtId);
        if (!court) {
          throw new CourtNotFoundError(reservation.courtId);
        }
        const placeId = this.requireCourtPlaceId(court.placeId);
        const place = placeById.get(placeId);
        if (!place) {
          throw new PlaceNotFoundError(placeId);
        }

        const previousStatus = reservation.status;
        const itemUpdated = await this.reservationRepository.update(
          reservation.id,
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
            reservationId: reservation.id,
            fromStatus: previousStatus,
            toStatus: "CANCELLED",
            triggeredByUserId: userId,
            triggeredByRole: "OWNER",
            notes: `Rejected by owner (group): ${data.reason}`,
          },
          ctx,
        );

        updated.push(itemUpdated);
      }

      if (updated.length > 0) {
        const sorted = updated
          .slice()
          .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
        const representative = sorted[0];
        const latest = sorted[sorted.length - 1] ?? representative;
        const representativeCourt = courtById.get(representative.courtId);
        if (!representativeCourt) {
          throw new CourtNotFoundError(representative.courtId);
        }
        const representativePlaceId = this.requireCourtPlaceId(
          representativeCourt.placeId,
        );
        const representativePlace = placeById.get(representativePlaceId);
        if (!representativePlace) {
          throw new PlaceNotFoundError(representativePlaceId);
        }

        const itemSummaries = sorted.map((item) => ({
          reservationId: item.id,
          courtId: item.courtId,
          courtLabel: courtById.get(item.courtId)?.label ?? "Court",
          startTimeIso: item.startTime.toISOString(),
          endTimeIso: item.endTime.toISOString(),
          totalPriceCents: item.totalPriceCents,
          currency: item.currency,
          expiresAtIso: item.expiresAt
            ? new Date(item.expiresAt).toISOString()
            : null,
        }));

        await this.notificationDeliveryService.enqueuePlayerReservationGroupRejected(
          {
            reservationGroupId: data.reservationGroupId,
            representativeReservationId: representative.id,
            placeName: representativePlace.name,
            courtLabel:
              itemSummaries.length > 1
                ? `${itemSummaries.length} courts`
                : (itemSummaries[0]?.courtLabel ?? "Court"),
            startTimeIso: representative.startTime.toISOString(),
            endTimeIso: latest.endTime.toISOString(),
            itemCount: itemSummaries.length,
            items: itemSummaries,
            reason: data.reason,
          },
          ctx,
        );
      }

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

      await this.verifyCourtOwnership(
        userId,
        data.courtId,
        "reservation.guest_booking",
        ctx,
      );

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

  async convertWalkInBlockToGuest(
    userId: string,
    data: ConvertWalkInBlockDTO,
  ): Promise<ReservationRecord> {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };

      if (!this.courtBlockRepository) {
        throw new Error("CourtBlockRepository not configured");
      }
      if (!this.guestProfileRepository) {
        throw new Error("GuestProfileRepository not configured");
      }

      const block = await this.courtBlockRepository.findById(data.blockId, ctx);
      if (!block) {
        throw new CourtBlockNotFoundError(data.blockId);
      }
      if (!block.isActive) {
        throw new CourtBlockNotActiveError(data.blockId);
      }
      if (block.type !== "WALK_IN") {
        throw new CourtBlockNotWalkInError(data.blockId);
      }

      const organizationId = await this.verifyCourtOwnership(
        userId,
        block.courtId,
        "reservation.guest_booking",
        ctx,
      );

      let guestProfileId: string;
      if (data.guestMode === "existing") {
        if (!data.guestProfileId) {
          throw new GuestProfileNotFoundError("");
        }
        const existingGuest = await this.guestProfileRepository.findById(
          data.guestProfileId,
          ctx,
        );
        if (!existingGuest || existingGuest.organizationId !== organizationId) {
          throw new GuestProfileNotFoundError(data.guestProfileId);
        }
        guestProfileId = data.guestProfileId;
      } else {
        if (!data.newGuestName) {
          throw new GuestProfileNotFoundError("");
        }
        const newGuest = await this.guestProfileRepository.create(
          {
            organizationId,
            displayName: data.newGuestName,
            phoneNumber: data.newGuestPhone ?? null,
            email: data.newGuestEmail ?? null,
            notes: null,
          },
          ctx,
        );
        guestProfileId = newGuest.id;
      }

      const guest = await this.guestProfileRepository.findById(
        guestProfileId,
        ctx,
      );
      if (!guest) {
        throw new GuestProfileNotFoundError(guestProfileId);
      }

      const startTime = new Date(block.startTime);
      const endTime = new Date(block.endTime);

      const overlappingReservations =
        await this.reservationRepository.findOverlappingActiveByCourtIds(
          [block.courtId],
          startTime,
          endTime,
          ctx,
        );
      if (overlappingReservations.length > 0) {
        throw new CourtBlockOverlapsReservationError({
          courtId: block.courtId,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        });
      }

      const overlappingBlocks =
        await this.courtBlockRepository.findOverlappingByCourtIds(
          [block.courtId],
          startTime,
          endTime,
          {},
          ctx,
        );
      const otherBlocks = overlappingBlocks.filter(
        (item) => item.id !== block.id,
      );
      if (otherBlocks.length > 0) {
        throw new CourtBlockOverlapError({
          courtId: block.courtId,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        });
      }

      const now = new Date();
      const created = await this.reservationRepository.create(
        {
          courtId: block.courtId,
          startTime,
          endTime,
          totalPriceCents: block.totalPriceCents,
          currency: block.currency,
          playerId: null,
          guestProfileId,
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
          notes: data.notes ?? "Converted walk-in block to guest booking",
        },
        ctx,
      );

      await this.courtBlockRepository.update(
        block.id,
        { isActive: false, cancelledAt: now },
        ctx,
      );

      logger.info(
        {
          event: "reservation.walk_in_converted",
          reservationId: created.id,
          blockId: block.id,
          courtId: block.courtId,
          guestProfileId,
          ownerId: userId,
        },
        "Walk-in block converted to guest booking",
      );

      return created;
    });
  }

  async getActiveForCourtRange(
    userId: string,
    data: GetActiveForCourtRangeDTO,
  ): Promise<ReservationRecord[]> {
    await this.verifyCourtOwnership(userId, data.courtId, "reservation.read");

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
    await this.verifyCourtOwnership(userId, courtId, "reservation.read");

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
    const hasPermission = this.organizationMemberService
      ? await this.organizationMemberService.hasOrganizationPermission(
          userId,
          filters.organizationId,
          "reservation.read",
        )
      : Boolean(
          (await this.organizationRepository.findById(filters.organizationId))
            ?.ownerUserId === userId,
        );
    if (!hasPermission) {
      throw new NotOrganizationOwnerError();
    }

    await this.expireStaleReservationsUseCase.executeForOrganization(
      filters.organizationId,
    );

    const results =
      await this.reservationRepository.findWithDetailsByOrganization(
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

    return Promise.all(
      results.map((record) => this.attachSignedPaymentProofUrl(record)),
    );
  }

  async getReservationGroupDetail(
    userId: string,
    data: GetReservationGroupDetailDTO,
  ): Promise<{
    reservationGroupId: string;
    reservations: ReservationWithDetails[];
  }> {
    const group = await this.reservationRepository.findGroupById(
      data.reservationGroupId,
    );
    if (!group) {
      throw new ReservationGroupNotFoundError(data.reservationGroupId);
    }

    const reservations = await this.reservationRepository.findByGroupId(
      data.reservationGroupId,
    );
    if (reservations.length === 0) {
      throw new ReservationGroupNotFoundError(data.reservationGroupId);
    }

    const organizationId = await this.verifyCourtOwnership(
      userId,
      reservations[0].courtId,
      "reservation.read",
    );

    const details = await Promise.all(
      reservations.map(async (reservation) => {
        const [record] =
          await this.reservationRepository.findWithDetailsByOrganization(
            organizationId,
            {
              reservationId: reservation.id,
              placeId: undefined,
              courtId: undefined,
              status: undefined,
              limit: 1,
              offset: 0,
            },
          );
        if (!record) {
          throw new ReservationNotFoundError(reservation.id);
        }
        return this.attachSignedPaymentProofUrl(record);
      }),
    );

    return {
      reservationGroupId: group.id,
      reservations: details,
    };
  }

  async getPendingCount(
    userId: string,
    organizationId: string,
  ): Promise<number> {
    const hasPermission = this.organizationMemberService
      ? await this.organizationMemberService.hasOrganizationPermission(
          userId,
          organizationId,
          "reservation.read",
        )
      : Boolean(
          (await this.organizationRepository.findById(organizationId))
            ?.ownerUserId === userId,
        );
    if (!hasPermission) {
      throw new NotOrganizationOwnerError();
    }

    await this.expireStaleReservationsUseCase.executeForOrganization(
      organizationId,
    );

    return this.reservationRepository.countByOrganizationAndStatuses(
      organizationId,
      ["CREATED", "AWAITING_PAYMENT", "PAYMENT_MARKED_BY_USER"],
    );
  }
}
