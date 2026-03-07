import type {
  InsertAvailabilityChangeEvent,
  ReservationRecord,
} from "@/lib/shared/infra/db/schema";
import type { RequestContext } from "@/lib/shared/kernel/context";
import type { CourtRecord } from "../../../shared/infra/db/schema/court";
import type { CourtBlockRecord } from "../../../shared/infra/db/schema/court-block";
import type { PlaceRecord } from "../../../shared/infra/db/schema/place";
import type { IAvailabilityChangeEventRepository } from "../repositories/availability-change-event.repository";

export type AvailabilityEventSlotStatus = "AVAILABLE" | "BOOKED";

type AvailabilityContext = {
  court: CourtRecord;
  place: PlaceRecord;
};

export interface IAvailabilityChangeEventService {
  emitReservationBooked(
    reservation: ReservationRecord,
    context: AvailabilityContext,
    sourceEvent: string,
    ctx?: RequestContext,
  ): Promise<void>;
  emitReservationReleased(
    reservation: ReservationRecord,
    context: AvailabilityContext,
    sourceEvent: string,
    ctx?: RequestContext,
  ): Promise<void>;
  emitCourtBlockBooked(
    block: CourtBlockRecord,
    context: AvailabilityContext,
    sourceEvent: string,
    ctx?: RequestContext,
  ): Promise<void>;
  emitCourtBlockReleased(
    block: CourtBlockRecord,
    context: AvailabilityContext,
    sourceEvent: string,
    ctx?: RequestContext,
  ): Promise<void>;
  emitMany(
    events: InsertAvailabilityChangeEvent[],
    ctx?: RequestContext,
  ): Promise<void>;
}

const getBlockUnavailableReason = (block: CourtBlockRecord) =>
  block.type === "WALK_IN" ? "WALK_IN" : "MAINTENANCE";

export class AvailabilityChangeEventService
  implements IAvailabilityChangeEventService
{
  constructor(
    private availabilityChangeEventRepository: IAvailabilityChangeEventRepository,
  ) {}

  async emitReservationBooked(
    reservation: ReservationRecord,
    context: AvailabilityContext,
    sourceEvent: string,
    ctx?: RequestContext,
  ) {
    await this.emitMany(
      [
        {
          sourceKind: "RESERVATION",
          sourceEvent,
          sourceId: reservation.id,
          courtId: context.court.id,
          placeId: context.place.id,
          sportId: context.court.sportId,
          startTime: reservation.startTime,
          endTime: reservation.endTime,
          slotStatus: "BOOKED",
          unavailableReason: "RESERVATION",
          totalPriceCents: reservation.totalPriceCents,
          currency: reservation.currency,
        },
      ],
      ctx,
    );
  }

  async emitReservationReleased(
    reservation: ReservationRecord,
    context: AvailabilityContext,
    sourceEvent: string,
    ctx?: RequestContext,
  ) {
    await this.emitMany(
      [
        {
          sourceKind: "RESERVATION",
          sourceEvent,
          sourceId: reservation.id,
          courtId: context.court.id,
          placeId: context.place.id,
          sportId: context.court.sportId,
          startTime: reservation.startTime,
          endTime: reservation.endTime,
          slotStatus: "AVAILABLE",
          unavailableReason: null,
          totalPriceCents: reservation.totalPriceCents,
          currency: reservation.currency,
        },
      ],
      ctx,
    );
  }

  async emitCourtBlockBooked(
    block: CourtBlockRecord,
    context: AvailabilityContext,
    sourceEvent: string,
    ctx?: RequestContext,
  ) {
    await this.emitMany(
      [
        {
          sourceKind: "COURT_BLOCK",
          sourceEvent,
          sourceId: block.id,
          courtId: context.court.id,
          placeId: context.place.id,
          sportId: context.court.sportId,
          startTime: block.startTime,
          endTime: block.endTime,
          slotStatus: "BOOKED",
          unavailableReason: getBlockUnavailableReason(block),
          totalPriceCents: block.totalPriceCents,
          currency: block.currency,
        },
      ],
      ctx,
    );
  }

  async emitCourtBlockReleased(
    block: CourtBlockRecord,
    context: AvailabilityContext,
    sourceEvent: string,
    ctx?: RequestContext,
  ) {
    await this.emitMany(
      [
        {
          sourceKind: "COURT_BLOCK",
          sourceEvent,
          sourceId: block.id,
          courtId: context.court.id,
          placeId: context.place.id,
          sportId: context.court.sportId,
          startTime: block.startTime,
          endTime: block.endTime,
          slotStatus: "AVAILABLE",
          unavailableReason: null,
          totalPriceCents: block.totalPriceCents,
          currency: block.currency,
        },
      ],
      ctx,
    );
  }

  async emitMany(
    events: InsertAvailabilityChangeEvent[],
    ctx?: RequestContext,
  ): Promise<void> {
    await this.availabilityChangeEventRepository.createMany(events, ctx);
  }
}
