import { TRPCError } from "@trpc/server";
import {
  makeCoachSetupStatusUseCase,
  makeSubmitCoachVerificationUseCase,
} from "@/lib/modules/coach-setup/factories/coach-setup.factory";
import {
  protectedProcedure,
  publicProcedure,
  router,
} from "@/lib/shared/infra/trpc/trpc";
import { AppError } from "@/lib/shared/kernel/errors";
import {
  GetCoachByIdOrSlugSchema,
  ListCoachCardMediaSchema,
  ListCoachCardMetaSchema,
  ListCoachesSchema,
  UpdateCoachSchema,
} from "./dtos";
import {
  CoachAlreadyExistsError,
  CoachNotActiveError,
  CoachNotFoundError,
  CoachSlugConflictError,
} from "./errors/coach.errors";
import {
  makeCoachDiscoveryService,
  makeCoachService,
} from "./factories/coach.factory";

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

  if (error instanceof CoachNotActiveError) {
    throw new TRPCError({
      code: "NOT_FOUND",
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
  listSummary: publicProcedure
    .input(ListCoachesSchema)
    .query(async ({ input }) => {
      try {
        const service = makeCoachDiscoveryService();
        return await service.listCoachSummaries(input);
      } catch (error) {
        handleCoachError(error);
      }
    }),
  cardMediaByIds: publicProcedure
    .input(ListCoachCardMediaSchema)
    .query(async ({ input }) => {
      try {
        const service = makeCoachDiscoveryService();
        return await service.listCoachCardMediaByIds(input.coachIds);
      } catch (error) {
        handleCoachError(error);
      }
    }),
  cardMetaByIds: publicProcedure
    .input(ListCoachCardMetaSchema)
    .query(async ({ input }) => {
      try {
        const service = makeCoachDiscoveryService();
        return await service.listCoachCardMetaByIds(input.coachIds);
      } catch (error) {
        handleCoachError(error);
      }
    }),
  getByIdOrSlug: publicProcedure
    .input(GetCoachByIdOrSlugSchema)
    .query(async ({ input }) => {
      try {
        const service = makeCoachDiscoveryService();
        return await service.getCoachByIdOrSlug(input.coachIdOrSlug);
      } catch (error) {
        handleCoachError(error);
      }
    }),
  stats: publicProcedure.query(async () => {
    const service = makeCoachDiscoveryService();
    return service.getPublicStats();
  }),
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
  submitVerification: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const useCase = makeSubmitCoachVerificationUseCase();
      return await useCase.execute(ctx.userId);
    } catch (error) {
      handleCoachError(error);
    }
  }),
});
