import { eq } from "drizzle-orm";
import {
  type InsertOrganizationProfile,
  type OrganizationProfileRecord,
  organizationProfile,
} from "@/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/shared/infra/db/types";
import type { RequestContext } from "@/shared/kernel/context";

export interface IOrganizationProfileRepository {
  findByOrganizationId(
    orgId: string,
    ctx?: RequestContext,
  ): Promise<OrganizationProfileRecord | null>;
  create(
    data: InsertOrganizationProfile,
    ctx?: RequestContext,
  ): Promise<OrganizationProfileRecord>;
  update(
    id: string,
    data: Partial<InsertOrganizationProfile>,
    ctx?: RequestContext,
  ): Promise<OrganizationProfileRecord>;
}

export class OrganizationProfileRepository
  implements IOrganizationProfileRepository
{
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async findByOrganizationId(
    orgId: string,
    ctx?: RequestContext,
  ): Promise<OrganizationProfileRecord | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select()
      .from(organizationProfile)
      .where(eq(organizationProfile.organizationId, orgId))
      .limit(1);

    return result[0] ?? null;
  }

  async create(
    data: InsertOrganizationProfile,
    ctx?: RequestContext,
  ): Promise<OrganizationProfileRecord> {
    const client = this.getClient(ctx);
    const result = await client
      .insert(organizationProfile)
      .values(data)
      .returning();

    return result[0];
  }

  async update(
    id: string,
    data: Partial<InsertOrganizationProfile>,
    ctx?: RequestContext,
  ): Promise<OrganizationProfileRecord> {
    const client = this.getClient(ctx);
    const result = await client
      .update(organizationProfile)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(organizationProfile.id, id))
      .returning();

    return result[0];
  }
}
