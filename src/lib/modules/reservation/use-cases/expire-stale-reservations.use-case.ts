import type { IAvailabilityChangeEventService } from "@/lib/modules/availability/services/availability-change-event.service";
import type { ICourtRepository } from "@/lib/modules/court/repositories/court.repository";
import type { IPlaceRepository } from "@/lib/modules/place/repositories/place.repository";
import type { InsertReservationEvent } from "@/lib/shared/infra/db/schema";
import type { TransactionManager } from "@/lib/shared/kernel/transaction";
import type { IReservationRepository } from "../repositories/reservation.repository";
import type { IReservationEventRepository } from "../repositories/reservation-event.repository";

const STALE_RESERVATION_STATUSES = [
  "CREATED",
  "AWAITING_PAYMENT",
  "PAYMENT_MARKED_BY_USER",
] as const;

type StaleReservationStatus = (typeof STALE_RESERVATION_STATUSES)[number];

export interface IExpireStaleReservationsUseCase {
  executeForOrganization(organizationId: string, now?: Date): Promise<number>;
}

export class ExpireStaleReservationsUseCase
  implements IExpireStaleReservationsUseCase
{
  constructor(
    private reservationRepository: IReservationRepository,
    private reservationEventRepository: IReservationEventRepository,
    private courtRepository: ICourtRepository,
    private placeRepository: IPlaceRepository,
    private availabilityChangeEventService: IAvailabilityChangeEventService,
    private transactionManager: TransactionManager,
  ) {}

  async executeForOrganization(
    organizationId: string,
    now: Date = new Date(),
  ): Promise<number> {
    return this.transactionManager.run(async (tx) => {
      const ctx = { tx };

      const stale = await this.reservationRepository.findStaleByOrganization(
        organizationId,
        now,
        [...STALE_RESERVATION_STATUSES],
        ctx,
      );

      if (stale.length === 0) {
        return 0;
      }

      const staleById = new Map(
        stale.map((r) => [r.id, r.status as StaleReservationStatus] as const),
      );
      const updatedIds = await this.reservationRepository.expireStaleByIds(
        stale.map((r) => r.id),
        now,
        [...STALE_RESERVATION_STATUSES],
        ctx,
      );

      if (updatedIds.length === 0) {
        return 0;
      }

      const events: InsertReservationEvent[] = updatedIds.map((id) => ({
        reservationId: id,
        fromStatus: staleById.get(id) ?? null,
        toStatus: "EXPIRED",
        triggeredByRole: "SYSTEM",
        triggeredByUserId: null,
        notes: "Automatically expired due to payment timeout",
      }));

      await this.reservationEventRepository.createMany(events, ctx);

      const updatedReservations =
        await this.reservationRepository.findByIdsForUpdate(updatedIds, ctx);

      for (const reservation of updatedReservations) {
        if (!reservation.courtId) continue;
        const court = await this.courtRepository.findById(
          reservation.courtId,
          ctx,
        );
        if (!court?.placeId) continue;
        const place = await this.placeRepository.findById(court.placeId, ctx);
        if (!place) continue;

        await this.availabilityChangeEventService.emitReservationReleased(
          reservation,
          { court, place },
          "reservation.expired",
          ctx,
        );
      }

      return updatedIds.length;
    });
  }
}
