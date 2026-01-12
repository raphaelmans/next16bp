import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "@/shared/infra/trpc/trpc";
import {
  CourtNotFoundError,
  NotCourtOwnerError,
} from "../court/errors/court.errors";
import { GetCourtHoursSchema, SetCourtHoursSchema } from "./dtos";
import { CourtHoursOverlapError } from "./errors/court-hours.errors";
import { makeCourtHoursService } from "./factories/court-hours.factory";

function handleCourtHoursError(error: unknown): never {
  if (error instanceof CourtNotFoundError) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: error.message,
      cause: error,
    });
  }
  if (error instanceof NotCourtOwnerError) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: error.message,
      cause: error,
    });
  }
  if (error instanceof CourtHoursOverlapError) {
    throw new TRPCError({
      code: "CONFLICT",
      message: error.message,
      cause: error,
    });
  }
  throw error;
}

export const courtHoursRouter = router({
  get: protectedProcedure
    .input(GetCourtHoursSchema)
    .query(async ({ input }) => {
      const service = makeCourtHoursService();
      return service.getHours(input.courtId);
    }),
  set: protectedProcedure
    .input(SetCourtHoursSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeCourtHoursService();
        return await service.setHours(ctx.userId, input);
      } catch (error) {
        handleCourtHoursError(error);
      }
    }),
});
