import { TRPCError } from "@trpc/server";
import {
  CoachNotFoundError,
  CoachOwnershipError,
} from "@/lib/modules/coach/errors/coach.errors";
import { protectedProcedure, router } from "@/lib/shared/infra/trpc/trpc";
import { GetCoachRateRulesSchema, SetCoachRateRulesSchema } from "./dtos";
import { CoachRateRuleOverlapError } from "./errors/coach-rate-rule.errors";
import { makeCoachRateRuleService } from "./factories/coach-rate-rule.factory";

function redactRuleCurrency<T extends { currency?: string }>(
  rule: T,
): Omit<T, "currency"> {
  const { currency: _currency, ...rest } = rule;
  return rest;
}

function handleCoachRateRuleError(error: unknown): never {
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

  if (error instanceof CoachRateRuleOverlapError) {
    throw new TRPCError({
      code: "CONFLICT",
      message: error.message,
      cause: error,
    });
  }

  throw error;
}

export const coachRateRuleRouter = router({
  get: protectedProcedure
    .input(GetCoachRateRulesSchema)
    .query(async ({ input, ctx }) => {
      try {
        const service = makeCoachRateRuleService();
        const rules = await service.getRules(ctx.userId, input.coachId);
        return rules.map((rule) => redactRuleCurrency(rule));
      } catch (error) {
        handleCoachRateRuleError(error);
      }
    }),
  set: protectedProcedure
    .input(SetCoachRateRulesSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeCoachRateRuleService();
        const rules = await service.setRules(ctx.userId, input);
        return rules.map((rule) => redactRuleCurrency(rule));
      } catch (error) {
        handleCoachRateRuleError(error);
      }
    }),
});
