import { eq, and, ne } from "drizzle-orm";
import {
  organization,
  type OrganizationRecord,
  type InsertOrganization,
} from "@/shared/infra/db/schema";
import type { RequestContext } from "@/shared/kernel/context";
import type { DbClient, DrizzleTransaction } from "@/shared/infra/db/types";

export interface IOrganizationRepository {
  findById(
    id: string,
    ctx?: RequestContext,
  ): Promise<OrganizationRecord | null>;
  findBySlug(
    slug: string,
    ctx?: RequestContext,
  ): Promise<OrganizationRecord | null>;
  findByOwnerId(
    ownerId: string,
    ctx?: RequestContext,
  ): Promise<OrganizationRecord[]>;
  create(
    data: InsertOrganization,
    ctx?: RequestContext,
  ): Promise<OrganizationRecord>;
  update(
    id: string,
    data: Partial<InsertOrganization>,
    ctx?: RequestContext,
  ): Promise<OrganizationRecord>;
  slugExists(slug: string, excludeId?: string): Promise<boolean>;
}

export class OrganizationRepository implements IOrganizationRepository {
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async findById(
    id: string,
    ctx?: RequestContext,
  ): Promise<OrganizationRecord | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select()
      .from(organization)
      .where(eq(organization.id, id))
      .limit(1);

    return result[0] ?? null;
  }

  async findBySlug(
    slug: string,
    ctx?: RequestContext,
  ): Promise<OrganizationRecord | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select()
      .from(organization)
      .where(eq(organization.slug, slug))
      .limit(1);

    return result[0] ?? null;
  }

  async findByOwnerId(
    ownerId: string,
    ctx?: RequestContext,
  ): Promise<OrganizationRecord[]> {
    const client = this.getClient(ctx);
    const result = await client
      .select()
      .from(organization)
      .where(eq(organization.ownerUserId, ownerId));

    return result;
  }

  async create(
    data: InsertOrganization,
    ctx?: RequestContext,
  ): Promise<OrganizationRecord> {
    const client = this.getClient(ctx);
    const result = await client.insert(organization).values(data).returning();

    return result[0];
  }

  async update(
    id: string,
    data: Partial<InsertOrganization>,
    ctx?: RequestContext,
  ): Promise<OrganizationRecord> {
    const client = this.getClient(ctx);
    const result = await client
      .update(organization)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(organization.id, id))
      .returning();

    return result[0];
  }

  async slugExists(slug: string, excludeId?: string): Promise<boolean> {
    const conditions = [eq(organization.slug, slug)];
    if (excludeId) {
      conditions.push(ne(organization.id, excludeId));
    }

    const result = await this.db
      .select({ id: organization.id })
      .from(organization)
      .where(and(...conditions))
      .limit(1);

    return result.length > 0;
  }
}
