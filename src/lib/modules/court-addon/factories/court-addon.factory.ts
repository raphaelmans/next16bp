import { makeCourtRepository } from "@/lib/modules/court/factories/court.factory";
import { makeCourtRateRuleRepository } from "@/lib/modules/court-rate-rule/factories/court-rate-rule.factory";
import { makeOrganizationRepository } from "@/lib/modules/organization/factories/organization.factory";
import { makePlaceRepository } from "@/lib/modules/place/factories/place.factory";
import { getContainer } from "@/lib/shared/infra/container";
import { CourtAddonRepository } from "../repositories/court-addon.repository";
import { CourtAddonService } from "../services/court-addon.service";

let courtAddonRepository: CourtAddonRepository | null = null;
let courtAddonService: CourtAddonService | null = null;

export function makeCourtAddonRepository(): CourtAddonRepository {
  if (!courtAddonRepository) {
    courtAddonRepository = new CourtAddonRepository(getContainer().db);
  }
  return courtAddonRepository;
}

export function makeCourtAddonService(): CourtAddonService {
  if (!courtAddonService) {
    courtAddonService = new CourtAddonService(
      makeCourtAddonRepository(),
      makeCourtRateRuleRepository(),
      makeCourtRepository(),
      makePlaceRepository(),
      makeOrganizationRepository(),
      getContainer().transactionManager,
    );
  }
  return courtAddonService;
}
