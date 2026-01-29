import { TRPCError } from "@trpc/server";
import { NotOrganizationOwnerError } from "@/modules/organization/errors/organization.errors";
import { protectedProcedure, router } from "@/shared/infra/trpc/trpc";
import { AppError } from "@/shared/kernel/errors";
import { CreateGuestProfileSchema, ListGuestProfilesSchema } from "./dtos";
import { GuestProfileNotFoundError } from "./errors/guest-profile.errors";
import { makeGuestProfileService } from "./factories/guest-profile.factory";

function handleGuestProfileError(error: unknown): never {
  if (error instanceof GuestProfileNotFoundError) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: error.message,
      cause: error,
    });
  }
  if (error instanceof NotOrganizationOwnerError) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: error.message,
      cause: error,
    });
  }
  if (error instanceof AppError) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: error.message,
      cause: error,
    });
  }
  throw error;
}

export const guestProfileRouter = router({
  list: protectedProcedure
    .input(ListGuestProfilesSchema)
    .query(async ({ input, ctx }) => {
      try {
        const service = makeGuestProfileService();
        return await service.list(ctx.userId, input);
      } catch (error) {
        handleGuestProfileError(error);
      }
    }),

  create: protectedProcedure
    .input(CreateGuestProfileSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeGuestProfileService();
        return await service.create(ctx.userId, input);
      } catch (error) {
        handleGuestProfileError(error);
      }
    }),
});
