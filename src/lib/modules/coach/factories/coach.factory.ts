import { makeProfileRepository } from "@/lib/modules/profile/factories/profile.factory";
import { getContainer } from "@/lib/shared/infra/container";
import { CoachRepository } from "../repositories/coach.repository";
import { CoachService } from "../services/coach.service";

let coachRepository: CoachRepository | null = null;
let coachService: CoachService | null = null;

export function makeCoachRepository(): CoachRepository {
  if (!coachRepository) {
    coachRepository = new CoachRepository(getContainer().db);
  }
  return coachRepository;
}

export function makeCoachService(): CoachService {
  if (!coachService) {
    coachService = new CoachService(
      makeCoachRepository(),
      makeProfileRepository(),
      getContainer().transactionManager,
    );
  }
  return coachService;
}
