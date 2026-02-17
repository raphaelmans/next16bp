import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { S } from "@/common/schemas";
import {
  protectedRateLimitedProcedure,
  router,
} from "@/lib/shared/infra/trpc/trpc";
import {
  AuthorizationError,
  BusinessRuleError,
  NotFoundError,
  ValidationError,
} from "@/lib/shared/kernel/errors";
import { makeOpenPlayChatService } from "./factories/open-play-chat.factory";
import { SendChatMessageSchema } from "./schemas/send-chat-message.schema";

function handleOpenPlayChatError(error: unknown): never {
  if (error instanceof NotFoundError) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: error.message,
      cause: error,
    });
  }
  if (error instanceof AuthorizationError) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: error.message,
      cause: error,
    });
  }
  if (error instanceof ValidationError || error instanceof BusinessRuleError) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: error.message,
      cause: error,
    });
  }

  throw error;
}

export const openPlayChatRouter = router({
  getSession: protectedRateLimitedProcedure("chatSession")
    .input(
      z.object({
        openPlayId: S.ids.generic,
      }),
    )
    .query(async ({ input, ctx }) => {
      try {
        const service = makeOpenPlayChatService();
        return await service.getSession(ctx.userId, input.openPlayId, {
          id: ctx.userId,
          name: ctx.session.email || ctx.userId,
        });
      } catch (error) {
        handleOpenPlayChatError(error);
      }
    }),

  sendMessage: protectedRateLimitedProcedure("chatSend")
    .input(
      z
        .object({
          openPlayId: S.ids.generic,
        })
        .merge(SendChatMessageSchema),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeOpenPlayChatService();
        await service.sendMessage(ctx.userId, input.openPlayId, {
          text: input.text,
          attachments: input.attachments,
        });
        return { ok: true };
      } catch (error) {
        handleOpenPlayChatError(error);
      }
    }),
});
