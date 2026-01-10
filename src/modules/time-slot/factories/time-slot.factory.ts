import { makeCourtRepository } from "@/modules/court/factories/court.factory";
import { makeOrganizationRepository } from "@/modules/organization/factories/organization.factory";
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
      makeOrganizationRepository(),
      getContainer().transactionManager,
    );
  }
  return timeSlotService;
}
