import { makeCoachRepository } from "@/lib/modules/coach/factories/coach.factory";
import { getContainer } from "@/lib/shared/infra/container";
import { CoachSetupRepository } from "../repositories/coach-setup.repository";
import { GetCoachSetupStatusUseCase } from "../use-cases/get-coach-setup-status.use-case";
import { SubmitCoachVerificationUseCase } from "../use-cases/submit-coach-verification.use-case";

let coachSetupRepository: CoachSetupRepository | null = null;
let coachSetupStatusUseCase: GetCoachSetupStatusUseCase | null = null;
let submitCoachVerificationUseCase: SubmitCoachVerificationUseCase | null =
  null;

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

export function makeSubmitCoachVerificationUseCase(): SubmitCoachVerificationUseCase {
  if (!submitCoachVerificationUseCase) {
    submitCoachVerificationUseCase = new SubmitCoachVerificationUseCase(
      makeCoachRepository(),
      makeCoachSetupRepository(),
      getContainer().transactionManager,
    );
  }

  return submitCoachVerificationUseCase;
}
