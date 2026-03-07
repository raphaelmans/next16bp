import { getContainer } from "@/lib/shared/infra/container";
import { AvailabilityChangeEventRepository } from "../repositories/availability-change-event.repository";
import { AvailabilityChangeEventService } from "../services/availability-change-event.service";

let availabilityChangeEventRepository: AvailabilityChangeEventRepository | null =
  null;
let availabilityChangeEventService: AvailabilityChangeEventService | null =
  null;

export function makeAvailabilityChangeEventRepository() {
  if (!availabilityChangeEventRepository) {
    availabilityChangeEventRepository = new AvailabilityChangeEventRepository(
      getContainer().db,
    );
  }

  return availabilityChangeEventRepository;
}

export function makeAvailabilityChangeEventService() {
  if (!availabilityChangeEventService) {
    availabilityChangeEventService = new AvailabilityChangeEventService(
      makeAvailabilityChangeEventRepository(),
    );
  }

  return availabilityChangeEventService;
}
