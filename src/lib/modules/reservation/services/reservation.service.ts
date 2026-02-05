import { addDays, addMinutes, endOfDay } from "date-fns";
import { MAX_BOOKING_WINDOW_DAYS } from "@/common/booking-window";
import { ensureReservationThreadForReservation } from "@/lib/modules/chat/ops/ensure-reservation-thread";
import { CourtNotFoundError } from "@/lib/modules/court/errors/court.errors";
import type { ICourtRepository } from "@/lib/modules/court/repositories/court.repository";
import type { ICourtBlockRepository } from "@/lib/modules/court-block/repositories/court-block.repository";
import type { ICourtHoursRepository } from "@/lib/modules/court-hours/repositories/court-hours.repository";
import type { ICourtPriceOverrideRepository } from "@/lib/modules/court-price-override/repositories/court-price-override.repository";
import type { ICourtRateRuleRepository } from "@/lib/modules/court-rate-rule/repositories/court-rate-rule.repository";
import type { NotificationDeliveryService } from "@/lib/modules/notification-delivery/services/notification-delivery.service";
import type { IOrganizationRepository } from "@/lib/modules/organization/repositories/organization.repository";
import type { IOrganizationProfileRepository } from "@/lib/modules/organization/repositories/organization-profile.repository";
import type { IOrganizationPaymentMethodRepository } from "@/lib/modules/organization-payment/repositories/organization-payment-method.repository";
import type { IOrganizationReservationPolicyRepository } from "@/lib/modules/organization-payment/repositories/organization-reservation-policy.repository";
import { PlaceNotFoundError } from "@/lib/modules/place/errors/place.errors";
import type { IPlaceRepository } from "@/lib/modules/place/repositories/place.repository";
import type { IPlacePhotoRepository } from "@/lib/modules/place/repositories/place-photo.repository";
import { PlaceNotBookableError } from "@/lib/modules/place-verification/errors/place-verification.errors";
import type { IPlaceVerificationRepository } from "@/lib/modules/place-verification/repositories/place-verification.repository";
import {
  IncompleteProfileError,
  ProfileNotFoundError,
} from "@/lib/modules/profile/errors/profile.errors";
import type { IProfileRepository } from "@/lib/modules/profile/repositories/profile.repository";
import type {
  CourtRecord,
  OrganizationPaymentMethodRecord,
  OrganizationProfileRecord,
  OrganizationRecord,
  OrganizationReservationPolicyRecord,
  PlacePhotoRecord,
  PlaceRecord,
  ReservationEventRecord,
  ReservationRecord,
} from "@/lib/shared/infra/db/schema";
import { logger } from "@/lib/shared/infra/logger";
import type { RequestContext } from "@/lib/shared/kernel/context";
import type { TransactionManager } from "@/lib/shared/kernel/transaction";
import { computeSchedulePrice } from "@/lib/shared/lib/schedule-availability";
import type {
  CancelReservationDTO,
  CreateReservationForAnyCourtDTO,
  CreateReservationForCourtDTO,
  GetMyReservationsDTO,
  MarkPaymentDTO,
  ReservationListItemRecord,
} from "../dtos";
import {
  BookingWindowExceededError,
  InvalidReservationStatusError,
  NoAvailabilityError,
  NotReservationOwnerError,
  ReservationCancellationWindowError,
  ReservationExpiredError,
  ReservationNotFoundError,
  ReservationStartTimeInPastError,
  TermsNotAcceptedError,
} from "../errors/reservation.errors";
import type { IReservationRepository } from "../repositories/reservation.repository";
import type { IReservationEventRepository } from "../repositories/reservation-event.repository";

const DEFAULT_OWNER_REVIEW_MINUTES = 45;
const DEFAULT_CANCELLATION_CUTOFF_MINUTES = 0;

interface CourtAvailabilitySelection {
  courtId: string;
  courtLabel: string;
  startTime: Date;
  endTime: Date;
  totalPriceCents: number;
  currency: string;
}

export interface ReservationCreationResult extends ReservationRecord {
  courtId: string;
  courtLabel: string;
  totalPriceCents: number;
  currency: string;
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

export interface ReservationDetail {
  reservation: ReservationRecord;
  events: ReservationEventRecord[];
  court: CourtRecord;
  place: PlaceRecord;
  placePhotos: PlacePhotoRecord[];
  reservationPolicy: OrganizationReservationPolicyRecord | null;
  organization: OrganizationRecord | null;
  organizationProfile: OrganizationProfileRecord | null;
}

export interface IReservationService {
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
  getReservationDetail(reservationId: string): Promise<ReservationDetail>;
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
    private profileRepository: IProfileRepository,
    private courtRepository: ICourtRepository,
    private placeRepository: IPlaceRepository,
    private placePhotoRepository: IPlacePhotoRepository,
    private placeVerificationRepository: IPlaceVerificationRepository,
    private organizationReservationPolicyRepository: IOrganizationReservationPolicyRepository,
    private organizationPaymentMethodRepository: IOrganizationPaymentMethodRepository,
    private organizationRepository: IOrganizationRepository,
    private organizationProfileRepository: IOrganizationProfileRepository,
    private courtHoursRepository: ICourtHoursRepository,
    private courtRateRuleRepository: ICourtRateRuleRepository,
    private courtBlockRepository: ICourtBlockRepository,
    private courtPriceOverrideRepository: ICourtPriceOverrideRepository,
    private transactionManager: TransactionManager,
    private notificationDeliveryService: NotificationDeliveryService,
  ) {}

  private requireCourtPlaceId(placeId: string | null): string {
    if (!placeId) {
      throw new PlaceNotFoundError();
    }
    return placeId;
  }

  private async getOrganizationPolicyForCourt(
    courtId: string,
    ctx?: RequestContext,
  ): Promise<OrganizationReservationPolicyRecord | null> {
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

  private assertWithinBookingWindow(startTime: Date): void {
    const maxStartTime = endOfDay(addDays(new Date(), MAX_BOOKING_WINDOW_DAYS));
    if (startTime > maxStartTime) {
      throw new BookingWindowExceededError(startTime, maxStartTime);
    }
  }

  private assertStartTimeNotInPast(startTime: Date): void {
    const now = new Date();
    if (startTime.getTime() < now.getTime()) {
      throw new ReservationStartTimeInPastError(startTime, now);
    }
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

  private async computeCourtPricing(options: {
    courtId: string;
    startTime: Date;
    durationMinutes: number;
    timeZone: string;
    ctx?: RequestContext;
  }): Promise<{
    endTime: Date;
    totalPriceCents: number;
    currency: string;
  } | null> {
    const { courtId, startTime, durationMinutes, timeZone, ctx } = options;
    const endTime = addMinutes(startTime, durationMinutes);

    const [hoursWindows, rateRules, priceOverrides] = await Promise.all([
      this.courtHoursRepository.findByCourtIds([courtId], ctx),
      this.courtRateRuleRepository.findByCourtIds([courtId], ctx),
      this.courtPriceOverrideRepository.findOverlappingByCourtIds(
        [courtId],
        startTime,
        endTime,
        ctx,
      ),
    ]);

    return computeSchedulePrice({
      startTime,
      durationMinutes,
      timeZone,
      hoursWindows,
      rateRules,
      priceOverrides,
    });
  }

  private async isCourtRangeAvailable(options: {
    courtIds: string[];
    startTime: Date;
    endTime: Date;
    ctx?: RequestContext;
  }): Promise<boolean> {
    const { courtIds, startTime, endTime, ctx } = options;

    const [reservations, blocks] = await Promise.all([
      this.reservationRepository.findOverlappingActiveByCourtIds(
        courtIds,
        startTime,
        endTime,
        ctx,
      ),
      this.courtBlockRepository.findOverlappingByCourtIds(
        courtIds,
        startTime,
        endTime,
        undefined,
        ctx,
      ),
    ]);

    return reservations.length === 0 && blocks.length === 0;
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

    const placeId = this.requireCourtPlaceId(court.placeId);
    const place = await this.placeRepository.findById(placeId);
    if (!place) {
      throw new PlaceNotFoundError(placeId);
    }

    if (!place.isActive || place.placeType !== "RESERVABLE") {
      throw new NoAvailabilityError({
        courtId: data.courtId,
        startTime: data.startTime,
        durationMinutes: data.durationMinutes,
      });
    }

    await this.assertPlaceBookable(placeId);

    const startTime = new Date(data.startTime);
    this.assertStartTimeNotInPast(startTime);
    this.assertWithinBookingWindow(startTime);

    const pricing = await this.computeCourtPricing({
      courtId: court.id,
      startTime,
      durationMinutes: data.durationMinutes,
      timeZone: place.timeZone,
    });

    if (!pricing) {
      throw new NoAvailabilityError({
        courtId: data.courtId,
        startTime: data.startTime,
        durationMinutes: data.durationMinutes,
      });
    }

    const isAvailable = await this.isCourtRangeAvailable({
      courtIds: [court.id],
      startTime,
      endTime: pricing.endTime,
    });

    if (!isAvailable) {
      throw new NoAvailabilityError({
        courtId: data.courtId,
        startTime: data.startTime,
        durationMinutes: data.durationMinutes,
      });
    }

    const policy = await this.getOrganizationPolicyForCourt(court.id);
    const expiresAt = this.getOwnerAcceptanceExpiresAt(policy);

    const reservation = await this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };

      const profile = await this.profileRepository.findById(profileId, ctx);
      if (!profile) {
        throw new ProfileNotFoundError(profileId);
      }

      if (!profile.displayName || (!profile.email && !profile.phoneNumber)) {
        throw new IncompleteProfileError();
      }

      const stillAvailable = await this.isCourtRangeAvailable({
        courtIds: [court.id],
        startTime,
        endTime: pricing.endTime,
        ctx,
      });

      if (!stillAvailable) {
        throw new NoAvailabilityError({
          courtId: data.courtId,
          startTime: data.startTime,
          durationMinutes: data.durationMinutes,
        });
      }

      const created = await this.reservationRepository.create(
        {
          courtId: court.id,
          startTime,
          endTime: pricing.endTime,
          totalPriceCents: pricing.totalPriceCents,
          currency: pricing.currency,
          playerId: profileId,
          playerNameSnapshot: profile.displayName,
          playerEmailSnapshot: profile.email,
          playerPhoneSnapshot: profile.phoneNumber,
          status: "CREATED",
          expiresAt,
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
          notes: "Reservation created - awaiting owner acceptance",
        },
        ctx,
      );

      if (place.organizationId) {
        await this.notificationDeliveryService.enqueueOwnerReservationCreated(
          {
            reservationId: created.id,
            organizationId: place.organizationId,
            placeId: place.id,
            placeName: place.name,
            courtId: court.id,
            courtLabel: court.label,
            startTimeIso: created.startTime.toISOString(),
            endTimeIso: created.endTime.toISOString(),
            totalPriceCents: created.totalPriceCents,
            currency: created.currency,
            playerName: profile.displayName,
            playerEmail: profile.email ?? null,
            playerPhone: profile.phoneNumber ?? null,
            expiresAtIso: created.expiresAt
              ? new Date(created.expiresAt).toISOString()
              : null,
          },
          ctx,
        );
      }

      logger.info(
        {
          event: "reservation.created",
          reservationId: created.id,
          courtId: court.id,
          playerId: profileId,
          status: "CREATED",
          startTime: startTime.toISOString(),
          endTime: pricing.endTime.toISOString(),
          totalPriceCents: pricing.totalPriceCents,
          currency: pricing.currency,
        },
        "Reservation created and awaiting owner acceptance",
      );

      return created;
    });

    try {
      if (place.organizationId) {
        const [profile, organization] = await Promise.all([
          this.profileRepository.findById(profileId),
          this.organizationRepository.findById(place.organizationId),
        ]);

        const ownerUserId = organization?.ownerUserId ?? null;
        const playerUserId = profile?.userId ?? null;

        if (ownerUserId && playerUserId) {
          await ensureReservationThreadForReservation({
            reservationId: reservation.id,
            memberIds: [playerUserId, ownerUserId],
            createdByUserId: userId,
          });
        }
      }
    } catch (error) {
      logger.warn(
        { err: error, reservationId: reservation.id },
        "Chat thread ensure failed",
      );
    }

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
    const activeCourts = courts.filter((court) => court.isActive);
    if (activeCourts.length === 0) {
      throw new NoAvailabilityError({
        placeId: data.placeId,
        sportId: data.sportId,
        startTime: data.startTime,
        durationMinutes: data.durationMinutes,
      });
    }

    const startTime = new Date(data.startTime);
    this.assertStartTimeNotInPast(startTime);
    this.assertWithinBookingWindow(startTime);
    const endTime = addMinutes(startTime, data.durationMinutes);
    const courtIds = activeCourts.map((court) => court.id);

    const [hoursWindows, rateRules, overrides, reservations, blocks] =
      await Promise.all([
        this.courtHoursRepository.findByCourtIds(courtIds),
        this.courtRateRuleRepository.findByCourtIds(courtIds),
        this.courtPriceOverrideRepository.findOverlappingByCourtIds(
          courtIds,
          startTime,
          endTime,
        ),
        this.reservationRepository.findOverlappingActiveByCourtIds(
          courtIds,
          startTime,
          endTime,
        ),
        this.courtBlockRepository.findOverlappingByCourtIds(
          courtIds,
          startTime,
          endTime,
        ),
      ]);

    const hasBlockingReservation = new Set(
      reservations.map((reservation) => reservation.courtId),
    );
    const hasBlockingBlock = new Set(blocks.map((block) => block.courtId));

    let selected: CourtAvailabilitySelection | null = null;

    for (const court of activeCourts) {
      if (hasBlockingReservation.has(court.id)) continue;
      if (hasBlockingBlock.has(court.id)) continue;

      const courtHours = hoursWindows.filter(
        (window) => window.courtId === court.id,
      );
      const courtRules = rateRules.filter((rule) => rule.courtId === court.id);
      const courtOverrides = overrides.filter(
        (override) => override.courtId === court.id,
      );

      const pricing = computeSchedulePrice({
        startTime,
        durationMinutes: data.durationMinutes,
        timeZone: place.timeZone,
        hoursWindows: courtHours,
        rateRules: courtRules,
        priceOverrides: courtOverrides,
      });

      if (!pricing) continue;

      const candidate: CourtAvailabilitySelection = {
        courtId: court.id,
        courtLabel: court.label,
        startTime,
        endTime: pricing.endTime,
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

    const reservation = await this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };

      const profile = await this.profileRepository.findById(profileId, ctx);
      if (!profile) {
        throw new ProfileNotFoundError(profileId);
      }

      if (!profile.displayName || (!profile.email && !profile.phoneNumber)) {
        throw new IncompleteProfileError();
      }

      const stillAvailable = await this.isCourtRangeAvailable({
        courtIds: [selected.courtId],
        startTime,
        endTime: selected.endTime,
        ctx,
      });

      if (!stillAvailable) {
        throw new NoAvailabilityError({
          placeId: data.placeId,
          sportId: data.sportId,
          startTime: data.startTime,
          durationMinutes: data.durationMinutes,
        });
      }

      const created = await this.reservationRepository.create(
        {
          courtId: selected.courtId,
          startTime,
          endTime: selected.endTime,
          totalPriceCents: selected.totalPriceCents,
          currency: selected.currency,
          playerId: profileId,
          playerNameSnapshot: profile.displayName,
          playerEmailSnapshot: profile.email,
          playerPhoneSnapshot: profile.phoneNumber,
          status: "CREATED",
          expiresAt,
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
          notes: "Reservation created - awaiting owner acceptance",
        },
        ctx,
      );

      if (place.organizationId) {
        await this.notificationDeliveryService.enqueueOwnerReservationCreated(
          {
            reservationId: created.id,
            organizationId: place.organizationId,
            placeId: place.id,
            placeName: place.name,
            courtId: selected.courtId,
            courtLabel: selected.courtLabel,
            startTimeIso: created.startTime.toISOString(),
            endTimeIso: created.endTime.toISOString(),
            totalPriceCents: created.totalPriceCents,
            currency: created.currency,
            playerName: profile.displayName,
            playerEmail: profile.email ?? null,
            playerPhone: profile.phoneNumber ?? null,
            expiresAtIso: created.expiresAt
              ? new Date(created.expiresAt).toISOString()
              : null,
          },
          ctx,
        );
      }

      logger.info(
        {
          event: "reservation.created",
          reservationId: created.id,
          courtId: selected.courtId,
          playerId: profileId,
          status: "CREATED",
          startTime: startTime.toISOString(),
          endTime: selected.endTime.toISOString(),
          totalPriceCents: selected.totalPriceCents,
          currency: selected.currency,
        },
        "Reservation created and awaiting owner acceptance",
      );

      return created;
    });

    try {
      if (place.organizationId) {
        const [profile, organization] = await Promise.all([
          this.profileRepository.findById(profileId),
          this.organizationRepository.findById(place.organizationId),
        ]);

        const ownerUserId = organization?.ownerUserId ?? null;
        const playerUserId = profile?.userId ?? null;

        if (ownerUserId && playerUserId) {
          await ensureReservationThreadForReservation({
            reservationId: reservation.id,
            memberIds: [playerUserId, ownerUserId],
            createdByUserId: userId,
          });
        }
      }
    } catch (error) {
      logger.warn(
        { err: error, reservationId: reservation.id },
        "Chat thread ensure failed",
      );
    }

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

      if (reservation.playerId !== profileId) {
        throw new NotReservationOwnerError();
      }

      if (reservation.status !== "AWAITING_PAYMENT") {
        throw new InvalidReservationStatusError(
          data.reservationId,
          reservation.status,
          ["AWAITING_PAYMENT"],
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

      try {
        const court = await this.courtRepository.findById(
          reservation.courtId,
          ctx,
        );
        if (court?.placeId) {
          const place = await this.placeRepository.findById(court.placeId, ctx);
          if (place) {
            await this.notificationDeliveryService.enqueueOwnerReservationPaymentMarked(
              {
                reservationId: data.reservationId,
                placeName: place.name,
                courtLabel: court.label,
                startTimeIso: updated.startTime.toISOString(),
                endTimeIso: updated.endTime.toISOString(),
                playerName: updated.playerNameSnapshot ?? "Player",
              },
              ctx,
            );
          }
        }
      } catch (error) {
        logger.warn(
          { err: error, reservationId: data.reservationId },
          "Failed to enqueue reservation.payment_marked notification",
        );
      }

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

      if (reservation.playerId !== profileId) {
        throw new NotReservationOwnerError();
      }

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

      const policy = await this.getOrganizationPolicyForCourt(
        reservation.courtId,
        ctx,
      );
      const cancellationCutoffMinutes =
        policy?.cancellationCutoffMinutes ??
        DEFAULT_CANCELLATION_CUTOFF_MINUTES;
      const cutoffTime = new Date(reservation.startTime);
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

      try {
        const court = await this.courtRepository.findById(
          reservation.courtId,
          ctx,
        );
        if (court?.placeId) {
          const place = await this.placeRepository.findById(court.placeId, ctx);
          if (place) {
            await this.notificationDeliveryService.enqueueOwnerReservationCancelled(
              {
                reservationId: data.reservationId,
                placeName: place.name,
                courtLabel: court.label,
                startTimeIso: updated.startTime.toISOString(),
                endTimeIso: updated.endTime.toISOString(),
                playerName: updated.playerNameSnapshot ?? "Player",
                reason: data.reason,
              },
              ctx,
            );
          }
        }
      } catch (error) {
        logger.warn(
          { err: error, reservationId: data.reservationId },
          "Failed to enqueue reservation.cancelled notification",
        );
      }

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

    const court = await this.courtRepository.findById(reservation.courtId);
    if (!court) {
      throw new CourtNotFoundError(reservation.courtId);
    }

    const placeId = this.requireCourtPlaceId(court.placeId);
    const place = await this.placeRepository.findById(placeId);
    if (!place) {
      throw new PlaceNotFoundError(placeId);
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

  async getReservationDetail(
    reservationId: string,
  ): Promise<ReservationDetail> {
    const reservation =
      await this.reservationRepository.findById(reservationId);
    if (!reservation) {
      throw new ReservationNotFoundError(reservationId);
    }

    const [events, court] = await Promise.all([
      this.reservationEventRepository.findByReservationId(reservationId),
      this.courtRepository.findById(reservation.courtId),
    ]);

    if (!court) {
      throw new CourtNotFoundError(reservation.courtId);
    }

    const placeId = this.requireCourtPlaceId(court.placeId);
    const place = await this.placeRepository.findById(placeId);
    if (!place) {
      throw new PlaceNotFoundError(placeId);
    }

    const [placePhotos, reservationPolicy, organization, organizationProfile] =
      await Promise.all([
        this.placePhotoRepository.findByPlaceId(placeId),
        place.organizationId
          ? this.organizationReservationPolicyRepository.findByOrganizationId(
              place.organizationId,
            )
          : Promise.resolve(null),
        place.organizationId
          ? this.organizationRepository.findById(place.organizationId)
          : Promise.resolve(null),
        place.organizationId
          ? this.organizationProfileRepository.findByOrganizationId(
              place.organizationId,
            )
          : Promise.resolve(null),
      ]);

    return {
      reservation,
      events,
      court,
      place,
      placePhotos,
      reservationPolicy,
      organization,
      organizationProfile,
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
}
