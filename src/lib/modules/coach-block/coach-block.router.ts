import { TRPCError } from "@trpc/server";
import {
  CoachNotFoundError,
  CoachOwnershipError,
} from "@/lib/modules/coach/errors/coach.errors";
import { protectedProcedure, router } from "@/lib/shared/infra/trpc/trpc";
import {
  CreateCoachBlockSchema,
  DeleteCoachBlockSchema,
  ListCoachBlocksSchema,
} from "./dtos";
import {
  CoachBlockNotFoundError,
  CoachBlockOverlapError,
  CoachBlockTimeRangeInvalidError,
} from "./errors/coach-block.errors";
import { makeCoachBlockService } from "./factories/coach-block.factory";

function handleCoachBlockError(error: unknown): never {
  if (
    error instanceof CoachNotFoundError ||
    error instanceof CoachBlockNotFoundError
  ) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: error.message,
      cause: error,
    });
  }

  if (error instanceof CoachOwnershipError) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: error.message,
      cause: error,
    });
  }

  if (error instanceof CoachBlockOverlapError) {
    throw new TRPCError({
      code: "CONFLICT",
      message: error.message,
      cause: error,
    });
  }

  if (error instanceof CoachBlockTimeRangeInvalidError) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: error.message,
      cause: error,
    });
  }

  throw error;
}

export const coachBlockRouter = router({
  list: protectedProcedure
    .input(ListCoachBlocksSchema)
    .query(async ({ input, ctx }) => {
      try {
        const service = makeCoachBlockService();
        return await service.list(ctx.userId, input);
      } catch (error) {
        handleCoachBlockError(error);
      }
    }),
  create: protectedProcedure
    .input(CreateCoachBlockSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeCoachBlockService();
        return await service.create(ctx.userId, input);
      } catch (error) {
        handleCoachBlockError(error);
      }
    }),
  delete: protectedProcedure
    .input(DeleteCoachBlockSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeCoachBlockService();
        await service.delete(ctx.userId, input);
        return { success: true };
      } catch (error) {
        handleCoachBlockError(error);
      }
    }),
});
