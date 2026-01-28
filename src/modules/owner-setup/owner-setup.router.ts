import { protectedProcedure, router } from "@/shared/infra/trpc/trpc";
import { makeOwnerSetupStatusUseCase } from "./factories/owner-setup.factory";

export const ownerSetupRouter = router({
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const useCase = makeOwnerSetupStatusUseCase();
    return useCase.execute(ctx.userId);
  }),
});
