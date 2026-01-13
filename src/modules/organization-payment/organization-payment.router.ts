import { TRPCError } from "@trpc/server";
import {
  NotOrganizationOwnerError,
  OrganizationNotFoundError,
} from "@/modules/organization/errors/organization.errors";
import {
  protectedProcedure,
  protectedRateLimitedProcedure,
  router,
} from "@/shared/infra/trpc/trpc";
import { AppError } from "@/shared/kernel/errors";
import {
  CreateOrganizationPaymentMethodSchema,
  DeleteOrganizationPaymentMethodSchema,
  ListOrganizationPaymentMethodsSchema,
  SetDefaultOrganizationPaymentMethodSchema,
  UpdateOrganizationPaymentMethodSchema,
} from "./dtos";
import {
  OrganizationPaymentMethodConflictError,
  OrganizationPaymentMethodInactiveError,
  OrganizationPaymentMethodNotFoundError,
} from "./errors/organization-payment.errors";
import { makeOrganizationPaymentService } from "./factories/organization-payment.factory";

function handleOrganizationPaymentError(error: unknown): never {
  if (
    error instanceof OrganizationNotFoundError ||
    error instanceof OrganizationPaymentMethodNotFoundError
  ) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: error.message,
      cause: error,
    });
  }
  if (error instanceof OrganizationPaymentMethodConflictError) {
    throw new TRPCError({
      code: "CONFLICT",
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
  if (error instanceof OrganizationPaymentMethodInactiveError) {
    throw new TRPCError({
      code: "BAD_REQUEST",
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

export const organizationPaymentRouter = router({
  listMethods: protectedProcedure
    .input(ListOrganizationPaymentMethodsSchema)
    .query(async ({ input, ctx }) => {
      try {
        const service = makeOrganizationPaymentService();
        const methods = await service.listMethods(
          ctx.userId,
          input.organizationId,
        );
        return { methods };
      } catch (error) {
        handleOrganizationPaymentError(error);
      }
    }),

  createMethod: protectedRateLimitedProcedure("mutation")
    .input(CreateOrganizationPaymentMethodSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeOrganizationPaymentService();
        const method = await service.createMethod(ctx.userId, input);
        return { method };
      } catch (error) {
        handleOrganizationPaymentError(error);
      }
    }),

  updateMethod: protectedProcedure
    .input(UpdateOrganizationPaymentMethodSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeOrganizationPaymentService();
        const method = await service.updateMethod(ctx.userId, input);
        return { method };
      } catch (error) {
        handleOrganizationPaymentError(error);
      }
    }),

  deleteMethod: protectedProcedure
    .input(DeleteOrganizationPaymentMethodSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeOrganizationPaymentService();
        await service.deleteMethod(ctx.userId, input.paymentMethodId);
        return { success: true };
      } catch (error) {
        handleOrganizationPaymentError(error);
      }
    }),

  setDefault: protectedProcedure
    .input(SetDefaultOrganizationPaymentMethodSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeOrganizationPaymentService();
        await service.setDefaultMethod(ctx.userId, input.paymentMethodId);
        return { success: true };
      } catch (error) {
        handleOrganizationPaymentError(error);
      }
    }),
});
