import { publicProcedure, router } from "@/shared/infra/trpc/trpc";
import { GetCourtByIdSchema } from "./dtos";
import { makeCourtDiscoveryService } from "./factories/court.factory";

export const courtRouter = router({
  getById: publicProcedure
    .input(GetCourtByIdSchema)
    .query(async ({ input }) => {
      const service = makeCourtDiscoveryService();
      return service.getCourtById(input.courtId);
    }),
});
