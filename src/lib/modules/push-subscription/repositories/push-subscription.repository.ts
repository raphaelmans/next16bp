import { and, eq, isNull } from "drizzle-orm";
import {
  type InsertPushSubscription,
  type PushSubscriptionRecord,
  pushSubscription,
} from "@/lib/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/lib/shared/infra/db/types";
import type { RequestContext } from "@/lib/shared/kernel/context";

export interface IPushSubscriptionRepository {
  findById(
    id: string,
    ctx?: RequestContext,
  ): Promise<PushSubscriptionRecord | null>;
  listActiveByUserId(
    userId: string,
    ctx?: RequestContext,
  ): Promise<PushSubscriptionRecord[]>;
  upsertByEndpoint(
    data: InsertPushSubscription,
    ctx?: RequestContext,
  ): Promise<PushSubscriptionRecord>;
  revokeByIdForUser(
    userId: string,
    subscriptionId: string,
    ctx?: RequestContext,
  ): Promise<PushSubscriptionRecord | null>;
  revokeByEndpointForUser(
    userId: string,
    endpoint: string,
    ctx?: RequestContext,
  ): Promise<PushSubscriptionRecord | null>;
  revokeById(
    subscriptionId: string,
    ctx?: RequestContext,
  ): Promise<PushSubscriptionRecord | null>;
}

export class PushSubscriptionRepository implements IPushSubscriptionRepository {
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async findById(
    id: string,
    ctx?: RequestContext,
  ): Promise<PushSubscriptionRecord | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select()
      .from(pushSubscription)
      .where(eq(pushSubscription.id, id))
      .limit(1);

    return result[0] ?? null;
  }

  async listActiveByUserId(
    userId: string,
    ctx?: RequestContext,
  ): Promise<PushSubscriptionRecord[]> {
    const client = this.getClient(ctx);
    return client
      .select()
      .from(pushSubscription)
      .where(
        and(
          eq(pushSubscription.userId, userId),
          isNull(pushSubscription.revokedAt),
        ),
      );
  }

  async upsertByEndpoint(
    data: InsertPushSubscription,
    ctx?: RequestContext,
  ): Promise<PushSubscriptionRecord> {
    const client = this.getClient(ctx);
    const result = await client
      .insert(pushSubscription)
      .values(data)
      .onConflictDoUpdate({
        target: pushSubscription.endpoint,
        set: {
          userId: data.userId,
          p256dh: data.p256dh,
          auth: data.auth,
          expirationTime: data.expirationTime ?? null,
          userAgent: data.userAgent ?? null,
          revokedAt: null,
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  }

  async revokeByIdForUser(
    userId: string,
    subscriptionId: string,
    ctx?: RequestContext,
  ): Promise<PushSubscriptionRecord | null> {
    const client = this.getClient(ctx);
    const result = await client
      .update(pushSubscription)
      .set({ revokedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(pushSubscription.id, subscriptionId),
          eq(pushSubscription.userId, userId),
        ),
      )
      .returning();

    return result[0] ?? null;
  }

  async revokeByEndpointForUser(
    userId: string,
    endpoint: string,
    ctx?: RequestContext,
  ): Promise<PushSubscriptionRecord | null> {
    const client = this.getClient(ctx);
    const result = await client
      .update(pushSubscription)
      .set({ revokedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(pushSubscription.endpoint, endpoint),
          eq(pushSubscription.userId, userId),
        ),
      )
      .returning();

    return result[0] ?? null;
  }

  async revokeById(
    subscriptionId: string,
    ctx?: RequestContext,
  ): Promise<PushSubscriptionRecord | null> {
    const client = this.getClient(ctx);
    const result = await client
      .update(pushSubscription)
      .set({ revokedAt: new Date(), updatedAt: new Date() })
      .where(eq(pushSubscription.id, subscriptionId))
      .returning();

    return result[0] ?? null;
  }
}
