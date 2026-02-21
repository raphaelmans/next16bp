import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "@/lib/shared/infra/trpc/trpc";
import {
  CourtNotFoundError,
  NotCourtOwnerError,
} from "../court/errors/court.errors";
import { GetCourtAddonsSchema, SetCourtAddonsSchema } from "./dtos";
import {
  CourtAddonCurrencyMismatchError,
  CourtAddonOverlapError,
  CourtAddonValidationError,
} from "./errors/court-addon.errors";
import { makeCourtAddonService } from "./factories/court-addon.factory";

function handleCourtAddonError(error: unknown): never {
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

  if (error instanceof CourtAddonOverlapError) {
    throw new TRPCError({
      code: "CONFLICT",
      message: error.message,
      cause: error,
    });
  }

  if (
    error instanceof CourtAddonValidationError ||
    error instanceof CourtAddonCurrencyMismatchError
  ) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: error.message,
      cause: error,
    });
  }

  throw error;
}

export const courtAddonRouter = router({
  get: protectedProcedure
    .input(GetCourtAddonsSchema)
    .query(async ({ input }) => {
      const service = makeCourtAddonService();
      return service.getByCourt(input.courtId);
    }),
  set: protectedProcedure
    .input(SetCourtAddonsSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeCourtAddonService();
        return await service.setForCourt(ctx.userId, input);
      } catch (error) {
        handleCourtAddonError(error);
      }
    }),
});
