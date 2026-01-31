import { rateLimitedProcedure, router } from "@/lib/shared/infra/trpc/trpc";
import { SubmitContactMessageSchema } from "./dtos";
import { makeContactService } from "./factories/contact.factory";

export const contactRouter = router({
  submit: rateLimitedProcedure("sensitive")
    .input(SubmitContactMessageSchema)
    .mutation(async ({ input, ctx }) => {
      const service = makeContactService();
      return service.submitContactMessage(input, {
        userId: ctx.userId,
        requestId: ctx.requestId,
      });
    }),
});
