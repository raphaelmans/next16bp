import {
  protectedRateLimitedProcedure,
  router,
} from "@/lib/shared/infra/trpc/trpc";
import { makeChatService } from "./factories/chat.factory";

export const chatRouter = router({
  getAuth: protectedRateLimitedProcedure("chatSession").query(
    async ({ ctx }) => {
      const service = makeChatService();
      const auth = await service.getAuth({
        id: ctx.userId,
        name: ctx.session.email || ctx.userId,
      });

      ctx.log.info({ event: "chat.auth_issued" }, "Chat auth issued");

      return auth;
    },
  ),
});
