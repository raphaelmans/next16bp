import { eq } from "drizzle-orm";
import {
  type InsertProfile,
  type ProfileRecord,
  profile,
} from "@/lib/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/lib/shared/infra/db/types";
import type { RequestContext } from "@/lib/shared/kernel/context";

export interface IProfileRepository {
  findById(id: string, ctx?: RequestContext): Promise<ProfileRecord | null>;
  findByUserId(
    userId: string,
    ctx?: RequestContext,
  ): Promise<ProfileRecord | null>;
  create(data: InsertProfile, ctx?: RequestContext): Promise<ProfileRecord>;
  update(
    id: string,
    data: Partial<InsertProfile>,
    ctx?: RequestContext,
  ): Promise<ProfileRecord>;
}

export class ProfileRepository implements IProfileRepository {
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async findById(
    id: string,
    ctx?: RequestContext,
  ): Promise<ProfileRecord | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select()
      .from(profile)
      .where(eq(profile.id, id))
      .limit(1);

    return result[0] ?? null;
  }

  async findByUserId(
    userId: string,
    ctx?: RequestContext,
  ): Promise<ProfileRecord | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select()
      .from(profile)
      .where(eq(profile.userId, userId))
      .limit(1);

    return result[0] ?? null;
  }

  async create(
    data: InsertProfile,
    ctx?: RequestContext,
  ): Promise<ProfileRecord> {
    const client = this.getClient(ctx);
    const result = await client.insert(profile).values(data).returning();

    return result[0];
  }

  async update(
    id: string,
    data: Partial<InsertProfile>,
    ctx?: RequestContext,
  ): Promise<ProfileRecord> {
    const client = this.getClient(ctx);
    const result = await client
      .update(profile)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(profile.id, id))
      .returning();

    return result[0];
  }
}
