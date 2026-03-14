import { makeCoachRepository } from "@/lib/modules/coach/factories/coach.factory";
import { getContainer } from "@/lib/shared/infra/container";
import { CoachBlockRepository } from "../repositories/coach-block.repository";
import { CoachBlockService } from "../services/coach-block.service";

let coachBlockRepository: CoachBlockRepository | null = null;
let coachBlockService: CoachBlockService | null = null;

export function makeCoachBlockRepository(): CoachBlockRepository {
  if (!coachBlockRepository) {
    coachBlockRepository = new CoachBlockRepository(getContainer().db);
  }
  return coachBlockRepository;
}

export function makeCoachBlockService(): CoachBlockService {
  if (!coachBlockService) {
    coachBlockService = new CoachBlockService(
      makeCoachBlockRepository(),
      makeCoachRepository(),
      getContainer().transactionManager,
    );
  }
  return coachBlockService;
}
