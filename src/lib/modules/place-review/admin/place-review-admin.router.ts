import { TRPCError } from "@trpc/server";
import { revalidatePublicPlaceDetailPaths } from "@/lib/shared/infra/cache/revalidate-public-place-detail";
import { adminProcedure, router } from "@/lib/shared/infra/trpc/trpc";
import { AppError } from "@/lib/shared/kernel/errors";
import {
  AdminListPlaceReviewsSchema,
  AdminRemovePlaceReviewSchema,
} from "../dtos/place-review.dto";
import {
  PlaceReviewAlreadyRemovedError,
  PlaceReviewNotFoundError,
} from "../errors/place-review.errors";
import { makePlaceReviewService } from "../factories/place-review.factory";

function handleAdminReviewError(error: unknown): never {
  if (error instanceof PlaceReviewNotFoundError) {
    throw new TRPCError({
      code: "NOT_FOUND",
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

export const placeReviewAdminRouter = router({
  list: adminProcedure
    .input(AdminListPlaceReviewsSchema)
    .query(async ({ input }) => {
      const service = makePlaceReviewService();
      return service.adminListReviews(input);
    }),

  remove: adminProcedure
    .input(AdminRemovePlaceReviewSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makePlaceReviewService();
        const review = await service.adminRemoveReview(
          ctx.userId,
          input.reviewId,
          input.reason,
        );
        await revalidatePublicPlaceDetailPaths({
          placeId: review.placeId,
          includeReviewPaths: true,
          requestId: ctx.requestId,
        });
        return { success: true };
      } catch (error) {
        handleAdminReviewError(error);
      }
    }),
});
