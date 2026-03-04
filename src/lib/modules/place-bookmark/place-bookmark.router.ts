import { z } from "zod";
import { protectedProcedure, router } from "@/lib/shared/infra/trpc/trpc";
import { makePlaceBookmarkService } from "./factories/place-bookmark.factory";

export const placeBookmarkRouter = router({
  toggle: protectedProcedure
    .input(z.object({ placeId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const service = makePlaceBookmarkService();
      return service.toggle(ctx.userId, input.placeId);
    }),

  isBookmarked: protectedProcedure
    .input(z.object({ placeId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const service = makePlaceBookmarkService();
      const bookmarked = await service.isBookmarked(ctx.userId, input.placeId);
      return { bookmarked };
    }),

  getBookmarkedPlaceIds: protectedProcedure
    .input(z.object({ placeIds: z.array(z.string().uuid()).max(50) }))
    .query(async ({ input, ctx }) => {
      const service = makePlaceBookmarkService();
      const placeIds = await service.getBookmarkedPlaceIds(
        ctx.userId,
        input.placeIds,
      );
      return { placeIds };
    }),

  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(50).default(20),
        offset: z.number().int().min(0).default(0),
      }),
    )
    .query(async ({ input, ctx }) => {
      const service = makePlaceBookmarkService();
      return service.listBookmarks(ctx.userId, input);
    }),
});
