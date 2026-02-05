import { and, eq, ne } from "drizzle-orm";
import {
  type InsertOrganization,
  type OrganizationRecord,
  organization,
} from "@/lib/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/lib/shared/infra/db/types";
import type { RequestContext } from "@/lib/shared/kernel/context";
import { SlugAlreadyExistsError } from "../errors/organization.errors";

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
  slugExists(
    slug: string,
    excludeId?: string,
    ctx?: RequestContext,
  ): Promise<boolean>;
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
    try {
      const result = await client.insert(organization).values(data).returning();

      return result[0];
    } catch (error) {
      const code =
        typeof error === "object" && error && "code" in error
          ? (error as { code?: unknown }).code
          : null;

      if (code === "23505" && data.slug) {
        throw new SlugAlreadyExistsError(data.slug);
      }

      throw error;
    }
  }

  async update(
    id: string,
    data: Partial<InsertOrganization>,
    ctx?: RequestContext,
  ): Promise<OrganizationRecord> {
    const client = this.getClient(ctx);
    try {
      const result = await client
        .update(organization)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(organization.id, id))
        .returning();

      return result[0];
    } catch (error) {
      const code =
        typeof error === "object" && error && "code" in error
          ? (error as { code?: unknown }).code
          : null;

      if (code === "23505" && data.slug) {
        throw new SlugAlreadyExistsError(data.slug);
      }

      throw error;
    }
  }

  async slugExists(
    slug: string,
    excludeId?: string,
    ctx?: RequestContext,
  ): Promise<boolean> {
    const client = this.getClient(ctx);
    const conditions = [eq(organization.slug, slug)];
    if (excludeId) {
      conditions.push(ne(organization.id, excludeId));
    }

    const result = await client
      .select({ id: organization.id })
      .from(organization)
      .where(and(...conditions))
      .limit(1);

    return result.length > 0;
  }
}
