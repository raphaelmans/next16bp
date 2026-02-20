import { and, eq, isNull } from "drizzle-orm";
import {
  type InsertMobilePushToken,
  type MobilePushTokenRecord,
  mobilePushToken,
} from "@/lib/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/lib/shared/infra/db/types";
import type { RequestContext } from "@/lib/shared/kernel/context";

export interface IMobilePushTokenRepository {
  findById(
    id: string,
    ctx?: RequestContext,
  ): Promise<MobilePushTokenRecord | null>;
  upsertByToken(
    data: InsertMobilePushToken,
    ctx?: RequestContext,
  ): Promise<MobilePushTokenRecord>;
  revokeById(
    id: string,
    ctx?: RequestContext,
  ): Promise<MobilePushTokenRecord | null>;
  revokeByTokenForUser(
    userId: string,
    token: string,
    ctx?: RequestContext,
  ): Promise<MobilePushTokenRecord | null>;
  listActiveByUserId(
    userId: string,
    ctx?: RequestContext,
  ): Promise<MobilePushTokenRecord[]>;
}

export class MobilePushTokenRepository implements IMobilePushTokenRepository {
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async findById(
    id: string,
    ctx?: RequestContext,
  ): Promise<MobilePushTokenRecord | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select()
      .from(mobilePushToken)
      .where(eq(mobilePushToken.id, id))
      .limit(1);

    return result[0] ?? null;
  }

  async upsertByToken(
    data: InsertMobilePushToken,
    ctx?: RequestContext,
  ): Promise<MobilePushTokenRecord> {
    const client = this.getClient(ctx);
    const result = await client
      .insert(mobilePushToken)
      .values(data)
      .onConflictDoUpdate({
        target: mobilePushToken.token,
        set: {
          userId: data.userId,
          platform: data.platform,
          revokedAt: null,
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  }

  async revokeById(
    id: string,
    ctx?: RequestContext,
  ): Promise<MobilePushTokenRecord | null> {
    const client = this.getClient(ctx);
    const result = await client
      .update(mobilePushToken)
      .set({ revokedAt: new Date(), updatedAt: new Date() })
      .where(eq(mobilePushToken.id, id))
      .returning();

    return result[0] ?? null;
  }

  async revokeByTokenForUser(
    userId: string,
    token: string,
    ctx?: RequestContext,
  ): Promise<MobilePushTokenRecord | null> {
    const client = this.getClient(ctx);
    const result = await client
      .update(mobilePushToken)
      .set({ revokedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(mobilePushToken.token, token),
          eq(mobilePushToken.userId, userId),
        ),
      )
      .returning();

    return result[0] ?? null;
  }

  async listActiveByUserId(
    userId: string,
    ctx?: RequestContext,
  ): Promise<MobilePushTokenRecord[]> {
    const client = this.getClient(ctx);
    return client
      .select()
      .from(mobilePushToken)
      .where(
        and(
          eq(mobilePushToken.userId, userId),
          isNull(mobilePushToken.revokedAt),
        ),
      );
  }
}
