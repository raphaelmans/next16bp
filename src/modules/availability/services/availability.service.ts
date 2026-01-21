import { CourtNotFoundError } from "@/modules/court/errors/court.errors";
import type { ICourtRepository } from "@/modules/court/repositories/court.repository";
import { PlaceNotFoundError } from "@/modules/place/errors/place.errors";
import type { IPlaceRepository } from "@/modules/place/repositories/place.repository";
import type { IPlaceVerificationRepository } from "@/modules/place-verification/repositories/place-verification.repository";
import type { ITimeSlotRepository } from "@/modules/time-slot/repositories/time-slot.repository";
import type {
  CourtRecord,
  PlaceVerificationRecord,
  TimeSlotRecord,
} from "@/shared/infra/db/schema";
import {
  buildSlotStartMap,
  collectConsecutiveSlots,
  summarizeSlotPricing,
} from "@/shared/lib/time-slot-availability";
import { getZonedDayRangeForInstant } from "@/shared/lib/time-zone";
import type {
  GetAvailabilityForCourtDTO,
  GetAvailabilityForPlaceSportDTO,
} from "../dtos";

export interface AvailabilityOption {
  startTime: string;
  endTime: string;
  totalPriceCents: number;
  currency: string | null;
  courtId: string;
  courtLabel: string;
}

export interface IAvailabilityService {
  getForCourt(data: GetAvailabilityForCourtDTO): Promise<AvailabilityOption[]>;
  getForPlaceSport(
    data: GetAvailabilityForPlaceSportDTO,
  ): Promise<AvailabilityOption[]>;
}

export class AvailabilityService implements IAvailabilityService {
  constructor(
    private courtRepository: ICourtRepository,
    private placeRepository: IPlaceRepository,
    private placeVerificationRepository: IPlaceVerificationRepository,
    private timeSlotRepository: ITimeSlotRepository,
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

    return this.getAvailabilityForCourt(
      court,
      data.date,
      data.durationMinutes,
      place.timeZone,
    );
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
    const optionsByStart = new Map<number, AvailabilityOption>();

    for (const court of activeCourts) {
      const availability = await this.getAvailabilityForCourt(
        court,
        data.date,
        data.durationMinutes,
        place.timeZone,
      );

      for (const option of availability) {
        const startMs = new Date(option.startTime).getTime();
        const existing = optionsByStart.get(startMs);
        if (!existing) {
          optionsByStart.set(startMs, option);
          continue;
        }

        const preferred = this.pickCheapestOption(existing, option);
        optionsByStart.set(startMs, preferred);
      }
    }

    return Array.from(optionsByStart.values()).sort((a, b) =>
      a.startTime.localeCompare(b.startTime),
    );
  }

  private isPlaceBookable(
    verification: PlaceVerificationRecord | null,
  ): boolean {
    if (!verification) return false;
    return (
      verification.status === "VERIFIED" && verification.reservationsEnabled
    );
  }

  private async getAvailabilityForCourt(
    court: CourtRecord,
    date: string,
    durationMinutes: number,
    timeZone: string,
  ): Promise<AvailabilityOption[]> {
    if (durationMinutes <= 0) {
      return [];
    }

    const { start, end } = getZonedDayRangeForInstant(date, timeZone);

    const slots = await this.timeSlotRepository.findAvailable(
      court.id,
      start,
      end,
    );

    return this.buildOptionsForCourt(court, slots, durationMinutes);
  }

  private buildOptionsForCourt(
    court: CourtRecord,
    slots: TimeSlotRecord[],
    durationMinutes: number,
  ): AvailabilityOption[] {
    if (slots.length === 0) return [];

    const sortedSlots = [...slots].sort(
      (a, b) => a.startTime.getTime() - b.startTime.getTime(),
    );
    const slotMap = buildSlotStartMap(sortedSlots);
    const options: AvailabilityOption[] = [];

    for (const slot of sortedSlots) {
      const consecutive = collectConsecutiveSlots({
        slotMap,
        startSlot: slot,
        durationMinutes,
      });

      if (!consecutive) {
        continue;
      }

      const pricing = summarizeSlotPricing(consecutive);
      const lastSlot = consecutive[consecutive.length - 1];

      options.push({
        startTime: slot.startTime.toISOString(),
        endTime: lastSlot.endTime.toISOString(),
        totalPriceCents: pricing.totalPriceCents,
        currency: pricing.currency,
        courtId: court.id,
        courtLabel: court.label,
      });
    }

    return options;
  }

  private pickCheapestOption(
    current: AvailabilityOption,
    next: AvailabilityOption,
  ): AvailabilityOption {
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
