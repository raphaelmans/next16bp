import { TRPCError } from "@trpc/server";
import {
  adminProcedure,
  adminRateLimitedProcedure,
  router,
} from "@/lib/shared/infra/trpc/trpc";
import { AppError } from "@/lib/shared/kernel/errors";
import {
  ApprovePlaceVerificationSchema,
  GetPlaceVerificationByIdSchema,
  ListPlaceVerificationRequestsSchema,
  ReviewPlaceVerificationSchema,
} from "../dtos";
import {
  PlaceVerificationAlreadyReviewedError,
  PlaceVerificationDocumentsRequiredError,
  PlaceVerificationRequestNotFoundError,
} from "../errors/place-verification.errors";
import { makePlaceVerificationAdminService } from "../factories/place-verification.factory";

function handleAdminPlaceVerificationError(error: unknown): never {
  if (error instanceof PlaceVerificationRequestNotFoundError) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: error.message,
      cause: error,
    });
  }
  if (error instanceof PlaceVerificationAlreadyReviewedError) {
    throw new TRPCError({
      code: "CONFLICT",
      message: error.message,
      cause: error,
    });
  }
  if (error instanceof PlaceVerificationDocumentsRequiredError) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: error.message,
      cause: error,
    });
  }
  if (error instanceof AppError) {
    const code =
      error.httpStatus === 409
        ? "CONFLICT"
        : error.httpStatus === 422
          ? "UNPROCESSABLE_CONTENT"
          : "BAD_REQUEST";

    throw new TRPCError({
      code,
      message: error.message,
      cause: error,
    });
  }
  throw error;
}

export const placeVerificationAdminRouter = router({
  getPending: adminProcedure
    .input(ListPlaceVerificationRequestsSchema)
    .query(async ({ input }) => {
      try {
        const service = makePlaceVerificationAdminService();
        return await service.getPendingRequests(input);
      } catch (error) {
        handleAdminPlaceVerificationError(error);
      }
    }),
  getById: adminProcedure
    .input(GetPlaceVerificationByIdSchema)
    .query(async ({ input }) => {
      try {
        const service = makePlaceVerificationAdminService();
        return await service.getById(input);
      } catch (error) {
        handleAdminPlaceVerificationError(error);
      }
    }),
  approve: adminRateLimitedProcedure("mutation")
    .input(ApprovePlaceVerificationSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makePlaceVerificationAdminService();
        await service.approve(ctx.userId, input);
        return { success: true };
      } catch (error) {
        handleAdminPlaceVerificationError(error);
      }
    }),
  reject: adminRateLimitedProcedure("mutation")
    .input(ReviewPlaceVerificationSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makePlaceVerificationAdminService();
        await service.reject(ctx.userId, input);
        return { success: true };
      } catch (error) {
        handleAdminPlaceVerificationError(error);
      }
    }),
});
