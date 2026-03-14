import { TRPCError } from "@trpc/server";
import {
  CoachNotFoundError,
  CoachOwnershipError,
} from "@/lib/modules/coach/errors/coach.errors";
import {
  protectedProcedure,
  protectedRateLimitedProcedure,
  router,
} from "@/lib/shared/infra/trpc/trpc";
import { AppError } from "@/lib/shared/kernel/errors";
import {
  CreateCoachPaymentMethodSchema,
  DeleteCoachPaymentMethodSchema,
  ListCoachPaymentMethodsSchema,
  SetDefaultCoachPaymentMethodSchema,
  UpdateCoachPaymentMethodSchema,
} from "./dtos";
import {
  CoachPaymentMethodConflictError,
  CoachPaymentMethodInactiveError,
  CoachPaymentMethodNotFoundError,
} from "./errors/coach-payment.errors";
import { makeCoachPaymentService } from "./factories/coach-payment.factory";

function handleCoachPaymentError(error: unknown): never {
  if (
    error instanceof CoachNotFoundError ||
    error instanceof CoachPaymentMethodNotFoundError
  ) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: error.message,
      cause: error,
    });
  }
  if (error instanceof CoachPaymentMethodConflictError) {
    throw new TRPCError({
      code: "CONFLICT",
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
  if (error instanceof CoachPaymentMethodInactiveError) {
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

export const coachPaymentRouter = router({
  listMethods: protectedProcedure
    .input(ListCoachPaymentMethodsSchema)
    .query(async ({ input, ctx }) => {
      try {
        const service = makeCoachPaymentService();
        const methods = await service.listMethods(ctx.userId, input.coachId);
        return { methods };
      } catch (error) {
        handleCoachPaymentError(error);
      }
    }),

  createMethod: protectedRateLimitedProcedure("mutation")
    .input(CreateCoachPaymentMethodSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeCoachPaymentService();
        const method = await service.createMethod(ctx.userId, input);
        return { method };
      } catch (error) {
        handleCoachPaymentError(error);
      }
    }),

  updateMethod: protectedProcedure
    .input(UpdateCoachPaymentMethodSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeCoachPaymentService();
        const method = await service.updateMethod(ctx.userId, input);
        return { method };
      } catch (error) {
        handleCoachPaymentError(error);
      }
    }),

  deleteMethod: protectedProcedure
    .input(DeleteCoachPaymentMethodSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeCoachPaymentService();
        await service.deleteMethod(ctx.userId, input.paymentMethodId);
        return { success: true };
      } catch (error) {
        handleCoachPaymentError(error);
      }
    }),

  setDefault: protectedProcedure
    .input(SetDefaultCoachPaymentMethodSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeCoachPaymentService();
        await service.setDefaultMethod(ctx.userId, input.paymentMethodId);
        return { success: true };
      } catch (error) {
        handleCoachPaymentError(error);
      }
    }),
});
