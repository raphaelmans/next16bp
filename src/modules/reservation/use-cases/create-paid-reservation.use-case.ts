import {
  IncompleteProfileError,
  ProfileNotFoundError,
} from "@/modules/profile/errors/profile.errors";
import type { IProfileRepository } from "@/modules/profile/repositories/profile.repository";
import { SlotNotFoundError } from "@/modules/time-slot/errors/time-slot.errors";
import type { ITimeSlotRepository } from "@/modules/time-slot/repositories/time-slot.repository";
import type { ReservationRecord } from "@/shared/infra/db/schema";
import { logger } from "@/shared/infra/logger";
import type { RequestContext } from "@/shared/kernel/context";
import type { TransactionManager } from "@/shared/kernel/transaction";
import { SlotNotAvailableError } from "../errors/reservation.errors";
import type { IReservationRepository } from "../repositories/reservation.repository";
import type { IReservationEventRepository } from "../repositories/reservation-event.repository";

// TTL for paid reservations: 15 minutes
const RESERVATION_TTL_MINUTES = 15;

export interface ICreatePaidReservationUseCase {
  execute(
    userId: string,
    profileId: string,
    timeSlotId: string,
  ): Promise<ReservationRecord>;
}

export class CreatePaidReservationUseCase
  implements ICreatePaidReservationUseCase
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

      // Validate profile completeness
      if (!profile.displayName || (!profile.email && !profile.phoneNumber)) {
        throw new IncompleteProfileError();
      }

      // Calculate expiration time
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + RESERVATION_TTL_MINUTES);

      // Create reservation with AWAITING_PAYMENT status
      const reservation = await this.reservationRepository.create(
        {
          timeSlotId,
          playerId: profileId,
          playerNameSnapshot: profile.displayName,
          playerEmailSnapshot: profile.email,
          playerPhoneSnapshot: profile.phoneNumber,
          status: "AWAITING_PAYMENT",
          expiresAt,
        },
        ctx,
      );

      // Update slot status to HELD
      await this.timeSlotRepository.update(timeSlotId, { status: "HELD" }, ctx);

      // Create audit event
      await this.reservationEventRepository.create(
        {
          reservationId: reservation.id,
          fromStatus: null,
          toStatus: "AWAITING_PAYMENT",
          triggeredByUserId: userId,
          triggeredByRole: "PLAYER",
          notes: `Paid reservation - expires at ${expiresAt.toISOString()}`,
        },
        ctx,
      );

      logger.info(
        {
          event: "reservation.created",
          reservationId: reservation.id,
          timeSlotId,
          playerId: profileId,
          status: "AWAITING_PAYMENT",
          expiresAt: expiresAt.toISOString(),
          type: "paid",
        },
        "Paid reservation created",
      );

      return reservation;
    });
  }
}
