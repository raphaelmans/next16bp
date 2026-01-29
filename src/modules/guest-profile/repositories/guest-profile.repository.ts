import { and, eq, ilike, or } from "drizzle-orm";
import {
  type GuestProfileRecord,
  guestProfile,
  type InsertGuestProfile,
} from "@/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/shared/infra/db/types";
import type { RequestContext } from "@/shared/kernel/context";

export interface IGuestProfileRepository {
  findById(
    id: string,
    ctx?: RequestContext,
  ): Promise<GuestProfileRecord | null>;
  findByOrganizationId(
    organizationId: string,
    options?: { query?: string; limit?: number },
    ctx?: RequestContext,
  ): Promise<GuestProfileRecord[]>;
  create(
    data: InsertGuestProfile,
    ctx?: RequestContext,
  ): Promise<GuestProfileRecord>;
}

export class GuestProfileRepository implements IGuestProfileRepository {
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async findById(
    id: string,
    ctx?: RequestContext,
  ): Promise<GuestProfileRecord | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select()
      .from(guestProfile)
      .where(eq(guestProfile.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async findByOrganizationId(
    organizationId: string,
    options?: { query?: string; limit?: number },
    ctx?: RequestContext,
  ): Promise<GuestProfileRecord[]> {
    const client = this.getClient(ctx);
    const conditions = [
      eq(guestProfile.organizationId, organizationId),
      eq(guestProfile.isActive, true),
    ];

    if (options?.query) {
      const pattern = `%${options.query}%`;
      const searchCondition = or(
        ilike(guestProfile.displayName, pattern),
        ilike(guestProfile.email, pattern),
        ilike(guestProfile.phoneNumber, pattern),
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    return client
      .select()
      .from(guestProfile)
      .where(and(...conditions))
      .limit(options?.limit ?? 50);
  }

  async create(
    data: InsertGuestProfile,
    ctx?: RequestContext,
  ): Promise<GuestProfileRecord> {
    const client = this.getClient(ctx);
    const result = await client.insert(guestProfile).values(data).returning();
    return result[0];
  }
}
