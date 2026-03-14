import { makeCoachRepository } from "@/lib/modules/coach/factories/coach.factory";
import { getContainer } from "@/lib/shared/infra/container";
import { CoachAddonRepository } from "../repositories/coach-addon.repository";
import { CoachAddonService } from "../services/coach-addon.service";

let coachAddonRepository: CoachAddonRepository | null = null;
let coachAddonService: CoachAddonService | null = null;

export function makeCoachAddonRepository(): CoachAddonRepository {
  if (!coachAddonRepository) {
    coachAddonRepository = new CoachAddonRepository(getContainer().db);
  }
  return coachAddonRepository;
}

export function makeCoachAddonService(): CoachAddonService {
  if (!coachAddonService) {
    coachAddonService = new CoachAddonService(
      makeCoachAddonRepository(),
      makeCoachRepository(),
      getContainer().transactionManager,
    );
  }
  return coachAddonService;
}
