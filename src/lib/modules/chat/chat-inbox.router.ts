import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  protectedRateLimitedProcedure,
  router,
} from "@/lib/shared/infra/trpc/trpc";
import { AppError } from "@/lib/shared/kernel/errors";
import { makeChatInboxService } from "./factories/chat-inbox.factory";

const ThreadKindSchema = z.enum(["reservation"]);

function handleChatInboxError(error: unknown): never {
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

export const chatInboxRouter = router({
  archiveThread: protectedRateLimitedProcedure("chatSend")
    .input(
      z.object({
        threadKind: ThreadKindSchema,
        threadId: z.string().min(1).max(128),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeChatInboxService();
        return await service.archiveThread(
          { userId: ctx.userId, role: ctx.session.role },
          input,
        );
      } catch (error) {
        handleChatInboxError(error);
      }
    }),

  unarchiveThread: protectedRateLimitedProcedure("chatSend")
    .input(
      z.object({
        threadKind: ThreadKindSchema,
        threadId: z.string().min(1).max(128),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeChatInboxService();
        return await service.unarchiveThread(
          { userId: ctx.userId, role: ctx.session.role },
          input,
        );
      } catch (error) {
        handleChatInboxError(error);
      }
    }),

  listArchivedThreadIds: protectedRateLimitedProcedure("chatSession")
    .input(
      z.object({
        threadKind: ThreadKindSchema,
      }),
    )
    .query(async ({ input, ctx }) => {
      try {
        const service = makeChatInboxService();
        return await service.listArchivedThreadIds(
          { userId: ctx.userId, role: ctx.session.role },
          input,
        );
      } catch (error) {
        handleChatInboxError(error);
      }
    }),
});
