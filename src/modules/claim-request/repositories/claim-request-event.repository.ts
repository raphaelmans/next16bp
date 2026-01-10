import { eq } from "drizzle-orm";
import {
  type ClaimRequestEventRecord,
  claimRequestEvent,
  type InsertClaimRequestEvent,
} from "@/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/shared/infra/db/types";
import type { RequestContext } from "@/shared/kernel/context";

export interface IClaimRequestEventRepository {
  findByClaimRequestId(
    claimRequestId: string,
    ctx?: RequestContext,
  ): Promise<ClaimRequestEventRecord[]>;
  create(
    data: InsertClaimRequestEvent,
    ctx?: RequestContext,
  ): Promise<ClaimRequestEventRecord>;
}

export class ClaimRequestEventRepository
  implements IClaimRequestEventRepository
{
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async findByClaimRequestId(
    claimRequestId: string,
    ctx?: RequestContext,
  ): Promise<ClaimRequestEventRecord[]> {
    const client = this.getClient(ctx);
    return client
      .select()
      .from(claimRequestEvent)
      .where(eq(claimRequestEvent.claimRequestId, claimRequestId))
      .orderBy(claimRequestEvent.createdAt);
  }

  async create(
    data: InsertClaimRequestEvent,
    ctx?: RequestContext,
  ): Promise<ClaimRequestEventRecord> {
    const client = this.getClient(ctx);
    const result = await client
      .insert(claimRequestEvent)
      .values(data)
      .returning();
    return result[0];
  }
}
