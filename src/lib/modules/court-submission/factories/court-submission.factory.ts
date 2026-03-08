import { makeCourtRepository } from "@/lib/modules/court/factories/court.factory";
import { makeGoogleLocService } from "@/lib/modules/google-loc/factories/google-loc.factory";
import { makePlaceRepository } from "@/lib/modules/place/factories/place.factory";
import { getContainer } from "@/lib/shared/infra/container";
import { CourtSubmissionBanRepository } from "../repositories/court-submission-ban.repository";
import { CourtSubmissionRepository } from "../repositories/court-submission.repository";
import { CourtSubmissionService } from "../services/court-submission.service";
import { SubmissionModerationService } from "../services/submission-moderation.service";

let submissionRepo: CourtSubmissionRepository | null = null;
let banRepo: CourtSubmissionBanRepository | null = null;
let submissionService: CourtSubmissionService | null = null;
let moderationService: SubmissionModerationService | null = null;

export function makeCourtSubmissionRepository(): CourtSubmissionRepository {
  if (!submissionRepo) {
    submissionRepo = new CourtSubmissionRepository(getContainer().db);
  }
  return submissionRepo;
}

export function makeCourtSubmissionBanRepository(): CourtSubmissionBanRepository {
  if (!banRepo) {
    banRepo = new CourtSubmissionBanRepository(getContainer().db);
  }
  return banRepo;
}

export function makeCourtSubmissionService(): CourtSubmissionService {
  if (!submissionService) {
    submissionService = new CourtSubmissionService(
      makeCourtSubmissionRepository(),
      makeCourtSubmissionBanRepository(),
      makePlaceRepository(),
      makeCourtRepository(),
      makeGoogleLocService(),
      getContainer().transactionManager,
    );
  }
  return submissionService;
}

export function makeSubmissionModerationService(): SubmissionModerationService {
  if (!moderationService) {
    moderationService = new SubmissionModerationService(
      makeCourtSubmissionRepository(),
      makeCourtSubmissionBanRepository(),
      makePlaceRepository(),
      getContainer().transactionManager,
    );
  }
  return moderationService;
}
