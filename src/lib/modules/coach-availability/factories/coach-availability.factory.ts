import { makeCoachRepository } from "@/lib/modules/coach/factories/coach.factory";
import { makeCoachAddonRepository } from "@/lib/modules/coach-addon/factories/coach-addon.factory";
import { makeCoachBlockRepository } from "@/lib/modules/coach-block/factories/coach-block.factory";
import { makeCoachHoursRepository } from "@/lib/modules/coach-hours/factories/coach-hours.factory";
import { makeCoachRateRuleRepository } from "@/lib/modules/coach-rate-rule/factories/coach-rate-rule.factory";
import { makeReservationRepository } from "@/lib/modules/reservation/factories/reservation.factory";
import { CoachAvailabilityService } from "../services/coach-availability.service";

let coachAvailabilityService: CoachAvailabilityService | null = null;

export function makeCoachAvailabilityService(): CoachAvailabilityService {
  if (!coachAvailabilityService) {
    coachAvailabilityService = new CoachAvailabilityService(
      makeCoachRepository(),
      makeCoachHoursRepository(),
      makeCoachRateRuleRepository(),
      makeCoachAddonRepository(),
      makeReservationRepository(),
      makeCoachBlockRepository(),
    );
  }

  return coachAvailabilityService;
}
