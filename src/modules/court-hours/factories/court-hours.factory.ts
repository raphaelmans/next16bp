import { makeCourtRepository } from "@/modules/court/factories/court.factory";
import { makeOrganizationRepository } from "@/modules/organization/factories/organization.factory";
import { makePlaceRepository } from "@/modules/place/factories/place.factory";
import { getContainer } from "@/shared/infra/container";
import { CourtHoursRepository } from "../repositories/court-hours.repository";
import { CourtHoursService } from "../services/court-hours.service";

let courtHoursRepository: CourtHoursRepository | null = null;
let courtHoursService: CourtHoursService | null = null;

export function makeCourtHoursRepository(): CourtHoursRepository {
  if (!courtHoursRepository) {
    courtHoursRepository = new CourtHoursRepository(getContainer().db);
  }
  return courtHoursRepository;
}

export function makeCourtHoursService(): CourtHoursService {
  if (!courtHoursService) {
    courtHoursService = new CourtHoursService(
      makeCourtHoursRepository(),
      makeCourtRepository(),
      makePlaceRepository(),
      makeOrganizationRepository(),
      getContainer().transactionManager,
    );
  }
  return courtHoursService;
}
