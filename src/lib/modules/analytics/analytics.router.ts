import { protectedProcedure, router } from "@/lib/shared/infra/trpc/trpc";
import { AnalyticsInputSchema } from "./dtos/analytics.dto";
import { makeAnalyticsService } from "./factories/analytics.factory";

export const analyticsRouter = router({
  getRevenue: protectedProcedure
    .input(AnalyticsInputSchema)
    .query(async ({ input }) => {
      const service = makeAnalyticsService();
      return service.getRevenue(input);
    }),

  getUtilization: protectedProcedure
    .input(AnalyticsInputSchema)
    .query(async ({ input }) => {
      const service = makeAnalyticsService();
      return service.getUtilization(input);
    }),

  getOperations: protectedProcedure
    .input(AnalyticsInputSchema)
    .query(async ({ input }) => {
      const service = makeAnalyticsService();
      return service.getOperations(input);
    }),
});
