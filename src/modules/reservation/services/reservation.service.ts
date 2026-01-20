import { addMinutes } from "date-fns";
import { CourtNotFoundError } from "@/modules/court/errors/court.errors";
import type { ICourtRepository } from "@/modules/court/repositories/court.repository";
import type { IOrganizationPaymentMethodRepository } from "@/modules/organization-payment/repositories/organization-payment-method.repository";
import type { IOrganizationReservationPolicyRepository } from "@/modules/organization-payment/repositories/organization-reservation-policy.repository";
import { PlaceNotFoundError } from "@/modules/place/errors/place.errors";
import type { IPlaceRepository } from "@/modules/place/repositories/place.repository";
import { PlaceNotBookableError } from "@/modules/place-verification/errors/place-verification.errors";
import type { IPlaceVerificationRepository } from "@/modules/place-verification/repositories/place-verification.repository";
import type { IProfileRepository } from "@/modules/profile/repositories/profile.repository";
import { SlotNotFoundError } from "@/modules/time-slot/errors/time-slot.errors";
import type { ITimeSlotRepository } from "@/modules/time-slot/repositories/time-slot.repository";
import type {
  OrganizationPaymentMethodRecord,
  OrganizationReservationPolicyRecord,
  ReservationEventRecord,
  ReservationRecord,
  TimeSlotRecord,
} from "@/shared/infra/db/schema";
import { logger } from "@/shared/infra/logger";
import type { RequestContext } from "@/shared/kernel/context";
import type { TransactionManager } from "@/shared/kernel/transaction";
import {
  findConsecutiveSlots,
  summarizeSlotPricing,
} from "@/shared/lib/time-slot-availability";
import { getZonedDayRangeForInstant } from "@/shared/lib/time-zone";
import type {
  CancelReservationDTO,
  CreateReservationForAnyCourtDTO,
  CreateReservationForCourtDTO,
  GetMyReservationsDTO,
  MarkPaymentDTO,
  ReservationListItemRecord,
} from "../dtos";
import {
  InvalidReservationStatusError,
  NoAvailabilityError,
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

const DEFAULT_OWNER_REVIEW_MINUTES = 15;
const DEFAULT_CANCELLATION_CUTOFF_MINUTES = 0;

interface CourtAvailabilitySelection {
  courtId: string;
  courtLabel: string;
  slotIds: string[];
  totalPriceCents: number;
  currency: string | null;
}

export interface ReservationCreationResult extends ReservationRecord {
  courtId: string;
  courtLabel: string;
  totalPriceCents: number;
  currency: string | null;
}

export interface ReservationPaymentMethod {
  id: string;
  type: OrganizationPaymentMethodRecord["type"];
  provider: OrganizationPaymentMethodRecord["provider"];
  accountName: string;
  accountNumber: string;
  instructions: string | null;
  isDefault: boolean;
}

export interface ReservationPaymentInfo {
  methods: ReservationPaymentMethod[];
  defaultMethodId: string | null;
}

export interface IReservationService {
  createReservation(
    userId: string,
    profileId: string,
    timeSlotId: string,
  ): Promise<ReservationRecord>;
  createReservationForCourt(
    userId: string,
    profileId: string,
    data: CreateReservationForCourtDTO,
  ): Promise<ReservationCreationResult>;
  createReservationForAnyCourt(
    userId: string,
    profileId: string,
    data: CreateReservationForAnyCourtDTO,
  ): Promise<ReservationCreationResult>;
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
  getPaymentInfo(
    userId: string,
    profileId: string,
    reservationId: string,
  ): Promise<ReservationPaymentInfo>;
  getReservationById(reservationId: string): Promise<{
    reservation: ReservationRecord;
    events: ReservationEventRecord[];
  }>;
  getMyReservations(
    profileId: string,
    filters: GetMyReservationsDTO,
  ): Promise<ReservationRecord[]>;
  getMyReservationsWithDetails(
    profileId: string,
    filters: GetMyReservationsDTO,
  ): Promise<ReservationListItemRecord[]>;
}

export class ReservationService implements IReservationService {
  constructor(
    private reservationRepository: IReservationRepository,
    private reservationEventRepository: IReservationEventRepository,
    private timeSlotRepository: ITimeSlotRepository,
    _profileRepository: IProfileRepository,
    private courtRepository: ICourtRepository,
    private placeRepository: IPlaceRepository,
    private placeVerificationRepository: IPlaceVerificationRepository,
    private organizationReservationPolicyRepository: IOrganizationReservationPolicyRepository,
    private organizationPaymentMethodRepository: IOrganizationPaymentMethodRepository,
    private createFreeReservationUseCase: ICreateFreeReservationUseCase,
    private createPaidReservationUseCase: ICreatePaidReservationUseCase,
    private transactionManager: TransactionManager,
  ) {}

  private async getOrganizationPolicyForCourt(
    courtId: string,
    ctx?: RequestContext,
  ): Promise<OrganizationReservationPolicyRecord | null> {
    const court = await this.courtRepository.findById(courtId, ctx);
    if (!court) {
      throw new CourtNotFoundError(courtId);
    }

    const place = await this.placeRepository.findById(court.placeId, ctx);
    if (!place) {
      throw new PlaceNotFoundError(court.placeId);
    }

    if (!place.organizationId) {
      return null;
    }

    return this.organizationReservationPolicyRepository.ensureForOrganization(
      place.organizationId,
      ctx,
    );
  }

  private getOwnerAcceptanceExpiresAt(
    policy: OrganizationReservationPolicyRecord | null,
  ): Date {
    const ownerReviewMinutes =
      policy?.ownerReviewMinutes ?? DEFAULT_OWNER_REVIEW_MINUTES;
    return addMinutes(new Date(), ownerReviewMinutes);
  }

  private async assertPlaceBookable(
    placeId: string,
    ctx?: RequestContext,
  ): Promise<void> {
    const verification = await this.placeVerificationRepository.findByPlaceId(
      placeId,
      ctx,
    );
    if (!verification) {
      throw new PlaceNotBookableError(placeId);
    }
    if (
      verification.status !== "VERIFIED" ||
      !verification.reservationsEnabled
    ) {
      throw new PlaceNotBookableError(placeId);
    }
  }

  async createReservation(
    userId: string,
    profileId: string,
    timeSlotId: string,
  ): Promise<ReservationRecord> {
    const slot = await this.timeSlotRepository.findById(timeSlotId);
    if (!slot) {
      throw new SlotNotFoundError(timeSlotId);
    }

    const court = await this.courtRepository.findById(slot.courtId);
    if (!court) {
      throw new CourtNotFoundError(slot.courtId);
    }

    await this.assertPlaceBookable(court.placeId);

    const policy = await this.getOrganizationPolicyForCourt(slot.courtId);
    const expiresAt = this.getOwnerAcceptanceExpiresAt(policy);

    const isFree = slot.priceCents === null;

    if (isFree) {
      return this.createFreeReservationUseCase.execute(
        userId,
        profileId,
        [timeSlotId],
        expiresAt,
      );
    }

    return this.createPaidReservationUseCase.execute(
      userId,
      profileId,
      [timeSlotId],
      expiresAt,
    );
  }

  async createReservationForCourt(
    userId: string,
    profileId: string,
    data: CreateReservationForCourtDTO,
  ): Promise<ReservationCreationResult> {
    const court = await this.courtRepository.findById(data.courtId);
    if (!court || !court.isActive) {
      throw new CourtNotFoundError(data.courtId);
    }

    await this.assertPlaceBookable(court.placeId);

    const startTime = new Date(data.startTime);
    const consecutiveSlots = await this.findConsecutiveSlotsForCourt(
      data.courtId,
      startTime,
      data.durationMinutes,
    );

    if (!consecutiveSlots) {
      throw new NoAvailabilityError({
        courtId: data.courtId,
        startTime: data.startTime,
        durationMinutes: data.durationMinutes,
      });
    }

    const pricing = summarizeSlotPricing(consecutiveSlots);
    const slotIds = consecutiveSlots.map((slot) => slot.id);
    const policy = await this.getOrganizationPolicyForCourt(data.courtId);
    const expiresAt = this.getOwnerAcceptanceExpiresAt(policy);

    const reservation =
      pricing.totalPriceCents > 0
        ? await this.createPaidReservationUseCase.execute(
            userId,
            profileId,
            slotIds,
            expiresAt,
          )
        : await this.createFreeReservationUseCase.execute(
            userId,
            profileId,
            slotIds,
            expiresAt,
          );

    return {
      ...reservation,
      courtId: court.id,
      courtLabel: court.label,
      totalPriceCents: pricing.totalPriceCents,
      currency: pricing.currency,
    };
  }

  async createReservationForAnyCourt(
    userId: string,
    profileId: string,
    data: CreateReservationForAnyCourtDTO,
  ): Promise<ReservationCreationResult> {
    const place = await this.placeRepository.findById(data.placeId);
    if (!place) {
      throw new PlaceNotFoundError(data.placeId);
    }

    if (!place.isActive || place.placeType !== "RESERVABLE") {
      throw new NoAvailabilityError({
        placeId: data.placeId,
        sportId: data.sportId,
        startTime: data.startTime,
        durationMinutes: data.durationMinutes,
      });
    }

    await this.assertPlaceBookable(place.id);

    const courts = await this.courtRepository.findByPlaceAndSport(
      data.placeId,
      data.sportId,
    );

    const startTime = new Date(data.startTime);
    let selected: CourtAvailabilitySelection | null = null;

    for (const court of courts) {
      if (!court.isActive) continue;

      const consecutiveSlots = await this.findConsecutiveSlotsForCourt(
        court.id,
        startTime,
        data.durationMinutes,
      );

      if (!consecutiveSlots) {
        continue;
      }

      const pricing = summarizeSlotPricing(consecutiveSlots);
      const candidate: CourtAvailabilitySelection = {
        courtId: court.id,
        courtLabel: court.label,
        slotIds: consecutiveSlots.map((slot) => slot.id),
        totalPriceCents: pricing.totalPriceCents,
        currency: pricing.currency,
      };

      selected = selected
        ? this.pickCheapestCourtOption(selected, candidate)
        : candidate;
    }

    if (!selected) {
      throw new NoAvailabilityError({
        placeId: data.placeId,
        sportId: data.sportId,
        startTime: data.startTime,
        durationMinutes: data.durationMinutes,
      });
    }

    const policy = await this.getOrganizationPolicyForCourt(selected.courtId);
    const expiresAt = this.getOwnerAcceptanceExpiresAt(policy);

    const reservation =
      selected.totalPriceCents > 0
        ? await this.createPaidReservationUseCase.execute(
            userId,
            profileId,
            selected.slotIds,
            expiresAt,
          )
        : await this.createFreeReservationUseCase.execute(
            userId,
            profileId,
            selected.slotIds,
            expiresAt,
          );

    return {
      ...reservation,
      courtId: selected.courtId,
      courtLabel: selected.courtLabel,
      totalPriceCents: selected.totalPriceCents,
      currency: selected.currency,
    };
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

      const now = new Date();

      const updated = await this.reservationRepository.update(
        data.reservationId,
        {
          status: "PAYMENT_MARKED_BY_USER",
          termsAcceptedAt: now,
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
        reservation.status === "EXPIRED" ||
        reservation.status === "CONFIRMED"
      ) {
        throw new InvalidReservationStatusError(
          data.reservationId,
          reservation.status,
          ["CREATED", "AWAITING_PAYMENT", "PAYMENT_MARKED_BY_USER"],
        );
      }

      const slot = await this.timeSlotRepository.findById(
        reservation.timeSlotId,
        ctx,
      );
      if (!slot) {
        throw new SlotNotFoundError(reservation.timeSlotId);
      }

      const policy = await this.getOrganizationPolicyForCourt(
        slot.courtId,
        ctx,
      );
      const cancellationCutoffMinutes =
        policy?.cancellationCutoffMinutes ??
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

  async getPaymentInfo(
    _userId: string,
    profileId: string,
    reservationId: string,
  ): Promise<ReservationPaymentInfo> {
    const reservation =
      await this.reservationRepository.findById(reservationId);
    if (!reservation) {
      throw new ReservationNotFoundError(reservationId);
    }

    if (reservation.playerId !== profileId) {
      throw new NotReservationOwnerError();
    }

    if (
      reservation.status !== "AWAITING_PAYMENT" &&
      reservation.status !== "PAYMENT_MARKED_BY_USER"
    ) {
      throw new InvalidReservationStatusError(
        reservationId,
        reservation.status,
        ["AWAITING_PAYMENT", "PAYMENT_MARKED_BY_USER"],
      );
    }

    const slot = await this.timeSlotRepository.findById(reservation.timeSlotId);
    if (!slot) {
      throw new SlotNotFoundError(reservation.timeSlotId);
    }

    const court = await this.courtRepository.findById(slot.courtId);
    if (!court) {
      throw new CourtNotFoundError(slot.courtId);
    }

    const place = await this.placeRepository.findById(court.placeId);
    if (!place) {
      throw new PlaceNotFoundError(court.placeId);
    }

    if (!place.organizationId) {
      return { methods: [], defaultMethodId: null };
    }

    const methods =
      await this.organizationPaymentMethodRepository.findByOrganizationId(
        place.organizationId,
      );
    const activeMethods = methods.filter((method) => method.isActive);
    const defaultMethod = activeMethods.find((method) => method.isDefault);

    return {
      methods: activeMethods.map((method) => ({
        id: method.id,
        type: method.type,
        provider: method.provider,
        accountName: method.accountName,
        accountNumber: method.accountNumber,
        instructions: method.instructions,
        isDefault: method.isDefault,
      })),
      defaultMethodId: defaultMethod?.id ?? null,
    };
  }

  async getReservationById(reservationId: string): Promise<{
    reservation: ReservationRecord;
    events: ReservationEventRecord[];
  }> {
    const reservation =
      await this.reservationRepository.findById(reservationId);
    if (!reservation) {
      throw new ReservationNotFoundError(reservationId);
    }
    const events =
      await this.reservationEventRepository.findByReservationId(reservationId);
    return { reservation, events };
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

  async getMyReservationsWithDetails(
    profileId: string,
    filters: GetMyReservationsDTO,
  ): Promise<ReservationListItemRecord[]> {
    return this.reservationRepository.findWithDetailsByPlayerId(profileId, {
      status: filters.status,
      upcoming: filters.upcoming,
      limit: filters.limit,
      offset: filters.offset,
    });
  }

  private async findConsecutiveSlotsForCourt(
    courtId: string,
    startTime: Date,
    durationMinutes: number,
  ): Promise<TimeSlotRecord[] | null> {
    const court = await this.courtRepository.findById(courtId);
    if (!court) {
      throw new CourtNotFoundError(courtId);
    }
    const place = await this.placeRepository.findById(court.placeId);
    const { start, end } = getZonedDayRangeForInstant(
      startTime,
      place?.timeZone,
    );
    const slots = await this.timeSlotRepository.findAvailable(
      courtId,
      start,
      end,
    );

    return findConsecutiveSlots({
      slots,
      startTime,
      durationMinutes,
    });
  }

  private pickCheapestCourtOption(
    current: CourtAvailabilitySelection,
    next: CourtAvailabilitySelection,
  ): CourtAvailabilitySelection {
    if (next.totalPriceCents < current.totalPriceCents) {
      return next;
    }

    if (next.totalPriceCents > current.totalPriceCents) {
      return current;
    }

    if (next.courtLabel < current.courtLabel) {
      return next;
    }

    if (next.courtLabel > current.courtLabel) {
      return current;
    }

    return next.courtId < current.courtId ? next : current;
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
