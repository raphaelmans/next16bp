import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { S } from "@/common/schemas";
import {
  protectedProcedure,
  protectedRateLimitedProcedure,
  router,
} from "@/lib/shared/infra/trpc/trpc";
import { makeChatInboxService } from "./factories/chat-inbox.factory";
import { makeChatMessageRepository } from "./factories/reservation-chat.factory";

async function assertThreadAccess(
  viewer: { userId: string; role: "admin" | "member" | "viewer" },
  threadId: string,
) {
  const inboxService = makeChatInboxService();
  const hasAccess = await inboxService.hasThreadAccess(viewer, threadId);

  if (!hasAccess) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not allowed to access this chat thread.",
    });
  }
}

async function filterAccessibleThreadIds(
  viewer: { userId: string; role: "admin" | "member" | "viewer" },
  threadIds: string[],
) {
  const inboxService = makeChatInboxService();
  const uniqueThreadIds = Array.from(new Set(threadIds));

  const accessChecks = await Promise.all(
    uniqueThreadIds.map(async (threadId) => ({
      threadId,
      hasAccess: await inboxService.hasThreadAccess(viewer, threadId),
    })),
  );

  return accessChecks
    .filter((check) => check.hasAccess)
    .map((check) => check.threadId);
}

export const chatMessageRouter = router({
  /**
   * Load messages for a thread, ordered oldest-first.
   * Supports cursor-based pagination via `beforeId`.
   */
  loadMessages: protectedProcedure
    .input(
      z.object({
        threadId: z.string().min(1).max(128),
        limit: z.number().int().min(1).max(100).optional().default(30),
        beforeId: S.ids.generic.optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      await assertThreadAccess(
        { userId: ctx.userId, role: ctx.session.role },
        input.threadId,
      );

      const repo = makeChatMessageRepository();
      const messages = await repo.listByThreadId(input.threadId, {
        limit: input.limit,
        beforeId: input.beforeId,
      });

      return {
        messages: messages.map((m) => ({
          id: m.id,
          threadId: m.threadId,
          senderUserId: m.senderUserId,
          content: m.content,
          attachments: m.attachments,
          createdAt: m.createdAt.toISOString(),
          updatedAt: m.updatedAt.toISOString(),
          deletedAt: m.deletedAt?.toISOString() ?? null,
        })),
      };
    }),

  /**
   * Get unread message counts for multiple threads.
   */
  getUnreadCounts: protectedProcedure
    .input(
      z.object({
        threadIds: z.array(z.string().min(1).max(128)).max(30),
      }),
    )
    .query(async ({ input, ctx }) => {
      const allowedThreadIds = await filterAccessibleThreadIds(
        { userId: ctx.userId, role: ctx.session.role },
        input.threadIds,
      );
      if (allowedThreadIds.length === 0) {
        return { unreadCounts: {} };
      }

      const repo = makeChatMessageRepository();
      const counts = await repo.getUnreadCounts(allowedThreadIds, ctx.userId);

      const result: Record<string, number> = {};
      for (const [threadId, count] of counts.entries()) {
        result[threadId] = count;
      }

      return { unreadCounts: result };
    }),

  /**
   * Mark a thread as read (updates the user's read position to now).
   */
  markRead: protectedRateLimitedProcedure("chatSend")
    .input(
      z.object({
        threadId: z.string().min(1).max(128),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await assertThreadAccess(
        { userId: ctx.userId, role: ctx.session.role },
        input.threadId,
      );

      const repo = makeChatMessageRepository();
      await repo.markRead(input.threadId, ctx.userId);
      return { ok: true };
    }),

  /**
   * List thread summaries (distinct threads with latest message info).
   * Used by inbox views to discover threads by prefix.
   */
  listThreadSummaries: protectedProcedure
    .input(
      z.object({
        threadIdPrefix: z.string().min(1).max(64).optional(),
        limit: z.number().int().min(1).max(50).optional().default(50),
      }),
    )
    .query(async ({ input, ctx }) => {
      const repo = makeChatMessageRepository();
      const summaries = await repo.listThreadSummaries({
        threadIdPrefix: input.threadIdPrefix,
        limit: input.limit,
      });
      const allowedThreadIds = new Set(
        await filterAccessibleThreadIds(
          { userId: ctx.userId, role: ctx.session.role },
          summaries.map((summary) => summary.threadId),
        ),
      );

      return {
        threads: summaries
          .filter((summary) => allowedThreadIds.has(summary.threadId))
          .map((s) => ({
            threadId: s.threadId,
            lastMessageText: s.lastMessageText,
            lastMessageAt: s.lastMessageAt.toISOString(),
          })),
      };
    }),

  /**
   * Send a message directly to a thread.
   * Used for DM/PoC chats where no domain-specific mutation exists.
   */
  sendMessage: protectedRateLimitedProcedure("chatSend")
    .input(
      z.object({
        threadId: z.string().min(1).max(128),
        text: z.string().min(1).max(10000).optional(),
        attachments: z
          .array(
            z.object({
              type: z.string().optional(),
              url: z.string(),
              filename: z.string().optional(),
              mimeType: z.string().optional(),
              fileSize: z.number().optional(),
            }),
          )
          .optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await assertThreadAccess(
        { userId: ctx.userId, role: ctx.session.role },
        input.threadId,
      );

      const repo = makeChatMessageRepository();
      const message = await repo.create({
        threadId: input.threadId,
        senderUserId: ctx.userId,
        content: input.text ?? null,
        attachments:
          input.attachments?.map((a) => ({
            type: a.type,
            url: a.url,
            filename: a.filename,
            mimeType: a.mimeType,
            fileSize: a.fileSize,
          })) ?? [],
      });

      return { id: message.id };
    }),
});
