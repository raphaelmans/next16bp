import { makeCourtRepository } from "@/modules/court/factories/court.factory";
import { makeOrganizationRepository } from "@/modules/organization/factories/organization.factory";
import { makePlaceRepository } from "@/modules/place/factories/place.factory";
import { getContainer } from "@/shared/infra/container";
import { CourtRateRuleRepository } from "../repositories/court-rate-rule.repository";
import { CourtRateRuleService } from "../services/court-rate-rule.service";

let courtRateRuleRepository: CourtRateRuleRepository | null = null;
let courtRateRuleService: CourtRateRuleService | null = null;

export function makeCourtRateRuleRepository(): CourtRateRuleRepository {
  if (!courtRateRuleRepository) {
    courtRateRuleRepository = new CourtRateRuleRepository(getContainer().db);
  }
  return courtRateRuleRepository;
}

export function makeCourtRateRuleService(): CourtRateRuleService {
  if (!courtRateRuleService) {
    courtRateRuleService = new CourtRateRuleService(
      makeCourtRateRuleRepository(),
      makeCourtRepository(),
      makePlaceRepository(),
      makeOrganizationRepository(),
      getContainer().transactionManager,
    );
  }
  return courtRateRuleService;
}
