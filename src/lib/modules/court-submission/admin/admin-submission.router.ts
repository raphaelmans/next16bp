import { TRPCError } from "@trpc/server";
import {
  adminProcedure,
  adminRateLimitedProcedure,
  router,
} from "@/lib/shared/infra/trpc/trpc";
import { AppError } from "@/lib/shared/kernel/errors";
import {
  AdminApproveSubmissionSchema,
  AdminBanUserSchema,
  AdminListSubmissionsSchema,
  AdminRejectSubmissionSchema,
  AdminUnbanUserSchema,
} from "../court-submission.dto";
import {
  CourtSubmissionNotFoundError,
  SubmissionNotPendingError,
} from "../errors/court-submission.errors";
import { makeSubmissionModerationService } from "../factories/court-submission.factory";

function handleModerationError(error: unknown): never {
  if (error instanceof CourtSubmissionNotFoundError) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: error.message,
      cause: error,
    });
  }
  if (error instanceof SubmissionNotPendingError) {
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

export const adminSubmissionRouter = router({
  list: adminProcedure
    .input(AdminListSubmissionsSchema)
    .query(async ({ input }) => {
      const service = makeSubmissionModerationService();
      return service.listSubmissions(input);
    }),

  approve: adminRateLimitedProcedure("mutation")
    .input(AdminApproveSubmissionSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeSubmissionModerationService();
        return await service.approveSubmission(ctx.userId, input.submissionId);
      } catch (error) {
        handleModerationError(error);
      }
    }),

  reject: adminRateLimitedProcedure("mutation")
    .input(AdminRejectSubmissionSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeSubmissionModerationService();
        return await service.rejectSubmission(
          ctx.userId,
          input.submissionId,
          input.reason,
        );
      } catch (error) {
        handleModerationError(error);
      }
    }),

  ban: adminRateLimitedProcedure("mutation")
    .input(AdminBanUserSchema)
    .mutation(async ({ input, ctx }) => {
      const service = makeSubmissionModerationService();
      return service.banUser(ctx.userId, input.userId, input.reason);
    }),

  unban: adminRateLimitedProcedure("mutation")
    .input(AdminUnbanUserSchema)
    .mutation(async ({ input, ctx }) => {
      const service = makeSubmissionModerationService();
      await service.unbanUser(ctx.userId, input.userId);
      return { success: true };
    }),
});
