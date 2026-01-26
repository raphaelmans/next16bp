import { eq } from "drizzle-orm";
import {
  type InsertUserPreference,
  type UserPreferenceRecord,
  userPreferences,
} from "@/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/shared/infra/db/types";
import type { RequestContext } from "@/shared/kernel/context";

export interface IUserPreferenceRepository {
  findByUserId(
    userId: string,
    ctx?: RequestContext,
  ): Promise<UserPreferenceRecord | null>;
  upsert(
    data: InsertUserPreference,
    ctx?: RequestContext,
  ): Promise<UserPreferenceRecord>;
}

export class UserPreferenceRepository implements IUserPreferenceRepository {
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async findByUserId(
    userId: string,
    ctx?: RequestContext,
  ): Promise<UserPreferenceRecord | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);

    return result[0] ?? null;
  }

  async upsert(
    data: InsertUserPreference,
    ctx?: RequestContext,
  ): Promise<UserPreferenceRecord> {
    const client = this.getClient(ctx);
    const result = await client
      .insert(userPreferences)
      .values(data)
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: {
          defaultPortal: data.defaultPortal ?? "player",
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  }
}
