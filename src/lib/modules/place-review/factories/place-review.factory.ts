import { getContainer } from "@/lib/shared/infra/container";
import { PlaceReviewRepositoryImpl } from "../repositories/place-review.repository";
import { PlaceReviewService } from "../services/place-review.service";

let placeReviewRepository: PlaceReviewRepositoryImpl | null = null;
let placeReviewService: PlaceReviewService | null = null;

export function makePlaceReviewRepository(): PlaceReviewRepositoryImpl {
  if (!placeReviewRepository) {
    placeReviewRepository = new PlaceReviewRepositoryImpl(getContainer().db);
  }
  return placeReviewRepository;
}

export function makePlaceReviewService(): PlaceReviewService {
  if (!placeReviewService) {
    placeReviewService = new PlaceReviewService(
      makePlaceReviewRepository(),
      getContainer().transactionManager,
    );
  }
  return placeReviewService;
}
