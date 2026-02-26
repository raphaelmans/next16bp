import { and, count, eq, gt, isNull, like, lt, sql } from "drizzle-orm";
import {
  type ChatMessageRecord,
  chatMessage,
  chatThreadReadPosition,
  type InsertChatMessage,
} from "@/lib/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/lib/shared/infra/db/types";
import type { RequestContext } from "@/lib/shared/kernel/context";

export interface IChatMessageRepository {
  create(
    data: InsertChatMessage,
    ctx?: RequestContext,
  ): Promise<ChatMessageRecord>;

  listByThreadId(
    threadId: string,
    options?: { limit?: number; beforeId?: string },
    ctx?: RequestContext,
  ): Promise<ChatMessageRecord[]>;

  getUnreadCount(
    threadId: string,
    userId: string,
    ctx?: RequestContext,
  ): Promise<number>;

  getUnreadCounts(
    threadIds: string[],
    userId: string,
    ctx?: RequestContext,
  ): Promise<Map<string, number>>;

  markRead(
    threadId: string,
    userId: string,
    ctx?: RequestContext,
  ): Promise<void>;

  listThreadSummaries(
    options: { threadIdPrefix?: string; limit?: number },
    ctx?: RequestContext,
  ): Promise<
    Array<{
      threadId: string;
      lastMessageText: string | null;
      lastMessageAt: Date;
    }>
  >;
}

export class ChatMessageRepository implements IChatMessageRepository {
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async create(
    data: InsertChatMessage,
    ctx?: RequestContext,
  ): Promise<ChatMessageRecord> {
    const client = this.getClient(ctx);
    const result = await client.insert(chatMessage).values(data).returning();

    return result[0];
  }

  async listByThreadId(
    threadId: string,
    options?: { limit?: number; beforeId?: string },
    ctx?: RequestContext,
  ): Promise<ChatMessageRecord[]> {
    const client = this.getClient(ctx);
    const limit = options?.limit ?? 30;

    let query = client
      .select()
      .from(chatMessage)
      .where(
        and(eq(chatMessage.threadId, threadId), isNull(chatMessage.deletedAt)),
      )
      .orderBy(sql`${chatMessage.createdAt} DESC`)
      .limit(limit);

    if (options?.beforeId) {
      const beforeMessage = await client
        .select({ createdAt: chatMessage.createdAt })
        .from(chatMessage)
        .where(eq(chatMessage.id, options.beforeId))
        .limit(1);

      if (beforeMessage[0]) {
        query = client
          .select()
          .from(chatMessage)
          .where(
            and(
              eq(chatMessage.threadId, threadId),
              isNull(chatMessage.deletedAt),
              lt(chatMessage.createdAt, beforeMessage[0].createdAt),
            ),
          )
          .orderBy(sql`${chatMessage.createdAt} DESC`)
          .limit(limit);
      }
    }

    const results = await query;
    return results.reverse();
  }

  async getUnreadCount(
    threadId: string,
    userId: string,
    ctx?: RequestContext,
  ): Promise<number> {
    const client = this.getClient(ctx);

    const readPosition = await client
      .select({ lastReadAt: chatThreadReadPosition.lastReadAt })
      .from(chatThreadReadPosition)
      .where(
        and(
          eq(chatThreadReadPosition.threadId, threadId),
          eq(chatThreadReadPosition.userId, userId),
        ),
      )
      .limit(1);

    const lastReadAt = readPosition[0]?.lastReadAt;

    const conditions = [
      eq(chatMessage.threadId, threadId),
      isNull(chatMessage.deletedAt),
    ];

    if (lastReadAt) {
      conditions.push(gt(chatMessage.createdAt, lastReadAt));
    }

    const result = await client
      .select({ count: count() })
      .from(chatMessage)
      .where(and(...conditions));

    return result[0]?.count ?? 0;
  }

  async getUnreadCounts(
    threadIds: string[],
    userId: string,
    ctx?: RequestContext,
  ): Promise<Map<string, number>> {
    if (threadIds.length === 0) return new Map();

    const result = new Map<string, number>();
    for (const threadId of threadIds) {
      const unread = await this.getUnreadCount(threadId, userId, ctx);
      result.set(threadId, unread);
    }
    return result;
  }

  async markRead(
    threadId: string,
    userId: string,
    ctx?: RequestContext,
  ): Promise<void> {
    const client = this.getClient(ctx);

    await client
      .insert(chatThreadReadPosition)
      .values({
        threadId,
        userId,
        lastReadAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [
          chatThreadReadPosition.threadId,
          chatThreadReadPosition.userId,
        ],
        set: {
          lastReadAt: new Date(),
        },
      });
  }

  async listThreadSummaries(
    options: { threadIdPrefix?: string; limit?: number },
    ctx?: RequestContext,
  ): Promise<
    Array<{
      threadId: string;
      lastMessageText: string | null;
      lastMessageAt: Date;
    }>
  > {
    const client = this.getClient(ctx);
    const limit = options.limit ?? 50;

    const conditions = [isNull(chatMessage.deletedAt)];
    if (options.threadIdPrefix) {
      conditions.push(like(chatMessage.threadId, `${options.threadIdPrefix}%`));
    }

    const threads = await client
      .select({
        threadId: chatMessage.threadId,
        lastMessageAt: sql<Date>`MAX(${chatMessage.createdAt})`.as(
          "last_message_at",
        ),
      })
      .from(chatMessage)
      .where(and(...conditions))
      .groupBy(chatMessage.threadId)
      .orderBy(sql`MAX(${chatMessage.createdAt}) DESC`)
      .limit(limit);

    const summaries = await Promise.all(
      threads.map(async (t) => {
        const latestMsg = await client
          .select({ content: chatMessage.content })
          .from(chatMessage)
          .where(
            and(
              eq(chatMessage.threadId, t.threadId),
              isNull(chatMessage.deletedAt),
            ),
          )
          .orderBy(sql`${chatMessage.createdAt} DESC`)
          .limit(1);

        return {
          threadId: t.threadId,
          lastMessageText: latestMsg[0]?.content ?? null,
          lastMessageAt: t.lastMessageAt,
        };
      }),
    );

    return summaries;
  }
}
