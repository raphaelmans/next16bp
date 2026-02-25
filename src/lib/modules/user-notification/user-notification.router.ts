import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "@/lib/shared/infra/trpc/trpc";
import { makeUserNotificationService } from "./factories/user-notification.factory";

const ListMyInputSchema = z
  .object({
    limit: z.number().int().min(1).max(50).default(20),
    offset: z.number().int().min(0).default(0),
  })
  .optional();

export const userNotificationRouter = router({
  listMy: protectedProcedure
    .input(ListMyInputSchema)
    .query(async ({ ctx, input }) => {
      const service = makeUserNotificationService();
      const limit = input?.limit ?? 20;
      const offset = input?.offset ?? 0;
      const rows = await service.listMy(
        ctx.userId,
        { limit: limit + 1, offset },
        undefined,
      );

      return {
        items: rows.slice(0, limit),
        limit,
        offset,
        hasMore: rows.length > limit,
      };
    }),

  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const service = makeUserNotificationService();
    const count = await service.getUnreadCount(ctx.userId);
    return { count };
  }),

  markAsRead: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const service = makeUserNotificationService();
      const updated = await service.markAsRead(ctx.userId, input.id);
      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Notification not found",
        });
      }
      return updated;
    }),

  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    const service = makeUserNotificationService();
    return service.markAllAsRead(ctx.userId);
  }),
});
