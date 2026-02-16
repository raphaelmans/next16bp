import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { S } from "@/common/schemas";
import {
  adminRateLimitedProcedure,
  protectedRateLimitedProcedure,
  router,
} from "@/lib/shared/infra/trpc/trpc";
import { AppError } from "@/lib/shared/kernel/errors";
import { makeSupportChatService } from "./factories/support-chat.factory";
import { SendChatMessageSchema } from "./schemas/send-chat-message.schema";

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
  backfillClaimThreads: adminRateLimitedProcedure("sensitive").mutation(
    async ({ ctx }) => {
      try {
        const service = makeSupportChatService();
        return await service.backfillPendingClaimThreads({
          createdByUserId: ctx.userId,
        });
      } catch (error) {
        handleSupportChatError(error);
      }
    },
  ),

  getClaimSession: protectedRateLimitedProcedure("chatSession")
    .input(
      z.object({
        claimRequestId: S.ids.generic,
      }),
    )
    .query(async ({ input, ctx }) => {
      try {
        const service = makeSupportChatService();
        const session = await service.getClaimSession({
          viewerUserId: ctx.userId,
          viewer: { id: ctx.userId, name: ctx.session.email || ctx.userId },
          claimRequestId: input.claimRequestId,
          ctx,
        });

        ctx.log.info(
          {
            event: "support_chat.claim_session_issued",
            claimRequestId: input.claimRequestId,
          },
          "Support claim chat session issued",
        );

        return session;
      } catch (error) {
        handleSupportChatError(error);
      }
    }),

  getVerificationSession: protectedRateLimitedProcedure("chatSession")
    .input(
      z.object({
        placeVerificationRequestId: S.ids.generic,
      }),
    )
    .query(async ({ input, ctx }) => {
      try {
        const service = makeSupportChatService();
        const session = await service.getVerificationSession({
          viewerUserId: ctx.userId,
          viewer: { id: ctx.userId, name: ctx.session.email || ctx.userId },
          placeVerificationRequestId: input.placeVerificationRequestId,
          ctx,
        });

        ctx.log.info(
          {
            event: "support_chat.verification_session_issued",
            placeVerificationRequestId: input.placeVerificationRequestId,
          },
          "Support verification chat session issued",
        );

        return session;
      } catch (error) {
        handleSupportChatError(error);
      }
    }),

  sendClaimMessage: protectedRateLimitedProcedure("chatSend")
    .input(
      z
        .object({
          claimRequestId: S.ids.generic,
        })
        .merge(SendChatMessageSchema),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeSupportChatService();
        await service.sendClaimMessage({
          viewerUserId: ctx.userId,
          claimRequestId: input.claimRequestId,
          text: input.text,
          attachments: input.attachments,
          ctx,
        });

        return { ok: true };
      } catch (error) {
        handleSupportChatError(error);
      }
    }),

  sendVerificationMessage: protectedRateLimitedProcedure("chatSend")
    .input(
      z
        .object({
          placeVerificationRequestId: S.ids.generic,
        })
        .merge(SendChatMessageSchema),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeSupportChatService();
        await service.sendVerificationMessage({
          viewerUserId: ctx.userId,
          placeVerificationRequestId: input.placeVerificationRequestId,
          text: input.text,
          attachments: input.attachments,
          ctx,
        });

        return { ok: true };
      } catch (error) {
        handleSupportChatError(error);
      }
    }),
});
