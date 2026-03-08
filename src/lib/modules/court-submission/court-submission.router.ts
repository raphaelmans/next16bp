import { TRPCError } from "@trpc/server";
import { makeGoogleLocService } from "@/lib/modules/google-loc/factories/google-loc.factory";
import {
  protectedProcedure,
  protectedRateLimitedProcedure,
  router,
} from "@/lib/shared/infra/trpc/trpc";
import { AppError } from "@/lib/shared/kernel/errors";
import {
  GetMySubmissionsSchema,
  ParseGoogleMapsLinkSchema,
  SubmitCourtInputSchema,
  UploadSubmissionPhotoSchema,
} from "./court-submission.dto";
import {
  DailySubmissionQuotaExceededError,
  InvalidGoogleMapsLinkError,
  SubmissionNotFoundError,
  UserBannedFromSubmissionsError,
} from "./errors/court-submission.errors";
import { makeCourtSubmissionService } from "./factories/court-submission.factory";

function handleCourtSubmissionError(error: unknown): never {
  if (error instanceof UserBannedFromSubmissionsError) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: error.message,
      cause: error,
    });
  }
  if (error instanceof DailySubmissionQuotaExceededError) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: error.message,
      cause: error,
    });
  }
  if (error instanceof InvalidGoogleMapsLinkError) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: error.message,
      cause: error,
    });
  }
  if (error instanceof SubmissionNotFoundError) {
    throw new TRPCError({
      code: "NOT_FOUND",
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

export const courtSubmissionRouter = router({
  submit: protectedRateLimitedProcedure("mutation")
    .input(SubmitCourtInputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeCourtSubmissionService();
        return await service.submitCourt(ctx.userId, input);
      } catch (error) {
        handleCourtSubmissionError(error);
      }
    }),

  uploadSubmissionPhoto: protectedRateLimitedProcedure("mutation")
    .input(UploadSubmissionPhotoSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeCourtSubmissionService();
        return await service.uploadSubmissionPhoto(
          ctx.userId,
          input.placeId,
          input.image,
        );
      } catch (error) {
        handleCourtSubmissionError(error);
      }
    }),

  getMySubmissions: protectedProcedure
    .input(GetMySubmissionsSchema)
    .query(async ({ input, ctx }) => {
      const service = makeCourtSubmissionService();
      return service.getMySubmissions(ctx.userId, input);
    }),

  parseGoogleMapsLink: protectedRateLimitedProcedure("default")
    .input(ParseGoogleMapsLinkSchema)
    .query(async ({ input }) => {
      try {
        const googleLocService = makeGoogleLocService();
        const result = await googleLocService.preview({ url: input.url });
        return {
          lat: result.lat,
          lng: result.lng,
          suggestedName: result.suggestedName,
          embedSrc: result.embedSrc,
        };
      } catch (error) {
        if (error instanceof AppError) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message,
            cause: error,
          });
        }
        throw error;
      }
    }),
});
