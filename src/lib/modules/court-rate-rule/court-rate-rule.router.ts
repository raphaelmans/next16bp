import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "@/lib/shared/infra/trpc/trpc";
import {
  CourtNotFoundError,
  CourtOrganizationMismatchError,
  NotCourtOwnerError,
} from "../court/errors/court.errors";
import {
  CopyCourtRateRulesSchema,
  GetCourtRateRulesSchema,
  SetCourtRateRulesSchema,
} from "./dtos";
import { CourtRateRuleOverlapError } from "./errors/court-rate-rule.errors";
import { makeCourtRateRuleService } from "./factories/court-rate-rule.factory";

function handleCourtRateRuleError(error: unknown): never {
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
  if (error instanceof CourtRateRuleOverlapError) {
    throw new TRPCError({
      code: "CONFLICT",
      message: error.message,
      cause: error,
    });
  }
  if (error instanceof CourtOrganizationMismatchError) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: error.message,
      cause: error,
    });
  }
  throw error;
}

export const courtRateRuleRouter = router({
  get: protectedProcedure
    .input(GetCourtRateRulesSchema)
    .query(async ({ input }) => {
      const service = makeCourtRateRuleService();
      return service.getRules(input.courtId);
    }),
  set: protectedProcedure
    .input(SetCourtRateRulesSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeCourtRateRuleService();
        return await service.setRules(ctx.userId, input);
      } catch (error) {
        handleCourtRateRuleError(error);
      }
    }),
  copyFromCourt: protectedProcedure
    .input(CopyCourtRateRulesSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeCourtRateRuleService();
        return await service.copyFromCourt(
          ctx.userId,
          input.sourceCourtId,
          input.targetCourtId,
        );
      } catch (error) {
        handleCourtRateRuleError(error);
      }
    }),
});
