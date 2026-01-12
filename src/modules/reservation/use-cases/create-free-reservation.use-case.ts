import {
  IncompleteProfileError,
  ProfileNotFoundError,
} from "@/modules/profile/errors/profile.errors";
import type { IProfileRepository } from "@/modules/profile/repositories/profile.repository";
import { SlotNotFoundError } from "@/modules/time-slot/errors/time-slot.errors";
import type { ITimeSlotRepository } from "@/modules/time-slot/repositories/time-slot.repository";
import type {
  ReservationRecord,
  TimeSlotRecord,
} from "@/shared/infra/db/schema";
import { logger } from "@/shared/infra/logger";
import type { RequestContext } from "@/shared/kernel/context";
import type { TransactionManager } from "@/shared/kernel/transaction";
import { SlotNotAvailableError } from "../errors/reservation.errors";
import type { IReservationRepository } from "../repositories/reservation.repository";
import type { IReservationEventRepository } from "../repositories/reservation-event.repository";

export interface ICreateFreeReservationUseCase {
  execute(
    userId: string,
    profileId: string,
    timeSlotIds: string[],
    expiresAt: Date,
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
    timeSlotIds: string[],
    expiresAt: Date,
  ): Promise<ReservationRecord> {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };

      if (timeSlotIds.length === 0) {
        throw new SlotNotFoundError("unknown");
      }

      const slots = await this.timeSlotRepository.findByIdsForUpdate(
        timeSlotIds,
        ctx,
      );
      const slotMap = new Map(slots.map((slot) => [slot.id, slot]));
      const orderedSlots = timeSlotIds
        .map((slotId) => slotMap.get(slotId))
        .filter((slot): slot is TimeSlotRecord => !!slot);

      if (orderedSlots.length !== timeSlotIds.length) {
        const missingId = timeSlotIds.find((slotId) => !slotMap.has(slotId));
        throw new SlotNotFoundError(missingId ?? "unknown");
      }

      for (const slot of orderedSlots) {
        if (slot.status !== "AVAILABLE") {
          throw new SlotNotAvailableError(slot.id, slot.status);
        }
      }

      const profile = await this.profileRepository.findById(profileId, ctx);
      if (!profile) {
        throw new ProfileNotFoundError(profileId);
      }

      if (!profile.displayName || (!profile.email && !profile.phoneNumber)) {
        throw new IncompleteProfileError();
      }

      const reservation = await this.reservationRepository.create(
        {
          timeSlotId: orderedSlots[0].id,
          playerId: profileId,
          playerNameSnapshot: profile.displayName,
          playerEmailSnapshot: profile.email,
          playerPhoneSnapshot: profile.phoneNumber,
          status: "CREATED",
          expiresAt,
        },
        ctx,
      );

      await this.reservationRepository.createTimeSlotLinks(
        reservation.id,
        orderedSlots.map((slot) => slot.id),
        ctx,
      );

      await this.timeSlotRepository.updateManyStatus(
        orderedSlots.map((slot) => slot.id),
        "HELD",
        ctx,
      );

      await this.reservationEventRepository.create(
        {
          reservationId: reservation.id,
          fromStatus: null,
          toStatus: "CREATED",
          triggeredByUserId: userId,
          triggeredByRole: "PLAYER",
          notes: "Reservation created - awaiting owner acceptance",
        },
        ctx,
      );

      logger.info(
        {
          event: "reservation.created",
          reservationId: reservation.id,
          timeSlotIds: orderedSlots.map((slot) => slot.id),
          playerId: profileId,
          status: "CREATED",
          type: "free",
        },
        "Reservation created and awaiting owner acceptance",
      );

      return reservation;
    });
  }
}
