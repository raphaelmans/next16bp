import { and, eq } from "drizzle-orm";
import {
  type ChatInboxArchiveRecord,
  chatInboxArchive,
  type InsertChatInboxArchive,
} from "@/lib/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/lib/shared/infra/db/types";
import type { RequestContext } from "@/lib/shared/kernel/context";

export type ChatInboxThreadKind = "reservation" | "support";

export interface IChatInboxArchiveRepository {
  upsert(
    data: InsertChatInboxArchive,
    ctx?: RequestContext,
  ): Promise<ChatInboxArchiveRecord>;
  removeByThread(
    userId: string,
    threadKind: ChatInboxThreadKind,
    threadId: string,
    ctx?: RequestContext,
  ): Promise<boolean>;
  listThreadIdsByKind(
    userId: string,
    threadKind: ChatInboxThreadKind,
    ctx?: RequestContext,
  ): Promise<string[]>;
}

export class ChatInboxArchiveRepository implements IChatInboxArchiveRepository {
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async upsert(
    data: InsertChatInboxArchive,
    ctx?: RequestContext,
  ): Promise<ChatInboxArchiveRecord> {
    const client = this.getClient(ctx);
    const result = await client
      .insert(chatInboxArchive)
      .values(data)
      .onConflictDoUpdate({
        target: [
          chatInboxArchive.userId,
          chatInboxArchive.threadKind,
          chatInboxArchive.threadId,
        ],
        set: {
          archivedAt: new Date(),
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  }

  async removeByThread(
    userId: string,
    threadKind: ChatInboxThreadKind,
    threadId: string,
    ctx?: RequestContext,
  ): Promise<boolean> {
    const client = this.getClient(ctx);
    const result = await client
      .delete(chatInboxArchive)
      .where(
        and(
          eq(chatInboxArchive.userId, userId),
          eq(chatInboxArchive.threadKind, threadKind),
          eq(chatInboxArchive.threadId, threadId),
        ),
      )
      .returning({ id: chatInboxArchive.id });

    return result.length > 0;
  }

  async listThreadIdsByKind(
    userId: string,
    threadKind: ChatInboxThreadKind,
    ctx?: RequestContext,
  ): Promise<string[]> {
    const client = this.getClient(ctx);
    const rows = await client
      .select({ threadId: chatInboxArchive.threadId })
      .from(chatInboxArchive)
      .where(
        and(
          eq(chatInboxArchive.userId, userId),
          eq(chatInboxArchive.threadKind, threadKind),
        ),
      );

    return rows.map((row) => row.threadId);
  }
}
