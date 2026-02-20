import { z } from "zod";
import { protectedProcedure, router } from "@/lib/shared/infra/trpc/trpc";
import { makeUserPreferenceService } from "./factories/user-preference.factory";

export const userPreferenceRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    const service = makeUserPreferenceService();
    const preference = await service.findByUserId(ctx.userId);

    return {
      defaultPortal: preference?.defaultPortal ?? "player",
    };
  }),

  setDefaultPortal: protectedProcedure
    .input(
      z.object({
        defaultPortal: z.enum(["player", "owner"]),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const service = makeUserPreferenceService();
      const preference = await service.setDefaultPortal(
        ctx.userId,
        input.defaultPortal,
      );

      return {
        defaultPortal: preference.defaultPortal,
      };
    }),
});
