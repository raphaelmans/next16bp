import { TRPCError } from "@trpc/server";
import {
  CourtNotFoundError,
  NotCourtOwnerError,
} from "@/modules/court/errors/court.errors";
import { PlaceNotFoundError } from "@/modules/place/errors/place.errors";
import { protectedProcedure, router } from "@/shared/infra/trpc/trpc";
import {
  CancelCourtBlockSchema,
  CreateCourtBlockSchema,
  ListCourtBlocksSchema,
} from "./dtos";
import {
  CourtBlockDurationInvalidError,
  CourtBlockNotFoundError,
  CourtBlockOverlapError,
  CourtBlockOverlapsReservationError,
  CourtBlockPricingUnavailableError,
  CourtBlockTimeRangeInvalidError,
} from "./errors/court-block.errors";
import { makeCourtBlockService } from "./factories/court-block.factory";

function handleCourtBlockError(error: unknown): never {
  if (
    error instanceof CourtBlockNotFoundError ||
    error instanceof CourtNotFoundError ||
    error instanceof PlaceNotFoundError
  ) {
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

  if (
    error instanceof CourtBlockOverlapError ||
    error instanceof CourtBlockOverlapsReservationError
  ) {
    throw new TRPCError({
      code: "CONFLICT",
      message: error.message,
      cause: error,
    });
  }

  if (
    error instanceof CourtBlockDurationInvalidError ||
    error instanceof CourtBlockTimeRangeInvalidError ||
    error instanceof CourtBlockPricingUnavailableError
  ) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: error.message,
      cause: error,
    });
  }

  throw error;
}

export const courtBlockRouter = router({
  listForCourtRange: protectedProcedure
    .input(ListCourtBlocksSchema)
    .query(async ({ input, ctx }) => {
      try {
        const service = makeCourtBlockService();
        return await service.listForCourtRange(ctx.userId, input);
      } catch (error) {
        handleCourtBlockError(error);
      }
    }),
  createMaintenance: protectedProcedure
    .input(CreateCourtBlockSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeCourtBlockService();
        return await service.createMaintenance(ctx.userId, input);
      } catch (error) {
        handleCourtBlockError(error);
      }
    }),
  createWalkIn: protectedProcedure
    .input(CreateCourtBlockSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeCourtBlockService();
        return await service.createWalkIn(ctx.userId, input);
      } catch (error) {
        handleCourtBlockError(error);
      }
    }),
  cancel: protectedProcedure
    .input(CancelCourtBlockSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeCourtBlockService();
        return await service.cancelBlock(ctx.userId, input);
      } catch (error) {
        handleCourtBlockError(error);
      }
    }),
});
