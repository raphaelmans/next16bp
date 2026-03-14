import { TRPCError } from "@trpc/server";
import {
  CoachNotFoundError,
  CoachOwnershipError,
} from "@/lib/modules/coach/errors/coach.errors";
import { protectedProcedure, router } from "@/lib/shared/infra/trpc/trpc";
import { GetCoachHoursSchema, SetCoachHoursSchema } from "./dtos";
import { CoachHoursOverlapError } from "./errors/coach-hours.errors";
import { makeCoachHoursService } from "./factories/coach-hours.factory";

function handleCoachHoursError(error: unknown): never {
  if (error instanceof CoachNotFoundError) {
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

  if (error instanceof CoachHoursOverlapError) {
    throw new TRPCError({
      code: "CONFLICT",
      message: error.message,
      cause: error,
    });
  }

  throw error;
}

export const coachHoursRouter = router({
  get: protectedProcedure
    .input(GetCoachHoursSchema)
    .query(async ({ input, ctx }) => {
      try {
        const service = makeCoachHoursService();
        return await service.getHours(ctx.userId, input.coachId);
      } catch (error) {
        handleCoachHoursError(error);
      }
    }),
  set: protectedProcedure
    .input(SetCoachHoursSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeCoachHoursService();
        return await service.setHours(ctx.userId, input);
      } catch (error) {
        handleCoachHoursError(error);
      }
    }),
});
