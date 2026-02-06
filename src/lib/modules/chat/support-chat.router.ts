import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { S } from "@/common/schemas";
import { protectedProcedure, router } from "@/lib/shared/infra/trpc/trpc";
import { AppError } from "@/lib/shared/kernel/errors";
import { makeSupportChatService } from "./factories/support-chat.factory";

function handleSupportChatError(error: unknown): never {
  if (error instanceof AppError) {
    const code =
      error.httpStatus === 404
        ? "NOT_FOUND"
        : error.httpStatus === 403
          ? "FORBIDDEN"
          : "BAD_REQUEST";

    throw new TRPCError({
      code,
      message: error.message,
      cause: error,
    });
  }

  throw error;
}

export const supportChatRouter = router({
  getClaimSession: protectedProcedure
    .input(
      z.object({
        claimRequestId: S.ids.generic,
      }),
    )
    .query(async ({ input, ctx }) => {
      try {
        const service = makeSupportChatService();
        return await service.getClaimSession({
          viewerUserId: ctx.userId,
          viewer: { id: ctx.userId, name: ctx.session.email || ctx.userId },
          claimRequestId: input.claimRequestId,
          ctx,
        });
      } catch (error) {
        handleSupportChatError(error);
      }
    }),

  getVerificationSession: protectedProcedure
    .input(
      z.object({
        placeVerificationRequestId: S.ids.generic,
      }),
    )
    .query(async ({ input, ctx }) => {
      try {
        const service = makeSupportChatService();
        return await service.getVerificationSession({
          viewerUserId: ctx.userId,
          viewer: { id: ctx.userId, name: ctx.session.email || ctx.userId },
          placeVerificationRequestId: input.placeVerificationRequestId,
          ctx,
        });
      } catch (error) {
        handleSupportChatError(error);
      }
    }),
});
