import { makeCourtRepository } from "@/lib/modules/court/factories/court.factory";
import { makeOrganizationMemberService } from "@/lib/modules/organization-member/factories/organization-member.factory";
import { makePlaceRepository } from "@/lib/modules/place/factories/place.factory";
import { getContainer } from "@/lib/shared/infra/container";
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
      makeOrganizationMemberService(),
      getContainer().transactionManager,
    );
  }
  return courtRateRuleService;
}
