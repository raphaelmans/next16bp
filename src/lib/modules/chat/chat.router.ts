import { protectedProcedure, router } from "@/lib/shared/infra/trpc/trpc";
import { makeChatService } from "./factories/chat.factory";

export const chatRouter = router({
  getAuth: protectedProcedure.query(async ({ ctx }) => {
    const service = makeChatService();
    return service.getAuth({
      id: ctx.userId,
      name: ctx.session.email || ctx.userId,
    });
  }),
});
