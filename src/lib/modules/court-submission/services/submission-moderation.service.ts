import type { PlaceRepository } from "@/lib/modules/place/repositories/place.repository";
import { logger } from "@/lib/shared/infra/logger";
import type { RequestContext } from "@/lib/shared/kernel/context";
import type { TransactionManager } from "@/lib/shared/kernel/transaction";
import {
  CourtSubmissionNotFoundError,
  SubmissionNotPendingError,
} from "../errors/court-submission.errors";
import type { CourtSubmissionRepository } from "../repositories/court-submission.repository";
import type { CourtSubmissionBanRepository } from "../repositories/court-submission-ban.repository";

export class SubmissionModerationService {
  constructor(
    private submissionRepo: CourtSubmissionRepository,
    private banRepo: CourtSubmissionBanRepository,
    private placeRepo: PlaceRepository,
    private transactionManager: TransactionManager,
  ) {}

  async listSubmissions(options: {
    status?: "PENDING" | "APPROVED" | "REJECTED";
    limit: number;
    offset: number;
  }) {
    return this.submissionRepo.listAll(options);
  }

  async approveSubmission(adminUserId: string, submissionId: string) {
    const submission = await this.submissionRepo.findById(submissionId);
    if (!submission) {
      throw new CourtSubmissionNotFoundError(submissionId);
    }
    if (submission.status !== "PENDING") {
      throw new SubmissionNotPendingError(submissionId);
    }

    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };

      // Set place as active
      await this.placeRepo.update(submission.placeId, { isActive: true }, ctx);

      // Update submission status
      const updated = await this.submissionRepo.updateStatus(
        submissionId,
        {
          status: "APPROVED",
          reviewedByUserId: adminUserId,
        },
        ctx,
      );

      logger.info(
        {
          event: "court_submission.approved",
          submissionId,
          placeId: submission.placeId,
          adminUserId,
        },
        "Court submission approved",
      );

      return updated;
    });
  }

  async rejectSubmission(
    adminUserId: string,
    submissionId: string,
    reason: string,
  ) {
    const submission = await this.submissionRepo.findById(submissionId);
    if (!submission) {
      throw new CourtSubmissionNotFoundError(submissionId);
    }
    if (submission.status !== "PENDING") {
      throw new SubmissionNotPendingError(submissionId);
    }

    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };

      // Ensure place stays inactive
      await this.placeRepo.update(submission.placeId, { isActive: false }, ctx);

      const updated = await this.submissionRepo.updateStatus(
        submissionId,
        {
          status: "REJECTED",
          rejectionReason: reason,
          reviewedByUserId: adminUserId,
        },
        ctx,
      );

      logger.info(
        {
          event: "court_submission.rejected",
          submissionId,
          placeId: submission.placeId,
          adminUserId,
          reason,
        },
        "Court submission rejected",
      );

      return updated;
    });
  }

  async banUser(adminUserId: string, userId: string, reason: string) {
    const existing = await this.banRepo.findByUserId(userId);
    if (existing) {
      return existing;
    }

    const ban = await this.banRepo.create({
      userId,
      bannedByUserId: adminUserId,
      reason,
    });

    logger.info(
      {
        event: "court_submission_ban.created",
        userId,
        adminUserId,
        reason,
      },
      "User banned from court submissions",
    );

    return ban;
  }

  async unbanUser(adminUserId: string, userId: string) {
    await this.banRepo.deleteByUserId(userId);

    logger.info(
      {
        event: "court_submission_ban.removed",
        userId,
        adminUserId,
      },
      "User unbanned from court submissions",
    );
  }
}
