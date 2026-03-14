import type { IProfileRepository } from "@/lib/modules/profile/repositories/profile.repository";
import type { IReservationRepository } from "@/lib/modules/reservation/repositories/reservation.repository";
import { logger } from "@/lib/shared/infra/logger";
import type { RequestContext } from "@/lib/shared/kernel/context";
import type { TransactionManager } from "@/lib/shared/kernel/transaction";
import type {
  ListCoachReviewsDTO,
  UpsertCoachReviewDTO,
} from "../dtos/coach-review.dto";
import {
  CoachReviewAlreadyRemovedError,
  CoachReviewNotAuthorError,
  CoachReviewNotEligibleError,
  CoachReviewNotFoundError,
} from "../errors/coach-review.errors";
import type {
  CoachReviewAggregate,
  ICoachReviewRepository,
} from "../repositories/coach-review.repository";

export type CoachReviewEligibility = {
  canReview: boolean;
  reason: "NO_PROFILE" | "NO_COMPLETED_SESSION" | null;
};

export class CoachReviewService {
  constructor(
    private reviewRepository: ICoachReviewRepository,
    private profileRepository: IProfileRepository,
    private reservationRepository: IReservationRepository,
    private transactionManager: TransactionManager,
  ) {}

  async upsertReview(userId: string, data: UpsertCoachReviewDTO) {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };
      const existing = await this.reviewRepository.findActiveByCoachAndUser(
        data.coachId,
        userId,
        ctx,
      );

      if (!existing) {
        const eligibility = await this.getViewerEligibility(
          userId,
          data.coachId,
        );
        if (!eligibility.canReview) {
          throw new CoachReviewNotEligibleError(data.coachId);
        }
      }

      const review = await this.reviewRepository.upsertActive(
        {
          coachId: data.coachId,
          authorUserId: userId,
          rating: data.rating,
          body: data.body,
        },
        ctx,
      );

      logger.info(
        {
          event: "coach_review.upserted",
          reviewId: review.id,
          coachId: data.coachId,
          userId,
          rating: data.rating,
        },
        "Coach review upserted",
      );

      return review;
    });
  }

  async removeOwnReview(userId: string, reviewId: string) {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };
      const review = await this.reviewRepository.findById(reviewId, ctx);
      if (!review) {
        throw new CoachReviewNotFoundError(reviewId);
      }
      if (review.authorUserId !== userId) {
        throw new CoachReviewNotAuthorError();
      }
      if (review.removedAt) {
        throw new CoachReviewAlreadyRemovedError(reviewId);
      }

      await this.reviewRepository.softRemove(reviewId, userId, undefined, ctx);

      logger.info(
        {
          event: "coach_review.removed_by_author",
          reviewId,
          coachId: review.coachId,
          userId,
        },
        "Coach review removed by author",
      );

      return review;
    });
  }

  async getAggregate(coachId: string): Promise<CoachReviewAggregate> {
    return this.reviewRepository.getAggregate(coachId);
  }

  async listActiveReviews(data: ListCoachReviewsDTO) {
    return this.reviewRepository.listActiveByCoach(
      data.coachId,
      data.limit,
      data.offset,
    );
  }

  async getViewerReview(userId: string, coachId: string) {
    return this.reviewRepository.findActiveByCoachAndUser(coachId, userId);
  }

  async getViewerEligibility(
    userId: string,
    coachId: string,
  ): Promise<CoachReviewEligibility> {
    const existing = await this.reviewRepository.findActiveByCoachAndUser(
      coachId,
      userId,
    );

    if (existing) {
      return {
        canReview: true,
        reason: null,
      };
    }

    const profile = await this.profileRepository.findByUserId(userId);
    if (!profile) {
      return {
        canReview: false,
        reason: "NO_PROFILE",
      };
    }

    const eligibleReservation =
      await this.reservationRepository.findPastConfirmedCoachReservationForPlayer(
        coachId,
        profile.id,
      );

    return eligibleReservation
      ? {
          canReview: true,
          reason: null,
        }
      : {
          canReview: false,
          reason: "NO_COMPLETED_SESSION",
        };
  }
}
