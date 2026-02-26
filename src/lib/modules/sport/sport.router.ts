import { publicProcedure, router } from "@/lib/shared/infra/trpc/trpc";
import { makeSportService } from "./factories/sport.factory";

export const sportRouter = router({
  list: publicProcedure.query(async () => {
    const service = makeSportService();
    return service.listSports();
  }),
});
