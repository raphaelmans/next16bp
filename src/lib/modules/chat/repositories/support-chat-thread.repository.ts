import { eq } from "drizzle-orm";
import {
  type InsertSupportChatThread,
  type SupportChatThreadRecord,
  supportChatThread,
} from "@/lib/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/lib/shared/infra/db/types";
import type { RequestContext } from "@/lib/shared/kernel/context";

export interface ISupportChatThreadRepository {
  findByClaimRequestId(
    claimRequestId: string,
    ctx?: RequestContext,
  ): Promise<SupportChatThreadRecord | null>;
  findByPlaceVerificationRequestId(
    requestId: string,
    ctx?: RequestContext,
  ): Promise<SupportChatThreadRecord | null>;
  upsertClaimThread(
    data: InsertSupportChatThread,
    ctx?: RequestContext,
  ): Promise<SupportChatThreadRecord>;
  upsertVerificationThread(
    data: InsertSupportChatThread,
    ctx?: RequestContext,
  ): Promise<SupportChatThreadRecord>;
}

export class SupportChatThreadRepository
  implements ISupportChatThreadRepository
{
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async findByClaimRequestId(
    claimRequestId: string,
    ctx?: RequestContext,
  ): Promise<SupportChatThreadRecord | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select()
      .from(supportChatThread)
      .where(eq(supportChatThread.claimRequestId, claimRequestId))
      .limit(1);

    return result[0] ?? null;
  }

  async findByPlaceVerificationRequestId(
    requestId: string,
    ctx?: RequestContext,
  ): Promise<SupportChatThreadRecord | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select()
      .from(supportChatThread)
      .where(eq(supportChatThread.placeVerificationRequestId, requestId))
      .limit(1);

    return result[0] ?? null;
  }

  async upsertClaimThread(
    data: InsertSupportChatThread,
    ctx?: RequestContext,
  ): Promise<SupportChatThreadRecord> {
    const client = this.getClient(ctx);
    const result = await client
      .insert(supportChatThread)
      .values(data)
      .onConflictDoUpdate({
        target: supportChatThread.claimRequestId,
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

  async upsertVerificationThread(
    data: InsertSupportChatThread,
    ctx?: RequestContext,
  ): Promise<SupportChatThreadRecord> {
    const client = this.getClient(ctx);
    const result = await client
      .insert(supportChatThread)
      .values(data)
      .onConflictDoUpdate({
        target: supportChatThread.placeVerificationRequestId,
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
