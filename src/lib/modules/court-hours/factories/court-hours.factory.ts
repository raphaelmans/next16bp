import { makeCourtRepository } from "@/lib/modules/court/factories/court.factory";
import { makeOrganizationRepository } from "@/lib/modules/organization/factories/organization.factory";
import { makePlaceRepository } from "@/lib/modules/place/factories/place.factory";
import { getContainer } from "@/lib/shared/infra/container";
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
