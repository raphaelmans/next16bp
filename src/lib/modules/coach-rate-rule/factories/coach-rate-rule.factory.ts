import { makeCoachRepository } from "@/lib/modules/coach/factories/coach.factory";
import { getContainer } from "@/lib/shared/infra/container";
import { CoachRateRuleRepository } from "../repositories/coach-rate-rule.repository";
import { CoachRateRuleService } from "../services/coach-rate-rule.service";

let coachRateRuleRepository: CoachRateRuleRepository | null = null;
let coachRateRuleService: CoachRateRuleService | null = null;

export function makeCoachRateRuleRepository(): CoachRateRuleRepository {
  if (!coachRateRuleRepository) {
    coachRateRuleRepository = new CoachRateRuleRepository(getContainer().db);
  }
  return coachRateRuleRepository;
}

export function makeCoachRateRuleService(): CoachRateRuleService {
  if (!coachRateRuleService) {
    coachRateRuleService = new CoachRateRuleService(
      makeCoachRateRuleRepository(),
      makeCoachRepository(),
      getContainer().transactionManager,
    );
  }
  return coachRateRuleService;
}
