import { TRPCError } from "@trpc/server";
import {
  protectedProcedure,
  protectedRateLimitedProcedure,
  router,
} from "@/shared/infra/trpc/trpc";
import { AppError } from "@/shared/kernel/errors";
import {
  GetPlaceVerificationByPlaceSchema,
  SubmitPlaceVerificationSchema,
  TogglePlaceReservationsSchema,
} from "./dtos";
import {
  NotPlaceOwnerError,
  PlaceNotBookableError,
  PlaceVerificationAlreadyPendingError,
  PlaceVerificationDocumentsRequiredError,
  PlaceVerificationNotFoundError,
} from "./errors/place-verification.errors";
import { makePlaceVerificationService } from "./factories/place-verification.factory";

function handlePlaceVerificationError(error: unknown): never {
  if (error instanceof PlaceVerificationNotFoundError) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: error.message,
      cause: error,
    });
  }
  if (error instanceof NotPlaceOwnerError) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: error.message,
      cause: error,
    });
  }
  if (error instanceof PlaceVerificationAlreadyPendingError) {
    throw new TRPCError({
      code: "CONFLICT",
      message: error.message,
      cause: error,
    });
  }
  if (
    error instanceof PlaceVerificationDocumentsRequiredError ||
    error instanceof PlaceNotBookableError
  ) {
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

export const placeVerificationRouter = router({
  submit: protectedRateLimitedProcedure("mutation")
    .input(SubmitPlaceVerificationSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makePlaceVerificationService();
        await service.submitRequest(ctx.userId, input);
        return { success: true };
      } catch (error) {
        handlePlaceVerificationError(error);
      }
    }),
  getByPlace: protectedProcedure
    .input(GetPlaceVerificationByPlaceSchema)
    .query(async ({ input, ctx }) => {
      try {
        const service = makePlaceVerificationService();
        return await service.getByPlace(ctx.userId, input);
      } catch (error) {
        handlePlaceVerificationError(error);
      }
    }),
  toggleReservations: protectedProcedure
    .input(TogglePlaceReservationsSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makePlaceVerificationService();
        await service.toggleReservations(ctx.userId, input);
        return { success: true };
      } catch (error) {
        handlePlaceVerificationError(error);
      }
    }),
});
