import { and, count, desc, eq, isNull } from "drizzle-orm";
import {
  type InsertUserNotification,
  type UserNotificationRecord,
  userNotification,
} from "@/lib/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/lib/shared/infra/db/types";
import type { RequestContext } from "@/lib/shared/kernel/context";

export type UserNotificationListOptions = {
  limit: number;
  offset: number;
};

export interface IUserNotificationRepository {
  createMany(
    data: InsertUserNotification[],
    ctx?: RequestContext,
  ): Promise<UserNotificationRecord[]>;
  listByUserId(
    userId: string,
    options: UserNotificationListOptions,
    ctx?: RequestContext,
  ): Promise<UserNotificationRecord[]>;
  countUnreadByUserId(userId: string, ctx?: RequestContext): Promise<number>;
  markAsRead(
    id: string,
    userId: string,
    ctx?: RequestContext,
  ): Promise<UserNotificationRecord | null>;
  markAllAsRead(
    userId: string,
    ctx?: RequestContext,
  ): Promise<{ count: number }>;
}

export class UserNotificationRepository implements IUserNotificationRepository {
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async createMany(
    data: InsertUserNotification[],
    ctx?: RequestContext,
  ): Promise<UserNotificationRecord[]> {
    if (!data.length) return [];

    const client = this.getClient(ctx);
    return client
      .insert(userNotification)
      .values(data)
      .onConflictDoNothing({
        target: userNotification.idempotencyKey,
      })
      .returning();
  }

  async listByUserId(
    userId: string,
    options: UserNotificationListOptions,
    ctx?: RequestContext,
  ): Promise<UserNotificationRecord[]> {
    const client = this.getClient(ctx);
    return client
      .select()
      .from(userNotification)
      .where(eq(userNotification.userId, userId))
      .orderBy(desc(userNotification.createdAt))
      .limit(options.limit)
      .offset(options.offset);
  }

  async countUnreadByUserId(
    userId: string,
    ctx?: RequestContext,
  ): Promise<number> {
    const client = this.getClient(ctx);
    const result = await client
      .select({ count: count() })
      .from(userNotification)
      .where(
        and(
          eq(userNotification.userId, userId),
          isNull(userNotification.readAt),
        ),
      );

    return result[0]?.count ?? 0;
  }

  async markAsRead(
    id: string,
    userId: string,
    ctx?: RequestContext,
  ): Promise<UserNotificationRecord | null> {
    const client = this.getClient(ctx);
    const result = await client
      .update(userNotification)
      .set({
        readAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(eq(userNotification.id, id), eq(userNotification.userId, userId)),
      )
      .returning();

    return result[0] ?? null;
  }

  async markAllAsRead(
    userId: string,
    ctx?: RequestContext,
  ): Promise<{ count: number }> {
    const client = this.getClient(ctx);
    const result = await client
      .update(userNotification)
      .set({
        readAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(userNotification.userId, userId),
          isNull(userNotification.readAt),
        ),
      )
      .returning({ id: userNotification.id });

    return { count: result.length };
  }
}
