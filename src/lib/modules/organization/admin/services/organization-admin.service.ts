import { logger } from "@/lib/shared/infra/logger";
import type { AdminSearchOrganizationsDTO } from "../dtos/admin-search-organizations.dto";
import type {
  AdminOrganizationListItem,
  IOrganizationAdminRepository,
} from "../repositories/organization-admin.repository";

export interface IOrganizationAdminService {
  search(
    adminUserId: string,
    filters: AdminSearchOrganizationsDTO,
  ): Promise<{ items: AdminOrganizationListItem[]; total: number }>;
}

export class OrganizationAdminService implements IOrganizationAdminService {
  constructor(
    private organizationAdminRepository: IOrganizationAdminRepository,
  ) {}

  async search(adminUserId: string, filters: AdminSearchOrganizationsDTO) {
    const result = await this.organizationAdminRepository.search(filters);

    logger.info(
      {
        event: "organization.search",
        adminUserId,
        query: filters.query ?? null,
        limit: filters.limit,
        offset: filters.offset,
        total: result.total,
      },
      "Admin searched organizations",
    );

    return result;
  }
}
