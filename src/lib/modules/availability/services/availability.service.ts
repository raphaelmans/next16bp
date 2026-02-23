import type { PricingBreakdown } from "@/common/pricing-breakdown";
import {
  getZonedDate,
  getZonedDayRangeForInstant,
  toUtcISOString,
} from "@/common/time-zone";
import { env } from "@/lib/env";
import { CourtNotFoundError } from "@/lib/modules/court/errors/court.errors";
import type { ICourtRepository } from "@/lib/modules/court/repositories/court.repository";
import type { ICourtAddonRepository } from "@/lib/modules/court-addon/repositories/court-addon.repository";
import type { ICourtBlockRepository } from "@/lib/modules/court-block/repositories/court-block.repository";
import type { ICourtHoursRepository } from "@/lib/modules/court-hours/repositories/court-hours.repository";
import type { ICourtPriceOverrideRepository } from "@/lib/modules/court-price-override/repositories/court-price-override.repository";
import type { ICourtRateRuleRepository } from "@/lib/modules/court-rate-rule/repositories/court-rate-rule.repository";
import { PlaceNotFoundError } from "@/lib/modules/place/errors/place.errors";
import type { IPlaceRepository } from "@/lib/modules/place/repositories/place.repository";
import type { IPlaceAddonRepository } from "@/lib/modules/place-addon/repositories/place-addon.repository";
import type { IPlaceVerificationRepository } from "@/lib/modules/place-verification/repositories/place-verification.repository";
import type { IReservationRepository } from "@/lib/modules/reservation/repositories/reservation.repository";
import type {
  CourtAddonRateRuleRecord,
  CourtAddonRecord,
  CourtBlockRecord,
  CourtHoursWindowRecord,
  CourtPriceOverrideRecord,
  CourtRateRuleRecord,
  CourtRecord,
  PlaceVerificationRecord,
  ReservationRecord,
} from "@/lib/shared/infra/db/schema";
import { logger } from "@/lib/shared/infra/logger";
import {
  computeSchedulePriceDetailed,
  rangesOverlap,
  type ScheduleAddon,
} from "@/lib/shared/lib/schedule-availability";
import { getInvalidSelectedAddonIds } from "@/lib/shared/lib/selected-addon-validation";
import type {
  GetAvailabilityForCourtDTO,
  GetAvailabilityForCourtRangeDTO,
  GetAvailabilityForCourtsDTO,
  GetAvailabilityForPlaceSportDTO,
  GetAvailabilityForPlaceSportRangeDTO,
} from "../dtos";
import { InvalidAvailabilityAddonSelectionError } from "../errors/availability.errors";

export interface AvailabilityOption {
  startTime: string;
  endTime: string;
  totalPriceCents: number;
  currency: string | null;
  courtId: string;
  courtLabel: string;
  status: "AVAILABLE" | "BOOKED";
  unavailableReason?: "RESERVATION" | "MAINTENANCE" | "WALK_IN" | null;
  pricingWarnings?: string[];
  pricingBreakdown?: PricingBreakdown;
  courtOptions?: AvailabilityCourtOption[];
}

export interface AvailabilityCourtOption {
  courtId: string;
  courtLabel: string;
  status: "AVAILABLE" | "BOOKED";
  totalPriceCents: number;
  currency: string | null;
  unavailableReason?: "RESERVATION" | "MAINTENANCE" | "WALK_IN" | null;
  pricingWarnings?: string[];
  pricingBreakdown?: PricingBreakdown;
}

export interface AvailabilityDiagnostics {
  hasHoursWindows: boolean;
  hasRateRules: boolean;
  dayHasHours: boolean;
  allSlotsBooked: boolean;
  reservationsDisabled: boolean;
}

export interface AvailabilityResult {
  options: AvailabilityOption[];
  diagnostics: AvailabilityDiagnostics;
}

export interface IAvailabilityService {
  getForCourt(data: GetAvailabilityForCourtDTO): Promise<AvailabilityResult>;
  getForCourts(data: GetAvailabilityForCourtsDTO): Promise<AvailabilityResult>;
  getForPlaceSport(
    data: GetAvailabilityForPlaceSportDTO,
  ): Promise<AvailabilityResult>;
  getForCourtRange(
    data: GetAvailabilityForCourtRangeDTO,
  ): Promise<AvailabilityResult>;
  getForPlaceSportRange(
    data: GetAvailabilityForPlaceSportRangeDTO,
  ): Promise<AvailabilityResult>;
}

const SLOT_STEP_MINUTES = 60;

export class AvailabilityService implements IAvailabilityService {
  constructor(
    private courtRepository: ICourtRepository,
    private placeRepository: IPlaceRepository,
    private placeVerificationRepository: IPlaceVerificationRepository,
    private courtHoursRepository: ICourtHoursRepository,
    private courtRateRuleRepository: ICourtRateRuleRepository,
    private courtAddonRepository: ICourtAddonRepository,
    private placeAddonRepository: IPlaceAddonRepository,
    private reservationRepository: IReservationRepository,
    private courtBlockRepository: ICourtBlockRepository,
    private courtPriceOverrideRepository: ICourtPriceOverrideRepository,
  ) {}

  async getForCourt(
    data: GetAvailabilityForCourtDTO,
  ): Promise<AvailabilityResult> {
    const emptyDiagnostics: AvailabilityDiagnostics = {
      hasHoursWindows: false,
      hasRateRules: false,
      dayHasHours: false,
      allSlotsBooked: false,
      reservationsDisabled: false,
    };

    const court = await this.courtRepository.findById(data.courtId);
    if (!court) {
      throw new CourtNotFoundError(data.courtId);
    }

    if (!court.placeId) {
      throw new PlaceNotFoundError();
    }

    const place = await this.placeRepository.findById(court.placeId);
    if (!place) {
      throw new PlaceNotFoundError(court.placeId);
    }

    if (
      !place.isActive ||
      place.placeType !== "RESERVABLE" ||
      !court.isActive
    ) {
      return { options: [], diagnostics: emptyDiagnostics };
    }

    const verification = await this.placeVerificationRepository.findByPlaceId(
      place.id,
    );
    if (!this.isPlaceBookable(verification)) {
      return {
        options: [],
        diagnostics: { ...emptyDiagnostics, reservationsDisabled: true },
      };
    }

    const { start, end } = getZonedDayRangeForInstant(
      data.date,
      place.timeZone,
    );
    const courtIds = [court.id];

    const [hours, rules, reservations, blocks, overrides, addons] =
      await Promise.all([
        this.courtHoursRepository.findByCourtIds(courtIds),
        this.courtRateRuleRepository.findByCourtIds(courtIds),
        this.reservationRepository.findOverlappingActiveByCourtIds(
          courtIds,
          start,
          end,
        ),
        this.courtBlockRepository.findOverlappingByCourtIds(
          courtIds,
          start,
          end,
        ),
        this.courtPriceOverrideRepository.findOverlappingByCourtIds(
          courtIds,
          start,
          end,
        ),
        this.courtAddonRepository.findActiveByCourtIds(courtIds),
      ]);

    const [addonRules, venueAddons] = await Promise.all([
      this.courtAddonRepository.findRateRulesByAddonIds(
        addons.map((addon) => addon.id),
      ),
      this.fetchVenueAddons(place.id),
    ]);

    const invalidAddonIds = this.getInvalidSelectedAddonIdsForCourt({
      selectedAddons: data.selectedAddons,
      courtAddons: addons,
      venueAddons,
    });
    if (invalidAddonIds.length > 0) {
      throw new InvalidAvailabilityAddonSelectionError({
        courtId: court.id,
        placeId: place.id,
        invalidAddonIds,
      });
    }

    return this.buildAvailabilityForCourtRange({
      court,
      rangeStart: start,
      rangeEnd: end,
      durationMinutes: data.durationMinutes,
      timeZone: place.timeZone,
      hours,
      rules,
      addons,
      addonRules,
      venueAddons,
      reservations,
      blocks,
      overrides,
      selectedAddons: data.selectedAddons,
      includeUnavailable: data.includeUnavailable ?? false,
    });
  }

  async getForCourts(
    data: GetAvailabilityForCourtsDTO,
  ): Promise<AvailabilityResult> {
    const emptyDiagnostics: AvailabilityDiagnostics = {
      hasHoursWindows: false,
      hasRateRules: false,
      dayHasHours: false,
      allSlotsBooked: false,
      reservationsDisabled: false,
    };

    if (data.durationMinutes <= 0 || data.courtIds.length === 0) {
      return { options: [], diagnostics: emptyDiagnostics };
    }

    const courts = await this.courtRepository.findByIds(data.courtIds);
    const eligibleCourts = courts.filter(
      (court) => Boolean(court.placeId) && court.isActive,
    );
    if (eligibleCourts.length === 0) {
      return { options: [], diagnostics: emptyDiagnostics };
    }

    const placeIds = Array.from(
      new Set(
        eligibleCourts
          .map((court) => court.placeId)
          .filter((placeId): placeId is string => Boolean(placeId)),
      ),
    );

    const [places, verifications] = await Promise.all([
      this.placeRepository.findByIds(placeIds),
      this.placeVerificationRepository.findByPlaceIds(placeIds),
    ]);

    const placeById = new Map(places.map((place) => [place.id, place]));
    const verificationByPlaceId = new Map(
      verifications.map((verification) => [verification.placeId, verification]),
    );

    const courtsByPlace = new Map<string, CourtRecord[]>();
    for (const court of eligibleCourts) {
      const placeId = court.placeId;
      if (!placeId) continue;
      const place = placeById.get(placeId);
      if (!place || !place.isActive || place.placeType !== "RESERVABLE") {
        continue;
      }
      const verification = verificationByPlaceId.get(placeId) ?? null;
      if (!this.isPlaceBookable(verification)) {
        continue;
      }
      const entry = courtsByPlace.get(placeId) ?? [];
      entry.push(court);
      courtsByPlace.set(placeId, entry);
    }

    if (courtsByPlace.size === 0) {
      return { options: [], diagnostics: emptyDiagnostics };
    }

    const allCourtIds = eligibleCourts.map((court) => court.id);
    const [hours, rules, addons] = await Promise.all([
      this.courtHoursRepository.findByCourtIds(allCourtIds),
      this.courtRateRuleRepository.findByCourtIds(allCourtIds),
      this.courtAddonRepository.findActiveByCourtIds(allCourtIds),
    ]);

    const addonRules = await this.courtAddonRepository.findRateRulesByAddonIds(
      addons.map((addon) => addon.id),
    );

    const options: AvailabilityOption[] = [];
    const aggregatedDiagnostics: AvailabilityDiagnostics = {
      hasHoursWindows: false,
      hasRateRules: false,
      dayHasHours: false,
      allSlotsBooked: true,
      reservationsDisabled: false,
    };
    let hasAnySlots = false;
    const hasSelectedAddons = (data.selectedAddons?.length ?? 0) > 0;
    const invalidSelectedAddonIds = new Set<string>();
    let hasAddonCompatibleCourt = !hasSelectedAddons;

    for (const [placeId, placeCourts] of courtsByPlace.entries()) {
      const place = placeById.get(placeId);
      if (!place) continue;

      const { start, end } = getZonedDayRangeForInstant(
        data.date,
        place.timeZone,
      );
      const placeCourtIds = placeCourts.map((court) => court.id);

      const [reservations, blocks, overrides, venueAddons] = await Promise.all([
        this.reservationRepository.findOverlappingActiveByCourtIds(
          placeCourtIds,
          start,
          end,
        ),
        this.courtBlockRepository.findOverlappingByCourtIds(
          placeCourtIds,
          start,
          end,
        ),
        this.courtPriceOverrideRepository.findOverlappingByCourtIds(
          placeCourtIds,
          start,
          end,
        ),
        this.fetchVenueAddons(placeId),
      ]);

      for (const court of placeCourts) {
        const courtAddons = addons.filter(
          (addon) => addon.courtId === court.id,
        );
        const invalidAddonIds = this.getInvalidSelectedAddonIdsForCourt({
          selectedAddons: data.selectedAddons,
          courtAddons,
          venueAddons,
        });
        if (invalidAddonIds.length > 0) {
          for (const addonId of invalidAddonIds) {
            invalidSelectedAddonIds.add(addonId);
          }
          continue;
        }
        hasAddonCompatibleCourt = true;

        const result = this.buildAvailabilityForCourtRange({
          court,
          rangeStart: start,
          rangeEnd: end,
          durationMinutes: data.durationMinutes,
          timeZone: place.timeZone,
          hours,
          rules,
          addons,
          addonRules,
          venueAddons,
          reservations,
          blocks,
          overrides,
          selectedAddons: data.selectedAddons,
          includeUnavailable: data.includeUnavailable ?? false,
        });
        options.push(...result.options);

        aggregatedDiagnostics.hasHoursWindows ||=
          result.diagnostics.hasHoursWindows;
        aggregatedDiagnostics.hasRateRules ||= result.diagnostics.hasRateRules;
        aggregatedDiagnostics.dayHasHours ||= result.diagnostics.dayHasHours;
        if (result.options.length > 0) {
          hasAnySlots = true;
          aggregatedDiagnostics.allSlotsBooked &&=
            result.diagnostics.allSlotsBooked;
        }
      }
    }

    if (!hasAddonCompatibleCourt && invalidSelectedAddonIds.size > 0) {
      throw new InvalidAvailabilityAddonSelectionError({
        invalidAddonIds: Array.from(invalidSelectedAddonIds),
      });
    }

    if (!hasAnySlots) {
      aggregatedDiagnostics.allSlotsBooked = false;
    }

    return {
      options: options.sort((a, b) => a.startTime.localeCompare(b.startTime)),
      diagnostics: aggregatedDiagnostics,
    };
  }

  async getForPlaceSport(
    data: GetAvailabilityForPlaceSportDTO,
  ): Promise<AvailabilityResult> {
    const emptyDiagnostics: AvailabilityDiagnostics = {
      hasHoursWindows: false,
      hasRateRules: false,
      dayHasHours: false,
      allSlotsBooked: false,
      reservationsDisabled: false,
    };

    const place = await this.placeRepository.findById(data.placeId);
    if (!place) {
      throw new PlaceNotFoundError(data.placeId);
    }

    if (!place.isActive || place.placeType !== "RESERVABLE") {
      return { options: [], diagnostics: emptyDiagnostics };
    }

    const verification = await this.placeVerificationRepository.findByPlaceId(
      place.id,
    );
    if (!this.isPlaceBookable(verification)) {
      return {
        options: [],
        diagnostics: { ...emptyDiagnostics, reservationsDisabled: true },
      };
    }

    const courts = await this.courtRepository.findByPlaceAndSport(
      data.placeId,
      data.sportId,
    );

    const activeCourts = courts.filter((court) => court.isActive);
    if (activeCourts.length === 0) {
      return { options: [], diagnostics: emptyDiagnostics };
    }

    const { start, end } = getZonedDayRangeForInstant(
      data.date,
      place.timeZone,
    );
    const courtIds = activeCourts.map((court) => court.id);

    const [hours, rules, reservations, blocks, overrides, addons] =
      await Promise.all([
        this.courtHoursRepository.findByCourtIds(courtIds),
        this.courtRateRuleRepository.findByCourtIds(courtIds),
        this.reservationRepository.findOverlappingActiveByCourtIds(
          courtIds,
          start,
          end,
        ),
        this.courtBlockRepository.findOverlappingByCourtIds(
          courtIds,
          start,
          end,
        ),
        this.courtPriceOverrideRepository.findOverlappingByCourtIds(
          courtIds,
          start,
          end,
        ),
        this.courtAddonRepository.findActiveByCourtIds(courtIds),
      ]);

    const [addonRules, venueAddons] = await Promise.all([
      this.courtAddonRepository.findRateRulesByAddonIds(
        addons.map((addon) => addon.id),
      ),
      this.fetchVenueAddons(place.id),
    ]);

    const optionsByStart = new Map<number, AvailabilityOption>();
    const courtOptionsByStart = new Map<number, AvailabilityCourtOption[]>();
    const includeUnavailable = data.includeUnavailable ?? false;
    const includeCourtOptions = data.includeCourtOptions ?? false;

    const aggregatedDiagnostics: AvailabilityDiagnostics = {
      hasHoursWindows: false,
      hasRateRules: false,
      dayHasHours: false,
      allSlotsBooked: true,
      reservationsDisabled: false,
    };
    let hasAnySlots = false;
    const hasSelectedAddons = (data.selectedAddons?.length ?? 0) > 0;
    const invalidSelectedAddonIds = new Set<string>();
    let hasAddonCompatibleCourt = !hasSelectedAddons;

    for (const court of activeCourts) {
      const courtAddons = addons.filter((addon) => addon.courtId === court.id);
      const invalidAddonIds = this.getInvalidSelectedAddonIdsForCourt({
        selectedAddons: data.selectedAddons,
        courtAddons,
        venueAddons,
      });
      if (invalidAddonIds.length > 0) {
        for (const addonId of invalidAddonIds) {
          invalidSelectedAddonIds.add(addonId);
        }
        continue;
      }
      hasAddonCompatibleCourt = true;

      const result = this.buildAvailabilityForCourtRange({
        court,
        rangeStart: start,
        rangeEnd: end,
        durationMinutes: data.durationMinutes,
        timeZone: place.timeZone,
        hours,
        rules,
        addons,
        addonRules,
        venueAddons,
        reservations,
        blocks,
        overrides,
        selectedAddons: data.selectedAddons,
        includeUnavailable,
      });

      aggregatedDiagnostics.hasHoursWindows ||=
        result.diagnostics.hasHoursWindows;
      aggregatedDiagnostics.hasRateRules ||= result.diagnostics.hasRateRules;
      aggregatedDiagnostics.dayHasHours ||= result.diagnostics.dayHasHours;
      if (result.options.length > 0) {
        hasAnySlots = true;
        aggregatedDiagnostics.allSlotsBooked &&=
          result.diagnostics.allSlotsBooked;
      }

      for (const option of result.options) {
        const startMs = new Date(option.startTime).getTime();
        if (includeCourtOptions) {
          const entry = courtOptionsByStart.get(startMs) ?? [];
          entry.push({
            courtId: option.courtId,
            courtLabel: option.courtLabel,
            status: option.status,
            totalPriceCents: option.totalPriceCents,
            currency: option.currency,
            unavailableReason: option.unavailableReason ?? null,
            pricingWarnings: option.pricingWarnings ?? [],
            pricingBreakdown: option.pricingBreakdown,
          });
          courtOptionsByStart.set(startMs, entry);
        }
        const existing = optionsByStart.get(startMs);
        if (!existing) {
          optionsByStart.set(startMs, option);
          continue;
        }

        const preferred = this.pickCheapestOption(existing, option);
        optionsByStart.set(startMs, preferred);
      }
    }

    if (!hasAddonCompatibleCourt && invalidSelectedAddonIds.size > 0) {
      throw new InvalidAvailabilityAddonSelectionError({
        placeId: place.id,
        sportId: data.sportId,
        invalidAddonIds: Array.from(invalidSelectedAddonIds),
      });
    }

    if (!hasAnySlots) {
      aggregatedDiagnostics.allSlotsBooked = false;
    }

    const sortedOptions = Array.from(optionsByStart.entries())
      .map(([startMs, option]) => ({
        ...option,
        courtOptions: includeCourtOptions
          ? this.sortCourtOptions(courtOptionsByStart.get(startMs) ?? [])
          : undefined,
      }))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    return { options: sortedOptions, diagnostics: aggregatedDiagnostics };
  }

  async getForCourtRange(
    data: GetAvailabilityForCourtRangeDTO,
  ): Promise<AvailabilityResult> {
    const emptyDiagnostics: AvailabilityDiagnostics = {
      hasHoursWindows: false,
      hasRateRules: false,
      dayHasHours: false,
      allSlotsBooked: false,
      reservationsDisabled: false,
    };

    const court = await this.courtRepository.findById(data.courtId);
    if (!court) {
      throw new CourtNotFoundError(data.courtId);
    }

    if (!court.placeId) {
      throw new PlaceNotFoundError();
    }

    const place = await this.placeRepository.findById(court.placeId);
    if (!place) {
      throw new PlaceNotFoundError(court.placeId);
    }

    if (
      !place.isActive ||
      place.placeType !== "RESERVABLE" ||
      !court.isActive
    ) {
      return { options: [], diagnostics: emptyDiagnostics };
    }

    const verification = await this.placeVerificationRepository.findByPlaceId(
      place.id,
    );
    if (!this.isPlaceBookable(verification)) {
      return {
        options: [],
        diagnostics: { ...emptyDiagnostics, reservationsDisabled: true },
      };
    }

    const rangeStart = new Date(data.startDate);
    const rangeEnd = new Date(data.endDate);
    const courtIds = [court.id];

    const [hours, rules, reservations, blocks, overrides, addons] =
      await Promise.all([
        this.courtHoursRepository.findByCourtIds(courtIds),
        this.courtRateRuleRepository.findByCourtIds(courtIds),
        this.reservationRepository.findOverlappingActiveByCourtIds(
          courtIds,
          rangeStart,
          rangeEnd,
        ),
        this.courtBlockRepository.findOverlappingByCourtIds(
          courtIds,
          rangeStart,
          rangeEnd,
        ),
        this.courtPriceOverrideRepository.findOverlappingByCourtIds(
          courtIds,
          rangeStart,
          rangeEnd,
        ),
        this.courtAddonRepository.findActiveByCourtIds(courtIds),
      ]);

    const [addonRules, venueAddons] = await Promise.all([
      this.courtAddonRepository.findRateRulesByAddonIds(
        addons.map((addon) => addon.id),
      ),
      this.fetchVenueAddons(place.id),
    ]);

    const invalidAddonIds = this.getInvalidSelectedAddonIdsForCourt({
      selectedAddons: data.selectedAddons,
      courtAddons: addons,
      venueAddons,
    });
    if (invalidAddonIds.length > 0) {
      throw new InvalidAvailabilityAddonSelectionError({
        courtId: court.id,
        placeId: place.id,
        invalidAddonIds,
      });
    }

    return this.buildAvailabilityForCourtRange({
      court,
      rangeStart,
      rangeEnd,
      durationMinutes: data.durationMinutes,
      timeZone: place.timeZone,
      hours,
      rules,
      addons,
      addonRules,
      venueAddons,
      reservations,
      blocks,
      overrides,
      selectedAddons: data.selectedAddons,
      includeUnavailable: data.includeUnavailable ?? false,
    });
  }

  async getForPlaceSportRange(
    data: GetAvailabilityForPlaceSportRangeDTO,
  ): Promise<AvailabilityResult> {
    const emptyDiagnostics: AvailabilityDiagnostics = {
      hasHoursWindows: false,
      hasRateRules: false,
      dayHasHours: false,
      allSlotsBooked: false,
      reservationsDisabled: false,
    };

    const place = await this.placeRepository.findById(data.placeId);
    if (!place) {
      throw new PlaceNotFoundError(data.placeId);
    }

    if (!place.isActive || place.placeType !== "RESERVABLE") {
      return { options: [], diagnostics: emptyDiagnostics };
    }

    const verification = await this.placeVerificationRepository.findByPlaceId(
      place.id,
    );
    if (!this.isPlaceBookable(verification)) {
      return {
        options: [],
        diagnostics: { ...emptyDiagnostics, reservationsDisabled: true },
      };
    }

    const courts = await this.courtRepository.findByPlaceAndSport(
      data.placeId,
      data.sportId,
    );

    const activeCourts = courts.filter((court) => court.isActive);
    if (activeCourts.length === 0) {
      return { options: [], diagnostics: emptyDiagnostics };
    }

    const rangeStart = new Date(data.startDate);
    const rangeEnd = new Date(data.endDate);
    const courtIds = activeCourts.map((court) => court.id);

    const [hours, rules, reservations, blocks, overrides, addons] =
      await Promise.all([
        this.courtHoursRepository.findByCourtIds(courtIds),
        this.courtRateRuleRepository.findByCourtIds(courtIds),
        this.reservationRepository.findOverlappingActiveByCourtIds(
          courtIds,
          rangeStart,
          rangeEnd,
        ),
        this.courtBlockRepository.findOverlappingByCourtIds(
          courtIds,
          rangeStart,
          rangeEnd,
        ),
        this.courtPriceOverrideRepository.findOverlappingByCourtIds(
          courtIds,
          rangeStart,
          rangeEnd,
        ),
        this.courtAddonRepository.findActiveByCourtIds(courtIds),
      ]);

    const [addonRules, venueAddons] = await Promise.all([
      this.courtAddonRepository.findRateRulesByAddonIds(
        addons.map((addon) => addon.id),
      ),
      this.fetchVenueAddons(place.id),
    ]);

    const optionsByStart = new Map<number, AvailabilityOption>();
    const courtOptionsByStart = new Map<number, AvailabilityCourtOption[]>();
    const includeUnavailable = data.includeUnavailable ?? false;
    const includeCourtOptions = data.includeCourtOptions ?? false;

    const aggregatedDiagnostics: AvailabilityDiagnostics = {
      hasHoursWindows: false,
      hasRateRules: false,
      dayHasHours: false,
      allSlotsBooked: true,
      reservationsDisabled: false,
    };
    let hasAnySlots = false;
    const hasSelectedAddons = (data.selectedAddons?.length ?? 0) > 0;
    const invalidSelectedAddonIds = new Set<string>();
    let hasAddonCompatibleCourt = !hasSelectedAddons;

    for (const court of activeCourts) {
      const courtAddons = addons.filter((addon) => addon.courtId === court.id);
      const invalidAddonIds = this.getInvalidSelectedAddonIdsForCourt({
        selectedAddons: data.selectedAddons,
        courtAddons,
        venueAddons,
      });
      if (invalidAddonIds.length > 0) {
        for (const addonId of invalidAddonIds) {
          invalidSelectedAddonIds.add(addonId);
        }
        continue;
      }
      hasAddonCompatibleCourt = true;

      const result = this.buildAvailabilityForCourtRange({
        court,
        rangeStart,
        rangeEnd,
        durationMinutes: data.durationMinutes,
        timeZone: place.timeZone,
        hours,
        rules,
        addons,
        addonRules,
        venueAddons,
        reservations,
        blocks,
        overrides,
        selectedAddons: data.selectedAddons,
        includeUnavailable,
      });

      aggregatedDiagnostics.hasHoursWindows ||=
        result.diagnostics.hasHoursWindows;
      aggregatedDiagnostics.hasRateRules ||= result.diagnostics.hasRateRules;
      aggregatedDiagnostics.dayHasHours ||= result.diagnostics.dayHasHours;
      if (result.options.length > 0) {
        hasAnySlots = true;
        aggregatedDiagnostics.allSlotsBooked &&=
          result.diagnostics.allSlotsBooked;
      }

      for (const option of result.options) {
        const startMs = new Date(option.startTime).getTime();
        if (includeCourtOptions) {
          const entry = courtOptionsByStart.get(startMs) ?? [];
          entry.push({
            courtId: option.courtId,
            courtLabel: option.courtLabel,
            status: option.status,
            totalPriceCents: option.totalPriceCents,
            currency: option.currency,
            unavailableReason: option.unavailableReason ?? null,
            pricingWarnings: option.pricingWarnings ?? [],
            pricingBreakdown: option.pricingBreakdown,
          });
          courtOptionsByStart.set(startMs, entry);
        }
        const existing = optionsByStart.get(startMs);
        if (!existing) {
          optionsByStart.set(startMs, option);
          continue;
        }

        const preferred = this.pickCheapestOption(existing, option);
        optionsByStart.set(startMs, preferred);
      }
    }

    if (!hasAddonCompatibleCourt && invalidSelectedAddonIds.size > 0) {
      throw new InvalidAvailabilityAddonSelectionError({
        placeId: place.id,
        sportId: data.sportId,
        invalidAddonIds: Array.from(invalidSelectedAddonIds),
      });
    }

    if (!hasAnySlots) {
      aggregatedDiagnostics.allSlotsBooked = false;
    }

    const sortedOptions = Array.from(optionsByStart.entries())
      .map(([startMs, option]) => ({
        ...option,
        courtOptions: includeCourtOptions
          ? this.sortCourtOptions(courtOptionsByStart.get(startMs) ?? [])
          : undefined,
      }))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    return { options: sortedOptions, diagnostics: aggregatedDiagnostics };
  }

  private isPlaceBookable(
    verification: PlaceVerificationRecord | null,
  ): boolean {
    if (!verification) return false;
    return (
      verification.status === "VERIFIED" && verification.reservationsEnabled
    );
  }

  private isReservationBlocking(reservation: ReservationRecord): boolean {
    if (
      reservation.status === "CANCELLED" ||
      reservation.status === "EXPIRED"
    ) {
      return false;
    }
    if (reservation.status === "CONFIRMED") {
      return true;
    }
    if (!reservation.expiresAt) {
      return true;
    }
    return new Date(reservation.expiresAt) > new Date();
  }

  private async fetchVenueAddons(placeId: string): Promise<ScheduleAddon[]> {
    const addons = await this.placeAddonRepository.findActiveByPlaceId(placeId);
    if (addons.length === 0) return [];
    const rules = await this.placeAddonRepository.findRateRulesByAddonIds(
      addons.map((a) => a.id),
    );
    return addons.map((addon) => ({
      addon,
      rules: rules.filter((r) => r.addonId === addon.id),
    }));
  }

  private getInvalidSelectedAddonIdsForCourt(options: {
    selectedAddons?: { addonId: string; quantity: number }[];
    courtAddons: CourtAddonRecord[];
    venueAddons?: ScheduleAddon[];
  }): string[] {
    const { selectedAddons, courtAddons, venueAddons } = options;
    const allowedAddonIds = new Set<string>();

    for (const addon of courtAddons) {
      if (addon.isActive) {
        allowedAddonIds.add(addon.id);
      }
    }
    for (const config of venueAddons ?? []) {
      if (config.addon.isActive) {
        allowedAddonIds.add(config.addon.id);
      }
    }

    return getInvalidSelectedAddonIds({
      selectedAddons,
      allowedAddonIds,
    });
  }

  private buildAvailabilityForCourtRange(options: {
    court: CourtRecord;
    rangeStart: Date;
    rangeEnd: Date;
    durationMinutes: number;
    timeZone: string;
    hours: CourtHoursWindowRecord[];
    rules: CourtRateRuleRecord[];
    addons: CourtAddonRecord[];
    addonRules: CourtAddonRateRuleRecord[];
    venueAddons?: ScheduleAddon[];
    reservations: ReservationRecord[];
    blocks: CourtBlockRecord[];
    overrides: CourtPriceOverrideRecord[];
    selectedAddons?: { addonId: string; quantity: number }[];
    includeUnavailable?: boolean;
  }): { options: AvailabilityOption[]; diagnostics: AvailabilityDiagnostics } {
    const {
      court,
      rangeStart,
      rangeEnd,
      durationMinutes,
      timeZone,
      hours,
      rules,
      addons,
      addonRules,
      venueAddons,
      reservations,
      blocks,
      overrides,
      selectedAddons,
      includeUnavailable,
    } = options;

    const allowUnavailable = includeUnavailable ?? false;

    const hoursWindows = hours.filter((window) => window.courtId === court.id);
    const rateRules = rules.filter((rule) => rule.courtId === court.id);
    const priceOverrides = overrides.filter(
      (override) => override.courtId === court.id,
    );
    const courtAddons = addons
      .filter((addon) => addon.courtId === court.id)
      .map((addon) => ({
        addon,
        rules: addonRules.filter((rule) => rule.addonId === addon.id),
      }));

    const baseDiagnostics: AvailabilityDiagnostics = {
      hasHoursWindows: hoursWindows.length > 0,
      hasRateRules: rateRules.length > 0,
      dayHasHours: false,
      allSlotsBooked: false,
      reservationsDisabled: false,
    };

    if (durationMinutes <= 0) {
      return { options: [], diagnostics: baseDiagnostics };
    }

    if (hoursWindows.length === 0 || rateRules.length === 0) {
      return { options: [], diagnostics: baseDiagnostics };
    }

    const courtReservations = reservations
      .filter((reservation) => reservation.courtId === court.id)
      .filter((reservation) => this.isReservationBlocking(reservation));
    const courtBlocks = blocks.filter(
      (block) => block.courtId === court.id && block.isActive,
    );

    const rangeStartDay = getZonedDayRangeForInstant(
      rangeStart,
      timeZone,
    ).start;
    const rangeEndDay = getZonedDayRangeForInstant(rangeEnd, timeZone).start;

    const results: AvailabilityOption[] = [];
    const dayCursor = getZonedDate(rangeStartDay, timeZone);
    let anyDayHasHours = false;
    let totalSlotsGenerated = 0;
    let bookedSlotsCount = 0;
    let hasAddonCurrencyMismatch = false;

    while (dayCursor <= rangeEndDay) {
      const dayStart = getZonedDayRangeForInstant(dayCursor, timeZone).start;
      const dayOfWeek = dayStart.getDay();
      const dayWindows = hoursWindows.filter(
        (window) => window.dayOfWeek === dayOfWeek,
      );
      if (dayWindows.length === 0) {
        dayCursor.setDate(dayCursor.getDate() + 1);
        continue;
      }
      anyDayHasHours = true;

      const startMinutes = new Set<number>();
      for (const window of dayWindows) {
        for (
          let minute = window.startMinute;
          minute + SLOT_STEP_MINUTES <= window.endMinute;
          minute += SLOT_STEP_MINUTES
        ) {
          startMinutes.add(minute);
        }
      }

      const sortedMinutes = Array.from(startMinutes).sort((a, b) => a - b);

      for (const minute of sortedMinutes) {
        const startTime = getZonedDate(dayStart, timeZone);
        startTime.setHours(Math.floor(minute / 60), minute % 60, 0, 0);

        const pricingDetailed = computeSchedulePriceDetailed({
          startTime,
          durationMinutes,
          timeZone,
          hoursWindows,
          rateRules,
          priceOverrides,
          addons: courtAddons,
          venueAddons,
          selectedAddons,
          enableAddonPricing: env.ENABLE_ADDON_PRICING_V2 !== false,
        });
        const pricing = pricingDetailed.result;
        if (!pricing) {
          if (pricingDetailed.failureReason === "ADDON_CURRENCY_MISMATCH") {
            hasAddonCurrencyMismatch = true;
          }
          continue;
        }

        if (pricing.warnings.length > 0) {
          logger.warn(
            {
              event: "availability.pricing_addon_warnings",
              courtId: court.id,
              warningCodes: pricing.warnings.map((warning) => warning.code),
              warningCount: pricing.warnings.length,
            },
            "Availability pricing completed with addon warnings",
          );
        }

        const endTime = pricing.endTime;
        if (startTime < rangeStart || endTime > rangeEnd) {
          continue;
        }

        const reservationOverlap = courtReservations.find((reservation) =>
          rangesOverlap({
            startA: startTime,
            endA: endTime,
            startB: new Date(reservation.startTime),
            endB: new Date(reservation.endTime),
          }),
        );

        const blockOverlap = courtBlocks.find((block) =>
          rangesOverlap({
            startA: startTime,
            endA: endTime,
            startB: new Date(block.startTime),
            endB: new Date(block.endTime),
          }),
        );

        const isUnavailable = Boolean(reservationOverlap || blockOverlap);
        totalSlotsGenerated++;
        if (isUnavailable) {
          bookedSlotsCount++;
        }

        if (isUnavailable && !allowUnavailable) {
          continue;
        }

        results.push({
          startTime: toUtcISOString(startTime),
          endTime: toUtcISOString(endTime),
          totalPriceCents: pricing.totalPriceCents,
          currency: pricing.currency,
          courtId: court.id,
          courtLabel: court.label,
          status: isUnavailable ? "BOOKED" : "AVAILABLE",
          unavailableReason: reservationOverlap
            ? "RESERVATION"
            : blockOverlap?.type === "WALK_IN"
              ? "WALK_IN"
              : blockOverlap
                ? "MAINTENANCE"
                : null,
          pricingWarnings: pricing.warnings.map((warning) => warning.message),
          pricingBreakdown: pricing.pricingBreakdown,
        });
      }

      dayCursor.setDate(dayCursor.getDate() + 1);
    }

    const sortedOptions = results.sort((a, b) =>
      a.startTime.localeCompare(b.startTime),
    );

    const diagnostics: AvailabilityDiagnostics = {
      hasHoursWindows: hoursWindows.length > 0,
      hasRateRules: rateRules.length > 0,
      dayHasHours: anyDayHasHours,
      allSlotsBooked:
        totalSlotsGenerated > 0 && bookedSlotsCount === totalSlotsGenerated,
      reservationsDisabled: false,
    };

    if (hasAddonCurrencyMismatch) {
      logger.warn(
        {
          event: "availability.pricing_addon_currency_mismatch",
          courtId: court.id,
          rangeStart: rangeStart.toISOString(),
          rangeEnd: rangeEnd.toISOString(),
        },
        "Availability encountered addon currency mismatch",
      );
    }

    return { options: sortedOptions, diagnostics };
  }

  private pickCheapestOption(
    current: AvailabilityOption,
    next: AvailabilityOption,
  ): AvailabilityOption {
    if (current.status !== next.status) {
      return current.status === "AVAILABLE" ? current : next;
    }

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

  private sortCourtOptions(
    options: AvailabilityCourtOption[],
  ): AvailabilityCourtOption[] {
    return [...options].sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === "AVAILABLE" ? -1 : 1;
      }
      return a.courtLabel.localeCompare(b.courtLabel);
    });
  }
}
