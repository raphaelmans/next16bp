import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "@/lib/shared/infra/trpc/trpc";
import {
  CourtNotFoundError,
  NotCourtOwnerError,
} from "../court/errors/court.errors";
import { GetCourtAddonsSchema, SetCourtAddonsSchema } from "./dtos";
import {
  CourtAddonOverlapError,
  CourtAddonValidationError,
} from "./errors/court-addon.errors";
import { makeCourtAddonService } from "./factories/court-addon.factory";

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

function redactCourtAddonLocale<
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

  if (error instanceof CourtAddonValidationError) {
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
      const configs = await service.getByCourt(input.courtId);
      return configs.map((config) => redactCourtAddonLocale(config));
    }),
  set: protectedProcedure
    .input(SetCourtAddonsSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeCourtAddonService();
        const configs = await service.setForCourt(ctx.userId, input);
        return configs.map((config) => redactCourtAddonLocale(config));
      } catch (error) {
        handleCourtAddonError(error);
      }
    }),
});
