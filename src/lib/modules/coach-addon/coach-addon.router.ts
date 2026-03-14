import { TRPCError } from "@trpc/server";
import {
  CoachNotFoundError,
  CoachOwnershipError,
} from "@/lib/modules/coach/errors/coach.errors";
import { protectedProcedure, router } from "@/lib/shared/infra/trpc/trpc";
import { GetCoachAddonsSchema, SetCoachAddonsSchema } from "./dtos";
import {
  CoachAddonOverlapError,
  CoachAddonValidationError,
} from "./errors/coach-addon.errors";
import { makeCoachAddonService } from "./factories/coach-addon.factory";

function redactAddonLocale<T extends { flatFeeCurrency?: string | null }>(
  addon: T,
): Omit<T, "flatFeeCurrency"> {
  const { flatFeeCurrency: _flatFeeCurrency, ...rest } = addon;
  return rest;
}

function redactRuleCurrency<T extends { currency?: string | null }>(
  rule: T,
): Omit<T, "currency"> {
  const { currency: _currency, ...rest } = rule;
  return rest;
}

function redactCoachAddonLocale<
  T extends {
    addon: { flatFeeCurrency?: string | null };
    rules: { currency?: string | null }[];
  },
>(
  config: T,
): Omit<T, "addon" | "rules"> & {
  addon: Omit<T["addon"], "flatFeeCurrency">;
  rules: Array<Omit<T["rules"][number], "currency">>;
} {
  return {
    ...config,
    addon: redactAddonLocale(config.addon),
    rules: config.rules.map((rule) => redactRuleCurrency(rule)),
  };
}

function handleCoachAddonError(error: unknown): never {
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

  if (error instanceof CoachAddonOverlapError) {
    throw new TRPCError({
      code: "CONFLICT",
      message: error.message,
      cause: error,
    });
  }

  if (error instanceof CoachAddonValidationError) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: error.message,
      cause: error,
    });
  }

  throw error;
}

export const coachAddonRouter = router({
  get: protectedProcedure
    .input(GetCoachAddonsSchema)
    .query(async ({ input, ctx }) => {
      try {
        const service = makeCoachAddonService();
        const configs = await service.getByCoach(ctx.userId, input.coachId);
        return configs.map((config) => redactCoachAddonLocale(config));
      } catch (error) {
        handleCoachAddonError(error);
      }
    }),
  set: protectedProcedure
    .input(SetCoachAddonsSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeCoachAddonService();
        const configs = await service.setForCoach(ctx.userId, input);
        return configs.map((config) => redactCoachAddonLocale(config));
      } catch (error) {
        handleCoachAddonError(error);
      }
    }),
});
