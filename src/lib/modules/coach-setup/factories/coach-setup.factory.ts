import { getContainer } from "@/lib/shared/infra/container";
import { CoachSetupRepository } from "../repositories/coach-setup.repository";
import { GetCoachSetupStatusUseCase } from "../use-cases/get-coach-setup-status.use-case";

let coachSetupRepository: CoachSetupRepository | null = null;
let coachSetupStatusUseCase: GetCoachSetupStatusUseCase | null = null;

export function makeCoachSetupRepository(): CoachSetupRepository {
  if (!coachSetupRepository) {
    coachSetupRepository = new CoachSetupRepository(getContainer().db);
  }

  return coachSetupRepository;
}

export function makeCoachSetupStatusUseCase(): GetCoachSetupStatusUseCase {
  if (!coachSetupStatusUseCase) {
    coachSetupStatusUseCase = new GetCoachSetupStatusUseCase(
      makeCoachSetupRepository(),
    );
  }

  return coachSetupStatusUseCase;
}
