import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "@/lib/shared/infra/trpc/trpc";
import { OrganizationMemberPermissionDeniedError } from "@/lib/modules/organization-member/errors/organization-member.errors";
import {
  NotPlaceOwnerError,
  PlaceNotFoundError,
} from "../place/errors/place.errors";
import { GetPlaceAddonsSchema, SetPlaceAddonsSchema } from "./dtos";
import {
  PlaceAddonOverlapError,
  PlaceAddonValidationError,
} from "./errors/place-addon.errors";
import { makePlaceAddonService } from "./factories/place-addon.factory";

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

function redactPlaceAddonLocale<
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

function handlePlaceAddonError(error: unknown): never {
  if (error instanceof PlaceNotFoundError) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: error.message,
      cause: error,
    });
  }

  if (
    error instanceof NotPlaceOwnerError ||
    error instanceof OrganizationMemberPermissionDeniedError
  ) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: error.message,
      cause: error,
    });
  }

  if (error instanceof PlaceAddonOverlapError) {
    throw new TRPCError({
      code: "CONFLICT",
      message: error.message,
      cause: error,
    });
  }

  if (error instanceof PlaceAddonValidationError) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: error.message,
      cause: error,
    });
  }

  throw error;
}

export const placeAddonRouter = router({
  get: protectedProcedure
    .input(GetPlaceAddonsSchema)
    .query(async ({ input }) => {
      const service = makePlaceAddonService();
      const configs = await service.getByPlace(input.placeId);
      return configs.map((config) => redactPlaceAddonLocale(config));
    }),
  set: protectedProcedure
    .input(SetPlaceAddonsSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makePlaceAddonService();
        const configs = await service.setForPlace(ctx.userId, input);
        return configs.map((config) => redactPlaceAddonLocale(config));
      } catch (error) {
        handlePlaceAddonError(error);
      }
    }),
});
