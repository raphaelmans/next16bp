import { rateLimitedProcedure, router } from "@/lib/shared/infra/trpc/trpc";
import { makeSportService } from "./factories/sport.factory";

export const sportRouter = router({
  list: rateLimitedProcedure("publicDiscoveryRead").query(async () => {
    const service = makeSportService();
    return service.listSports();
  }),
});
