import { makeProfileRepository } from "@/lib/modules/profile/factories/profile.factory";
import { makeReservationRepository } from "@/lib/modules/reservation/factories/reservation.factory";
import { getContainer } from "@/lib/shared/infra/container";
import { CoachReviewRepository } from "../repositories/coach-review.repository";
import { CoachReviewService } from "../services/coach-review.service";

let coachReviewRepository: CoachReviewRepository | null = null;
let coachReviewService: CoachReviewService | null = null;

export function makeCoachReviewRepository(): CoachReviewRepository {
  if (!coachReviewRepository) {
    coachReviewRepository = new CoachReviewRepository(getContainer().db);
  }

  return coachReviewRepository;
}

export function makeCoachReviewService(): CoachReviewService {
  if (!coachReviewService) {
    coachReviewService = new CoachReviewService(
      makeCoachReviewRepository(),
      makeProfileRepository(),
      makeReservationRepository(),
      getContainer().transactionManager,
    );
  }

  return coachReviewService;
}
