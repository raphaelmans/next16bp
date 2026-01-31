import { publicProcedure, router } from "@/lib/shared/infra/trpc/trpc";
import { ListSportsSchema } from "./dtos";
import { makeSportService } from "./factories/sport.factory";

export const sportRouter = router({
  list: publicProcedure.input(ListSportsSchema).query(async () => {
    const service = makeSportService();
    return service.listSports();
  }),
});
