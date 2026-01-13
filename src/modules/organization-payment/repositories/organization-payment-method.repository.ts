import { desc, eq } from "drizzle-orm";
import {
  type InsertOrganizationPaymentMethod,
  type OrganizationPaymentMethodRecord,
  organizationPaymentMethod,
} from "@/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/shared/infra/db/types";
import type { RequestContext } from "@/shared/kernel/context";

export interface IOrganizationPaymentMethodRepository {
  findById(
    id: string,
    ctx?: RequestContext,
  ): Promise<OrganizationPaymentMethodRecord | null>;
  findByOrganizationId(
    organizationId: string,
    ctx?: RequestContext,
  ): Promise<OrganizationPaymentMethodRecord[]>;
  create(
    data: InsertOrganizationPaymentMethod,
    ctx?: RequestContext,
  ): Promise<OrganizationPaymentMethodRecord>;
  update(
    id: string,
    data: Partial<InsertOrganizationPaymentMethod>,
    ctx?: RequestContext,
  ): Promise<OrganizationPaymentMethodRecord>;
  delete(id: string, ctx?: RequestContext): Promise<void>;
  clearDefault(organizationId: string, ctx?: RequestContext): Promise<void>;
}

export class OrganizationPaymentMethodRepository
  implements IOrganizationPaymentMethodRepository
{
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async findById(
    id: string,
    ctx?: RequestContext,
  ): Promise<OrganizationPaymentMethodRecord | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select()
      .from(organizationPaymentMethod)
      .where(eq(organizationPaymentMethod.id, id))
      .limit(1);

    return result[0] ?? null;
  }

  async findByOrganizationId(
    organizationId: string,
    ctx?: RequestContext,
  ): Promise<OrganizationPaymentMethodRecord[]> {
    const client = this.getClient(ctx);
    return client
      .select()
      .from(organizationPaymentMethod)
      .where(eq(organizationPaymentMethod.organizationId, organizationId))
      .orderBy(
        desc(organizationPaymentMethod.isDefault),
        organizationPaymentMethod.displayOrder,
        organizationPaymentMethod.createdAt,
      );
  }

  async create(
    data: InsertOrganizationPaymentMethod,
    ctx?: RequestContext,
  ): Promise<OrganizationPaymentMethodRecord> {
    const client = this.getClient(ctx);
    const result = await client
      .insert(organizationPaymentMethod)
      .values(data)
      .returning();

    return result[0];
  }

  async update(
    id: string,
    data: Partial<InsertOrganizationPaymentMethod>,
    ctx?: RequestContext,
  ): Promise<OrganizationPaymentMethodRecord> {
    const client = this.getClient(ctx);
    const result = await client
      .update(organizationPaymentMethod)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(organizationPaymentMethod.id, id))
      .returning();

    return result[0];
  }

  async delete(id: string, ctx?: RequestContext): Promise<void> {
    const client = this.getClient(ctx);
    await client
      .delete(organizationPaymentMethod)
      .where(eq(organizationPaymentMethod.id, id));
  }

  async clearDefault(
    organizationId: string,
    ctx?: RequestContext,
  ): Promise<void> {
    const client = this.getClient(ctx);
    await client
      .update(organizationPaymentMethod)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(eq(organizationPaymentMethod.organizationId, organizationId));
  }
}
