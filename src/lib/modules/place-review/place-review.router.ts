import { TRPCError } from "@trpc/server";
import { AppError } from "@/lib/shared/kernel/errors";
import {
  protectedProcedure,
  protectedRateLimitedProcedure,
  publicProcedure,
  router,
} from "@/lib/shared/infra/trpc/trpc";
import {
  GetPlaceReviewAggregateSchema,
  GetViewerReviewSchema,
  ListPlaceReviewsSchema,
  RemovePlaceReviewSchema,
  UpsertPlaceReviewSchema,
} from "./dtos/place-review.dto";
import {
  PlaceReviewAlreadyRemovedError,
  PlaceReviewNotAuthorError,
  PlaceReviewNotFoundError,
} from "./errors/place-review.errors";
import { makePlaceReviewService } from "./factories/place-review.factory";

function handlePlaceReviewError(error: unknown): never {
  if (error instanceof PlaceReviewNotFoundError) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: error.message,
      cause: error,
    });
  }
  if (error instanceof PlaceReviewNotAuthorError) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: error.message,
      cause: error,
    });
  }
  if (error instanceof PlaceReviewAlreadyRemovedError) {
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

export const placeReviewRouter = router({
  list: publicProcedure
    .input(ListPlaceReviewsSchema)
    .query(async ({ input }) => {
      const service = makePlaceReviewService();
      return service.listActiveReviews(input);
    }),

  aggregate: publicProcedure
    .input(GetPlaceReviewAggregateSchema)
    .query(async ({ input }) => {
      const service = makePlaceReviewService();
      return service.getAggregate(input.placeId);
    }),

  viewerReview: protectedProcedure
    .input(GetViewerReviewSchema)
    .query(async ({ input, ctx }) => {
      const service = makePlaceReviewService();
      return service.getViewerReview(ctx.userId, input.placeId);
    }),

  upsert: protectedRateLimitedProcedure("mutation")
    .input(UpsertPlaceReviewSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makePlaceReviewService();
        return await service.upsertReview(ctx.userId, input);
      } catch (error) {
        handlePlaceReviewError(error);
      }
    }),

  remove: protectedProcedure
    .input(RemovePlaceReviewSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makePlaceReviewService();
        await service.removeOwnReview(ctx.userId, input.reviewId);
        return { success: true };
      } catch (error) {
        handlePlaceReviewError(error);
      }
    }),
});
