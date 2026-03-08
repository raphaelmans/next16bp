import { logger } from "@/lib/shared/infra/logger";
import type { RequestContext } from "@/lib/shared/kernel/context";
import type { TransactionManager } from "@/lib/shared/kernel/transaction";
import type {
  AdminListPlaceReviewsDTO,
  ListPlaceReviewsDTO,
  UpsertPlaceReviewDTO,
} from "../dtos/place-review.dto";
import {
  PlaceReviewAlreadyRemovedError,
  PlaceReviewNotAuthorError,
  PlaceReviewNotFoundError,
} from "../errors/place-review.errors";
import type {
  PlaceReviewRepository,
  ReviewAggregate,
} from "../repositories/place-review.repository";

export class PlaceReviewService {
  constructor(
    private reviewRepository: PlaceReviewRepository,
    private transactionManager: TransactionManager,
  ) {}

  async upsertReview(userId: string, data: UpsertPlaceReviewDTO) {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };
      const review = await this.reviewRepository.upsertActive(
        {
          placeId: data.placeId,
          authorUserId: userId,
          rating: data.rating,
          body: data.body,
        },
        ctx,
      );

      logger.info(
        {
          event: "place_review.upserted",
          reviewId: review.id,
          placeId: data.placeId,
          userId,
          rating: data.rating,
        },
        "Venue review upserted",
      );

      return review;
    });
  }

  async removeOwnReview(userId: string, reviewId: string) {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };
      const review = await this.reviewRepository.findById(reviewId, ctx);
      if (!review) {
        throw new PlaceReviewNotFoundError(reviewId);
      }
      if (review.authorUserId !== userId) {
        throw new PlaceReviewNotAuthorError();
      }
      if (review.removedAt) {
        throw new PlaceReviewAlreadyRemovedError(reviewId);
      }

      await this.reviewRepository.softRemove(reviewId, userId, undefined, ctx);

      logger.info(
        {
          event: "place_review.removed_by_author",
          reviewId,
          placeId: review.placeId,
          userId,
        },
        "Venue review removed by author",
      );

      return review;
    });
  }

  async getAggregate(placeId: string): Promise<ReviewAggregate> {
    return this.reviewRepository.getAggregate(placeId);
  }

  async getAggregatesByPlaceIds(placeIds: string[]) {
    return this.reviewRepository.getAggregatesByPlaceIds(placeIds);
  }

  async listActiveReviews(data: ListPlaceReviewsDTO) {
    return this.reviewRepository.listActiveByPlace(
      data.placeId,
      data.limit,
      data.offset,
    );
  }

  async getViewerReview(userId: string, placeId: string) {
    return this.reviewRepository.findActiveByPlaceAndUser(placeId, userId);
  }

  // Admin methods
  async adminListReviews(data: AdminListPlaceReviewsDTO) {
    return this.reviewRepository.listForAdmin(
      {
        placeId: data.placeId,
        authorUserId: data.authorUserId,
        status: data.status,
        rating: data.rating,
      },
      data.limit,
      data.offset,
    );
  }

  async adminRemoveReview(
    adminUserId: string,
    reviewId: string,
    reason?: string,
  ) {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };
      const review = await this.reviewRepository.findById(reviewId, ctx);
      if (!review) {
        throw new PlaceReviewNotFoundError(reviewId);
      }
      if (review.removedAt) {
        throw new PlaceReviewAlreadyRemovedError(reviewId);
      }

      await this.reviewRepository.softRemove(
        reviewId,
        adminUserId,
        reason,
        ctx,
      );

      logger.info(
        {
          event: "place_review.removed_by_admin",
          reviewId,
          placeId: review.placeId,
          adminUserId,
          reason,
        },
        "Venue review removed by admin",
      );

      return review;
    });
  }
}
