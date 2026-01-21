import { and, count, eq, ilike, or, type SQL } from "drizzle-orm";
import {
  type OrganizationRecord,
  organization,
} from "@/shared/infra/db/schema";
import type { DbClient } from "@/shared/infra/db/types";
import type { AdminSearchOrganizationsDTO } from "../dtos/admin-search-organizations.dto";

export type AdminOrganizationListItem = Pick<
  OrganizationRecord,
  | "id"
  | "name"
  | "slug"
  | "isActive"
  | "ownerUserId"
  | "createdAt"
  | "updatedAt"
>;

export interface IOrganizationAdminRepository {
  search(
    filters: AdminSearchOrganizationsDTO,
  ): Promise<{ items: AdminOrganizationListItem[]; total: number }>;
}

export class OrganizationAdminRepository
  implements IOrganizationAdminRepository
{
  constructor(private db: DbClient) {}

  async search(
    filters: AdminSearchOrganizationsDTO,
  ): Promise<{ items: AdminOrganizationListItem[]; total: number }> {
    const q = filters.query?.trim();
    const includeInactive = filters.includeInactive ?? false;

    const conditions: SQL[] = [];
    if (!includeInactive) {
      conditions.push(eq(organization.isActive, true));
    }

    if (q) {
      const pattern = `%${q}%`;
      const searchCondition = or(
        ilike(organization.name, pattern),
        ilike(organization.slug, pattern),
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [countRow] = await this.db
      .select({ total: count() })
      .from(organization)
      .where(where);

    const items = await this.db
      .select({
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        isActive: organization.isActive,
        ownerUserId: organization.ownerUserId,
        createdAt: organization.createdAt,
        updatedAt: organization.updatedAt,
      })
      .from(organization)
      .where(where)
      .orderBy(organization.name)
      .limit(filters.limit)
      .offset(filters.offset);

    return { items, total: countRow?.total ?? 0 };
  }
}
