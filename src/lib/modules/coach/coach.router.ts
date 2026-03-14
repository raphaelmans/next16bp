import { TRPCError } from "@trpc/server";
import { makeCoachSetupStatusUseCase } from "@/lib/modules/coach-setup/factories/coach-setup.factory";
import { protectedProcedure, router } from "@/lib/shared/infra/trpc/trpc";
import { AppError } from "@/lib/shared/kernel/errors";
import { UpdateCoachSchema } from "./dtos";
import {
  CoachAlreadyExistsError,
  CoachNotFoundError,
  CoachSlugConflictError,
} from "./errors/coach.errors";
import { makeCoachService } from "./factories/coach.factory";

function handleCoachError(error: unknown): never {
  if (error instanceof CoachNotFoundError) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: error.message,
      cause: error,
    });
  }

  if (
    error instanceof CoachAlreadyExistsError ||
    error instanceof CoachSlugConflictError
  ) {
    throw new TRPCError({
      code: "CONFLICT",
      message: error.message,
      cause: error,
    });
  }

  if (error instanceof AppError) {
    const code =
      error.httpStatus === 422
        ? "UNPROCESSABLE_CONTENT"
        : error.httpStatus === 409
          ? "CONFLICT"
          : "BAD_REQUEST";

    throw new TRPCError({
      code,
      message: error.message,
      cause: error,
    });
  }

  throw error;
}

export const coachRouter = router({
  getMyProfile: protectedProcedure.query(async ({ ctx }) => {
    try {
      const service = makeCoachService();
      return await service.getCoachByUserId(ctx.userId);
    } catch (error) {
      handleCoachError(error);
    }
  }),
  updateProfile: protectedProcedure
    .input(UpdateCoachSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const service = makeCoachService();
        return await service.updateCoach(ctx.userId, input);
      } catch (error) {
        handleCoachError(error);
      }
    }),
  getSetupStatus: protectedProcedure.query(async ({ ctx }) => {
    const useCase = makeCoachSetupStatusUseCase();
    return useCase.execute(ctx.userId);
  }),
});
