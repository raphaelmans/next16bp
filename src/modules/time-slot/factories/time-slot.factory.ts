import { makeCourtRepository } from "@/modules/court/factories/court.factory";
import { makeCourtRateRuleRepository } from "@/modules/court-rate-rule/factories/court-rate-rule.factory";
import { makeOrganizationRepository } from "@/modules/organization/factories/organization.factory";
import { makePlaceRepository } from "@/modules/place/factories/place.factory";
import { getContainer } from "@/shared/infra/container";
import { TimeSlotRepository } from "../repositories/time-slot.repository";
import { TimeSlotService } from "../services/time-slot.service";

let timeSlotRepository: TimeSlotRepository | null = null;
let timeSlotService: TimeSlotService | null = null;

export function makeTimeSlotRepository(): TimeSlotRepository {
  if (!timeSlotRepository) {
    timeSlotRepository = new TimeSlotRepository(getContainer().db);
  }
  return timeSlotRepository;
}

export function makeTimeSlotService(): TimeSlotService {
  if (!timeSlotService) {
    timeSlotService = new TimeSlotService(
      makeTimeSlotRepository(),
      makeCourtRepository(),
      makeCourtRateRuleRepository(),
      makePlaceRepository(),
      makeOrganizationRepository(),
      getContainer().transactionManager,
    );
  }
  return timeSlotService;
}
