import { makeCourtRepository } from "@/modules/court/factories/court.factory";
import { makePlaceRepository } from "@/modules/place/factories/place.factory";
import { makePlaceVerificationRepository } from "@/modules/place-verification/factories/place-verification.factory";
import { makeTimeSlotRepository } from "@/modules/time-slot/factories/time-slot.factory";
import { AvailabilityService } from "../services/availability.service";

let availabilityService: AvailabilityService | null = null;

export function makeAvailabilityService(): AvailabilityService {
  if (!availabilityService) {
    availabilityService = new AvailabilityService(
      makeCourtRepository(),
      makePlaceRepository(),
      makePlaceVerificationRepository(),
      makeTimeSlotRepository(),
    );
  }

  return availabilityService;
}
