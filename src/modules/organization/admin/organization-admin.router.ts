import { adminProcedure, router } from "@/shared/infra/trpc/trpc";
import { makeOrganizationAdminService } from "../factories/organization.factory";
import { AdminSearchOrganizationsSchema } from "./dtos/admin-search-organizations.dto";

export const organizationAdminRouter = router({
  search: adminProcedure
    .input(AdminSearchOrganizationsSchema)
    .query(async ({ input, ctx }) => {
      const service = makeOrganizationAdminService();
      return service.search(ctx.userId, input);
    }),
});
