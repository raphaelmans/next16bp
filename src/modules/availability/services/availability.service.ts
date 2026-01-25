import { CourtNotFoundError } from "@/modules/court/errors/court.errors";
import type { ICourtRepository } from "@/modules/court/repositories/court.repository";
import type { ICourtBlockRepository } from "@/modules/court-block/repositories/court-block.repository";
import type { ICourtHoursRepository } from "@/modules/court-hours/repositories/court-hours.repository";
import type { ICourtPriceOverrideRepository } from "@/modules/court-price-override/repositories/court-price-override.repository";
import type { ICourtRateRuleRepository } from "@/modules/court-rate-rule/repositories/court-rate-rule.repository";
import { PlaceNotFoundError } from "@/modules/place/errors/place.errors";
import type { IPlaceRepository } from "@/modules/place/repositories/place.repository";
import type { IPlaceVerificationRepository } from "@/modules/place-verification/repositories/place-verification.repository";
import type { IReservationRepository } from "@/modules/reservation/repositories/reservation.repository";
import type {
  CourtBlockRecord,
  CourtHoursWindowRecord,
  CourtPriceOverrideRecord,
  CourtRateRuleRecord,
  CourtRecord,
  PlaceVerificationRecord,
  ReservationRecord,
} from "@/shared/infra/db/schema";
import {
  computeSchedulePrice,
  rangesOverlap,
} from "@/shared/lib/schedule-availability";
import {
  getZonedDate,
  getZonedDayRangeForInstant,
  toUtcISOString,
} from "@/shared/lib/time-zone";
import type {
  GetAvailabilityForCourtDTO,
  GetAvailabilityForCourtRangeDTO,
  GetAvailabilityForCourtsDTO,
  GetAvailabilityForPlaceSportDTO,
  GetAvailabilityForPlaceSportRangeDTO,
} from "../dtos";

export interface AvailabilityOption {
  startTime: string;
  endTime: string;
  totalPriceCents: number;
  currency: string | null;
  courtId: string;
  courtLabel: string;
  status: "AVAILABLE" | "BOOKED";
  unavailableReason?: "RESERVATION" | "MAINTENANCE" | "WALK_IN" | null;
  courtOptions?: AvailabilityCourtOption[];
}

export interface AvailabilityCourtOption {
  courtId: string;
  courtLabel: string;
  status: "AVAILABLE" | "BOOKED";
  totalPriceCents: number;
  currency: string | null;
  unavailableReason?: "RESERVATION" | "MAINTENANCE" | "WALK_IN" | null;
}

export interface IAvailabilityService {
  getForCourt(data: GetAvailabilityForCourtDTO): Promise<AvailabilityOption[]>;
  getForCourts(
    data: GetAvailabilityForCourtsDTO,
  ): Promise<AvailabilityOption[]>;
  getForPlaceSport(
    data: GetAvailabilityForPlaceSportDTO,
  ): Promise<AvailabilityOption[]>;
  getForCourtRange(
    data: GetAvailabilityForCourtRangeDTO,
  ): Promise<AvailabilityOption[]>;
  getForPlaceSportRange(
    data: GetAvailabilityForPlaceSportRangeDTO,
  ): Promise<AvailabilityOption[]>;
}

const SLOT_STEP_MINUTES = 60;

export class AvailabilityService implements IAvailabilityService {
  constructor(
    private courtRepository: ICourtRepository,
    private placeRepository: IPlaceRepository,
    private placeVerificationRepository: IPlaceVerificationRepository,
    private courtHoursRepository: ICourtHoursRepository,
    private courtRateRuleRepository: ICourtRateRuleRepository,
    private reservationRepository: IReservationRepository,
    private courtBlockRepository: ICourtBlockRepository,
    private courtPriceOverrideRepository: ICourtPriceOverrideRepository,
  ) {}

  async getForCourt(
    data: GetAvailabilityForCourtDTO,
  ): Promise<AvailabilityOption[]> {
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
      return [];
    }

    const verification = await this.placeVerificationRepository.findByPlaceId(
      place.id,
    );
    if (!this.isPlaceBookable(verification)) {
      return [];
    }

    const { start, end } = getZonedDayRangeForInstant(
      data.date,
      place.timeZone,
    );
    const courtIds = [court.id];

    const [hours, rules, reservations, blocks, overrides] = await Promise.all([
      this.courtHoursRepository.findByCourtIds(courtIds),
      this.courtRateRuleRepository.findByCourtIds(courtIds),
      this.reservationRepository.findOverlappingActiveByCourtIds(
        courtIds,
        start,
        end,
      ),
      this.courtBlockRepository.findOverlappingByCourtIds(courtIds, start, end),
      this.courtPriceOverrideRepository.findOverlappingByCourtIds(
        courtIds,
        start,
        end,
      ),
    ]);

    return this.buildAvailabilityForCourtRange({
      court,
      rangeStart: start,
      rangeEnd: end,
      durationMinutes: data.durationMinutes,
      timeZone: place.timeZone,
      hours,
      rules,
      reservations,
      blocks,
      overrides,
      includeUnavailable: data.includeUnavailable ?? false,
    });
  }

  async getForCourts(
    data: GetAvailabilityForCourtsDTO,
  ): Promise<AvailabilityOption[]> {
    if (data.durationMinutes <= 0 || data.courtIds.length === 0) {
      return [];
    }

    const courts = await this.courtRepository.findByIds(data.courtIds);
    const eligibleCourts = courts.filter(
      (court) => Boolean(court.placeId) && court.isActive,
    );
    if (eligibleCourts.length === 0) {
      return [];
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
      return [];
    }

    const allCourtIds = eligibleCourts.map((court) => court.id);
    const [hours, rules] = await Promise.all([
      this.courtHoursRepository.findByCourtIds(allCourtIds),
      this.courtRateRuleRepository.findByCourtIds(allCourtIds),
    ]);

    const options: AvailabilityOption[] = [];
    for (const [placeId, placeCourts] of courtsByPlace.entries()) {
      const place = placeById.get(placeId);
      if (!place) continue;

      const { start, end } = getZonedDayRangeForInstant(
        data.date,
        place.timeZone,
      );
      const placeCourtIds = placeCourts.map((court) => court.id);

      const [reservations, blocks, overrides] = await Promise.all([
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
      ]);

      for (const court of placeCourts) {
        options.push(
          ...this.buildAvailabilityForCourtRange({
            court,
            rangeStart: start,
            rangeEnd: end,
            durationMinutes: data.durationMinutes,
            timeZone: place.timeZone,
            hours,
            rules,
            reservations,
            blocks,
            overrides,
            includeUnavailable: data.includeUnavailable ?? false,
          }),
        );
      }
    }

    return options.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  async getForPlaceSport(
    data: GetAvailabilityForPlaceSportDTO,
  ): Promise<AvailabilityOption[]> {
    const place = await this.placeRepository.findById(data.placeId);
    if (!place) {
      throw new PlaceNotFoundError(data.placeId);
    }

    if (!place.isActive || place.placeType !== "RESERVABLE") {
      return [];
    }

    const verification = await this.placeVerificationRepository.findByPlaceId(
      place.id,
    );
    if (!this.isPlaceBookable(verification)) {
      return [];
    }

    const courts = await this.courtRepository.findByPlaceAndSport(
      data.placeId,
      data.sportId,
    );

    const activeCourts = courts.filter((court) => court.isActive);
    if (activeCourts.length === 0) {
      return [];
    }

    const { start, end } = getZonedDayRangeForInstant(
      data.date,
      place.timeZone,
    );
    const courtIds = activeCourts.map((court) => court.id);

    const [hours, rules, reservations, blocks, overrides] = await Promise.all([
      this.courtHoursRepository.findByCourtIds(courtIds),
      this.courtRateRuleRepository.findByCourtIds(courtIds),
      this.reservationRepository.findOverlappingActiveByCourtIds(
        courtIds,
        start,
        end,
      ),
      this.courtBlockRepository.findOverlappingByCourtIds(courtIds, start, end),
      this.courtPriceOverrideRepository.findOverlappingByCourtIds(
        courtIds,
        start,
        end,
      ),
    ]);

    const optionsByStart = new Map<number, AvailabilityOption>();
    const courtOptionsByStart = new Map<number, AvailabilityCourtOption[]>();
    const includeUnavailable = data.includeUnavailable ?? false;
    const includeCourtOptions = data.includeCourtOptions ?? false;

    for (const court of activeCourts) {
      const availability = this.buildAvailabilityForCourtRange({
        court,
        rangeStart: start,
        rangeEnd: end,
        durationMinutes: data.durationMinutes,
        timeZone: place.timeZone,
        hours,
        rules,
        reservations,
        blocks,
        overrides,
        includeUnavailable,
      });

      for (const option of availability) {
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

    return Array.from(optionsByStart.entries())
      .map(([startMs, option]) => ({
        ...option,
        courtOptions: includeCourtOptions
          ? this.sortCourtOptions(courtOptionsByStart.get(startMs) ?? [])
          : undefined,
      }))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  async getForCourtRange(
    data: GetAvailabilityForCourtRangeDTO,
  ): Promise<AvailabilityOption[]> {
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
      return [];
    }

    const verification = await this.placeVerificationRepository.findByPlaceId(
      place.id,
    );
    if (!this.isPlaceBookable(verification)) {
      return [];
    }

    const rangeStart = new Date(data.startDate);
    const rangeEnd = new Date(data.endDate);
    const courtIds = [court.id];

    const [hours, rules, reservations, blocks, overrides] = await Promise.all([
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
    ]);

    return this.buildAvailabilityForCourtRange({
      court,
      rangeStart,
      rangeEnd,
      durationMinutes: data.durationMinutes,
      timeZone: place.timeZone,
      hours,
      rules,
      reservations,
      blocks,
      overrides,
      includeUnavailable: data.includeUnavailable ?? false,
    });
  }

  async getForPlaceSportRange(
    data: GetAvailabilityForPlaceSportRangeDTO,
  ): Promise<AvailabilityOption[]> {
    const place = await this.placeRepository.findById(data.placeId);
    if (!place) {
      throw new PlaceNotFoundError(data.placeId);
    }

    if (!place.isActive || place.placeType !== "RESERVABLE") {
      return [];
    }

    const verification = await this.placeVerificationRepository.findByPlaceId(
      place.id,
    );
    if (!this.isPlaceBookable(verification)) {
      return [];
    }

    const courts = await this.courtRepository.findByPlaceAndSport(
      data.placeId,
      data.sportId,
    );

    const activeCourts = courts.filter((court) => court.isActive);
    if (activeCourts.length === 0) {
      return [];
    }

    const rangeStart = new Date(data.startDate);
    const rangeEnd = new Date(data.endDate);
    const courtIds = activeCourts.map((court) => court.id);

    const [hours, rules, reservations, blocks, overrides] = await Promise.all([
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
    ]);

    const optionsByStart = new Map<number, AvailabilityOption>();
    const courtOptionsByStart = new Map<number, AvailabilityCourtOption[]>();
    const includeUnavailable = data.includeUnavailable ?? false;
    const includeCourtOptions = data.includeCourtOptions ?? false;

    for (const court of activeCourts) {
      const availability = this.buildAvailabilityForCourtRange({
        court,
        rangeStart,
        rangeEnd,
        durationMinutes: data.durationMinutes,
        timeZone: place.timeZone,
        hours,
        rules,
        reservations,
        blocks,
        overrides,
        includeUnavailable,
      });

      for (const option of availability) {
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

    return Array.from(optionsByStart.entries())
      .map(([startMs, option]) => ({
        ...option,
        courtOptions: includeCourtOptions
          ? this.sortCourtOptions(courtOptionsByStart.get(startMs) ?? [])
          : undefined,
      }))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
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

  private buildAvailabilityForCourtRange(options: {
    court: CourtRecord;
    rangeStart: Date;
    rangeEnd: Date;
    durationMinutes: number;
    timeZone: string;
    hours: CourtHoursWindowRecord[];
    rules: CourtRateRuleRecord[];
    reservations: ReservationRecord[];
    blocks: CourtBlockRecord[];
    overrides: CourtPriceOverrideRecord[];
    includeUnavailable?: boolean;
  }): AvailabilityOption[] {
    const {
      court,
      rangeStart,
      rangeEnd,
      durationMinutes,
      timeZone,
      hours,
      rules,
      reservations,
      blocks,
      overrides,
      includeUnavailable,
    } = options;

    const allowUnavailable = includeUnavailable ?? false;

    if (durationMinutes <= 0) return [];

    const hoursWindows = hours.filter((window) => window.courtId === court.id);
    const rateRules = rules.filter((rule) => rule.courtId === court.id);
    const priceOverrides = overrides.filter(
      (override) => override.courtId === court.id,
    );

    if (hoursWindows.length === 0 || rateRules.length === 0) {
      return [];
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

        const pricing = computeSchedulePrice({
          startTime,
          durationMinutes,
          timeZone,
          hoursWindows,
          rateRules,
          priceOverrides,
        });
        if (!pricing) {
          continue;
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
        });
      }

      dayCursor.setDate(dayCursor.getDate() + 1);
    }

    return results.sort((a, b) => a.startTime.localeCompare(b.startTime));
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
