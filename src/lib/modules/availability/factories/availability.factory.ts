import { makeCourtRepository } from "@/lib/modules/court/factories/court.factory";
import { makeCourtBlockRepository } from "@/lib/modules/court-block/factories/court-block.factory";
import { makeCourtHoursRepository } from "@/lib/modules/court-hours/factories/court-hours.factory";
import { makeCourtPriceOverrideRepository } from "@/lib/modules/court-price-override/factories/court-price-override.factory";
import { makeCourtRateRuleRepository } from "@/lib/modules/court-rate-rule/factories/court-rate-rule.factory";
import { makePlaceRepository } from "@/lib/modules/place/factories/place.factory";
import { makePlaceVerificationRepository } from "@/lib/modules/place-verification/factories/place-verification.factory";
import { makeReservationRepository } from "@/lib/modules/reservation/factories/reservation.factory";
import { AvailabilityService } from "../services/availability.service";

let availabilityService: AvailabilityService | null = null;

export function makeAvailabilityService(): AvailabilityService {
  if (!availabilityService) {
    availabilityService = new AvailabilityService(
      makeCourtRepository(),
      makePlaceRepository(),
      makePlaceVerificationRepository(),
      makeCourtHoursRepository(),
      makeCourtRateRuleRepository(),
      makeReservationRepository(),
      makeCourtBlockRepository(),
      makeCourtPriceOverrideRepository(),
    );
  }

  return availabilityService;
}
