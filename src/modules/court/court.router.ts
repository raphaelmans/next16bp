import { router, publicProcedure } from "@/shared/infra/trpc/trpc";
import { makeCourtDiscoveryService } from "./factories/court.factory";
import {
  GetCourtByIdSchema,
  SearchCourtsSchema,
  ListCourtsByCitySchema,
} from "./dtos";

export const courtRouter = router({
  /**
   * Get a court by ID with all details
   * Public endpoint - no authentication required
   */
  getById: publicProcedure
    .input(GetCourtByIdSchema)
    .query(async ({ input }) => {
      const courtDiscoveryService = makeCourtDiscoveryService();
      return courtDiscoveryService.getCourtById(input.id);
    }),

  /**
   * Search courts with filters
   * Public endpoint - no authentication required
   */
  search: publicProcedure.input(SearchCourtsSchema).query(async ({ input }) => {
    const courtDiscoveryService = makeCourtDiscoveryService();
    return courtDiscoveryService.searchCourts(input);
  }),

  /**
   * List courts by city (simplified search)
   * Public endpoint - no authentication required
   */
  listByCity: publicProcedure
    .input(ListCourtsByCitySchema)
    .query(async ({ input }) => {
      const courtDiscoveryService = makeCourtDiscoveryService();
      return courtDiscoveryService.listCourtsByCity(input);
    }),
});
