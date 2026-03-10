import { makeAvailabilityService } from "@/lib/modules/availability/factories/availability.factory";
import { makeCourtRepository } from "@/lib/modules/court/factories/court.factory";
import { makeCourtBlockService } from "@/lib/modules/court-block/factories/court-block.factory";
import { makeOrganizationMemberService } from "@/lib/modules/organization-member/factories/organization-member.factory";
import { makePlaceRepository } from "@/lib/modules/place/factories/place.factory";
import { getContainer } from "@/lib/shared/infra/container";
import { DeveloperIntegrationRepository } from "../repositories/developer-integration.repository";
import { DeveloperIntegrationService } from "../services/developer-integration.service";

let developerIntegrationRepository: DeveloperIntegrationRepository | null =
  null;
let developerIntegrationService: DeveloperIntegrationService | null = null;

export function makeDeveloperIntegrationRepository() {
  if (!developerIntegrationRepository) {
    developerIntegrationRepository = new DeveloperIntegrationRepository(
      getContainer().db,
    );
  }

  return developerIntegrationRepository;
}

export function makeDeveloperIntegrationService() {
  if (!developerIntegrationService) {
    developerIntegrationService = new DeveloperIntegrationService(
      makeDeveloperIntegrationRepository(),
      makeOrganizationMemberService(),
      makeCourtRepository(),
      makePlaceRepository(),
      makeAvailabilityService(),
      makeCourtBlockService(),
      getContainer().transactionManager,
    );
  }

  return developerIntegrationService;
}
