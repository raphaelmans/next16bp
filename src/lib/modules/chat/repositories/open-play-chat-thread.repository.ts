import { eq } from "drizzle-orm";
import {
  type InsertOpenPlayChatThread,
  type OpenPlayChatThreadRecord,
  openPlayChatThread,
} from "@/lib/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/lib/shared/infra/db/types";
import type { RequestContext } from "@/lib/shared/kernel/context";

export interface IOpenPlayChatThreadRepository {
  findByOpenPlayId(
    openPlayId: string,
    ctx?: RequestContext,
  ): Promise<OpenPlayChatThreadRecord | null>;
  upsert(
    data: InsertOpenPlayChatThread,
    ctx?: RequestContext,
  ): Promise<OpenPlayChatThreadRecord>;
}

export class OpenPlayChatThreadRepository
  implements IOpenPlayChatThreadRepository
{
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async findByOpenPlayId(
    openPlayId: string,
    ctx?: RequestContext,
  ): Promise<OpenPlayChatThreadRecord | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select()
      .from(openPlayChatThread)
      .where(eq(openPlayChatThread.openPlayId, openPlayId))
      .limit(1);

    return result[0] ?? null;
  }

  async upsert(
    data: InsertOpenPlayChatThread,
    ctx?: RequestContext,
  ): Promise<OpenPlayChatThreadRecord> {
    const client = this.getClient(ctx);

    const result = await client
      .insert(openPlayChatThread)
      .values(data)
      .onConflictDoUpdate({
        target: openPlayChatThread.openPlayId,
        set: {
          providerId: data.providerId,
          providerChannelType: data.providerChannelType,
          providerChannelId: data.providerChannelId,
          createdByUserId: data.createdByUserId,
        },
      })
      .returning();

    return result[0];
  }
}
