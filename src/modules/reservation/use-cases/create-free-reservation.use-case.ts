import type { TransactionManager } from "@/shared/kernel/transaction";
import type { RequestContext } from "@/shared/kernel/context";
import type { IReservationRepository } from "../repositories/reservation.repository";
import type { IReservationEventRepository } from "../repositories/reservation-event.repository";
import type { ITimeSlotRepository } from "@/modules/time-slot/repositories/time-slot.repository";
import type { IProfileRepository } from "@/modules/profile/repositories/profile.repository";
import type { ReservationRecord } from "@/shared/infra/db/schema";
import { SlotNotAvailableError } from "../errors/reservation.errors";
import { SlotNotFoundError } from "@/modules/time-slot/errors/time-slot.errors";
import { ProfileNotFoundError } from "@/modules/profile/errors/profile.errors";
import { logger } from "@/shared/infra/logger";

export interface ICreateFreeReservationUseCase {
  execute(
    userId: string,
    profileId: string,
    timeSlotId: string,
  ): Promise<ReservationRecord>;
}

export class CreateFreeReservationUseCase
  implements ICreateFreeReservationUseCase
{
  constructor(
    private reservationRepository: IReservationRepository,
    private reservationEventRepository: IReservationEventRepository,
    private timeSlotRepository: ITimeSlotRepository,
    private profileRepository: IProfileRepository,
    private transactionManager: TransactionManager,
  ) {}

  async execute(
    userId: string,
    profileId: string,
    timeSlotId: string,
  ): Promise<ReservationRecord> {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };

      // Lock the time slot for update
      const slot = await this.timeSlotRepository.findByIdForUpdate(
        timeSlotId,
        ctx,
      );
      if (!slot) {
        throw new SlotNotFoundError(timeSlotId);
      }

      // Verify slot is available
      if (slot.status !== "AVAILABLE") {
        throw new SlotNotAvailableError(timeSlotId, slot.status);
      }

      // Get player profile for snapshot
      const profile = await this.profileRepository.findById(profileId, ctx);
      if (!profile) {
        throw new ProfileNotFoundError(profileId);
      }

      // Create reservation with immediate CONFIRMED status
      const reservation = await this.reservationRepository.create(
        {
          timeSlotId,
          playerId: profileId,
          playerNameSnapshot: profile.displayName,
          playerEmailSnapshot: profile.email,
          playerPhoneSnapshot: profile.phoneNumber,
          status: "CONFIRMED",
          confirmedAt: new Date(),
        },
        ctx,
      );

      // Update slot status to BOOKED
      await this.timeSlotRepository.update(
        timeSlotId,
        { status: "BOOKED" },
        ctx,
      );

      // Create audit event
      await this.reservationEventRepository.create(
        {
          reservationId: reservation.id,
          fromStatus: null,
          toStatus: "CONFIRMED",
          triggeredByUserId: userId,
          triggeredByRole: "PLAYER",
          notes: "Free reservation - immediately confirmed",
        },
        ctx,
      );

      logger.info(
        {
          event: "reservation.created",
          reservationId: reservation.id,
          timeSlotId,
          playerId: profileId,
          status: "CONFIRMED",
          type: "free",
        },
        "Free reservation created and confirmed",
      );

      return reservation;
    });
  }
}
