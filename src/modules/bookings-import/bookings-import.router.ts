import { TRPCError } from "@trpc/server";
import {
  protectedProcedure,
  protectedRateLimitedProcedure,
  router,
} from "@/shared/infra/trpc/trpc";
import { AppError } from "@/shared/kernel/errors";
import {
  CommitJobSchema,
  CreateBookingsImportSchema,
  DeleteRowSchema,
  DiscardJobSchema,
  GetAiUsageSchema,
  GetJobSchema,
  ListJobsSchema,
  ListRowsSchema,
  ListSourcesSchema,
  NormalizeJobSchema,
  UpdateRowSchema,
} from "./dtos";
import {
  BookingsImportAiAlreadyUsedError,
  BookingsImportHasBlockingErrorsError,
  BookingsImportInvalidFileTypeError,
  BookingsImportInvalidSourceError,
  BookingsImportInvalidStatusError,
  BookingsImportJobNotFoundError,
  BookingsImportNotOwnerError,
  BookingsImportPlaceNotFoundError,
  BookingsImportRowNotFoundError,
} from "./errors/bookings-import.errors";
import { makeBookingsImportService } from "./factories/bookings-import.factory";

function handleBookingsImportError(error: unknown): never {
  if (
    error instanceof BookingsImportPlaceNotFoundError ||
    error instanceof BookingsImportJobNotFoundError ||
    error instanceof BookingsImportRowNotFoundError
  ) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: error.message,
      cause: error,
    });
  }
  if (error instanceof BookingsImportNotOwnerError) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: error.message,
      cause: error,
    });
  }
  if (
    error instanceof BookingsImportInvalidSourceError ||
    error instanceof BookingsImportInvalidFileTypeError ||
    error instanceof BookingsImportInvalidStatusError
  ) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: error.message,
      cause: error,
    });
  }
  if (error instanceof BookingsImportAiAlreadyUsedError) {
    throw new TRPCError({
      code: "CONFLICT",
      message: error.message,
      cause: error,
    });
  }
  if (error instanceof BookingsImportHasBlockingErrorsError) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: error.message,
      cause: error,
    });
  }
  if (error instanceof AppError) {
    const code =
      error.httpStatus === 409
        ? "CONFLICT"
        : error.httpStatus === 422
          ? "UNPROCESSABLE_CONTENT"
          : error.httpStatus === 403
            ? "FORBIDDEN"
            : error.httpStatus === 404
              ? "NOT_FOUND"
              : "BAD_REQUEST";

    throw new TRPCError({
      code,
      message: error.message,
      cause: error,
    });
  }

  throw error;
}

export const bookingsImportRouter = router({
  createDraft: protectedRateLimitedProcedure("mutation")
    .input(CreateBookingsImportSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeBookingsImportService();
        return await service.createDraft(ctx.userId, input);
      } catch (error) {
        handleBookingsImportError(error);
      }
    }),

  getJob: protectedProcedure
    .input(GetJobSchema)
    .query(async ({ input, ctx }) => {
      try {
        const service = makeBookingsImportService();
        return await service.getJob(ctx.userId, input.jobId);
      } catch (error) {
        handleBookingsImportError(error);
      }
    }),

  listJobs: protectedProcedure
    .input(ListJobsSchema)
    .query(async ({ input, ctx }) => {
      try {
        const service = makeBookingsImportService();
        return await service.listJobs(ctx.userId, input.placeId);
      } catch (error) {
        handleBookingsImportError(error);
      }
    }),

  listRows: protectedProcedure
    .input(ListRowsSchema)
    .query(async ({ input, ctx }) => {
      try {
        const service = makeBookingsImportService();
        return await service.listRows(ctx.userId, input.jobId);
      } catch (error) {
        handleBookingsImportError(error);
      }
    }),

  listSources: protectedProcedure
    .input(ListSourcesSchema)
    .query(async ({ input, ctx }) => {
      try {
        const service = makeBookingsImportService();
        return await service.listSources(ctx.userId, input.jobId);
      } catch (error) {
        handleBookingsImportError(error);
      }
    }),

  updateRow: protectedProcedure
    .input(UpdateRowSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeBookingsImportService();
        const { rowId, ...data } = input;
        return await service.updateRow(ctx.userId, rowId, data);
      } catch (error) {
        handleBookingsImportError(error);
      }
    }),

  deleteRow: protectedProcedure
    .input(DeleteRowSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeBookingsImportService();
        await service.deleteRow(ctx.userId, input.rowId);
        return { success: true };
      } catch (error) {
        handleBookingsImportError(error);
      }
    }),

  discardJob: protectedProcedure
    .input(DiscardJobSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeBookingsImportService();
        await service.discardJob(ctx.userId, input.jobId);
        return { success: true };
      } catch (error) {
        handleBookingsImportError(error);
      }
    }),

  normalize: protectedProcedure
    .input(NormalizeJobSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeBookingsImportService();
        return await service.normalize(
          ctx.userId,
          input.jobId,
          input.mode,
          input.confirmAiOnce,
        );
      } catch (error) {
        handleBookingsImportError(error);
      }
    }),

  commit: protectedProcedure
    .input(CommitJobSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeBookingsImportService();
        return await service.commit(ctx.userId, input.jobId);
      } catch (error) {
        handleBookingsImportError(error);
      }
    }),

  aiUsage: protectedProcedure
    .input(GetAiUsageSchema)
    .query(async ({ input, ctx }) => {
      try {
        const service = makeBookingsImportService();
        return await service.getAiUsage(ctx.userId, input);
      } catch (error) {
        handleBookingsImportError(error);
      }
    }),
});
