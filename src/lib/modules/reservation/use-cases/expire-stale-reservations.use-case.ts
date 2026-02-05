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

      return updatedIds.length;
    });
  }
}
