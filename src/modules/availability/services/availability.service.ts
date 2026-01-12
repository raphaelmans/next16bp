import { endOfDay, startOfDay } from "date-fns";
import { CourtNotFoundError } from "@/modules/court/errors/court.errors";
import type { ICourtRepository } from "@/modules/court/repositories/court.repository";
import { PlaceNotFoundError } from "@/modules/place/errors/place.errors";
import type { IPlaceRepository } from "@/modules/place/repositories/place.repository";
import type { ITimeSlotRepository } from "@/modules/time-slot/repositories/time-slot.repository";
import type { CourtRecord, TimeSlotRecord } from "@/shared/infra/db/schema";
import {
  buildSlotStartMap,
  collectConsecutiveSlots,
  summarizeSlotPricing,
} from "@/shared/lib/time-slot-availability";
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
    private timeSlotRepository: ITimeSlotRepository,
  ) {}

  async getForCourt(
    data: GetAvailabilityForCourtDTO,
  ): Promise<AvailabilityOption[]> {
    const court = await this.courtRepository.findById(data.courtId);
    if (!court) {
      throw new CourtNotFoundError(data.courtId);
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

    return this.getAvailabilityForCourt(court, data.date, data.durationMinutes);
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

  private async getAvailabilityForCourt(
    court: CourtRecord,
    date: string,
    durationMinutes: number,
  ): Promise<AvailabilityOption[]> {
    if (durationMinutes <= 0) {
      return [];
    }

    const parsedDate = new Date(date);
    const start = startOfDay(parsedDate);
    const end = endOfDay(parsedDate);

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
