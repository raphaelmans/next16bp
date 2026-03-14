import { TRPCError } from "@trpc/server";
import { revalidatePublicCoachDetailPaths } from "@/lib/shared/infra/cache/revalidate-public-coach-detail";
import {
  protectedProcedure,
  protectedRateLimitedProcedure,
  publicProcedure,
  router,
} from "@/lib/shared/infra/trpc/trpc";
import { AppError } from "@/lib/shared/kernel/errors";
import {
  GetCoachReviewAggregateSchema,
  GetCoachReviewEligibilitySchema,
  GetCoachViewerReviewSchema,
  ListCoachReviewsSchema,
  RemoveCoachReviewSchema,
  UpsertCoachReviewSchema,
} from "./dtos";
import {
  CoachReviewAlreadyRemovedError,
  CoachReviewNotAuthorError,
  CoachReviewNotEligibleError,
  CoachReviewNotFoundError,
} from "./errors/coach-review.errors";
import { makeCoachReviewService } from "./factories/coach-review.factory";

function handleCoachReviewError(error: unknown): never {
  if (error instanceof CoachReviewNotFoundError) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: error.message,
      cause: error,
    });
  }
  if (error instanceof CoachReviewNotAuthorError) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: error.message,
      cause: error,
    });
  }
  if (
    error instanceof CoachReviewAlreadyRemovedError ||
    error instanceof CoachReviewNotEligibleError
  ) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: error.message,
      cause: error,
    });
  }
  if (error instanceof AppError) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: error.message,
      cause: error,
    });
  }
  throw error;
}

export const coachReviewRouter = router({
  list: publicProcedure
    .input(ListCoachReviewsSchema)
    .query(async ({ input }) => {
      const service = makeCoachReviewService();
      return service.listActiveReviews(input);
    }),

  aggregate: publicProcedure
    .input(GetCoachReviewAggregateSchema)
    .query(async ({ input }) => {
      const service = makeCoachReviewService();
      return service.getAggregate(input.coachId);
    }),

  viewerReview: protectedProcedure
    .input(GetCoachViewerReviewSchema)
    .query(async ({ input, ctx }) => {
      const service = makeCoachReviewService();
      return service.getViewerReview(ctx.userId, input.coachId);
    }),

  viewerEligibility: protectedProcedure
    .input(GetCoachReviewEligibilitySchema)
    .query(async ({ input, ctx }) => {
      const service = makeCoachReviewService();
      return service.getViewerEligibility(ctx.userId, input.coachId);
    }),

  upsert: protectedRateLimitedProcedure("mutation")
    .input(UpsertCoachReviewSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeCoachReviewService();
        const review = await service.upsertReview(ctx.userId, input);
        await revalidatePublicCoachDetailPaths({
          coachId: input.coachId,
          requestId: ctx.requestId,
        });
        return review;
      } catch (error) {
        handleCoachReviewError(error);
      }
    }),

  remove: protectedProcedure
    .input(RemoveCoachReviewSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeCoachReviewService();
        const review = await service.removeOwnReview(
          ctx.userId,
          input.reviewId,
        );
        await revalidatePublicCoachDetailPaths({
          coachId: review.coachId,
          requestId: ctx.requestId,
        });
        return { success: true };
      } catch (error) {
        handleCoachReviewError(error);
      }
    }),
});
