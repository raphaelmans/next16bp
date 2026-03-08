import { eq } from "drizzle-orm";
import {
  type CourtSubmissionBanRecord,
  courtSubmissionBan,
  type InsertCourtSubmissionBan,
} from "@/lib/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/lib/shared/infra/db/types";
import type { RequestContext } from "@/lib/shared/kernel/context";

export class CourtSubmissionBanRepository {
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async create(
    data: InsertCourtSubmissionBan,
    ctx?: RequestContext,
  ): Promise<CourtSubmissionBanRecord> {
    const client = this.getClient(ctx);
    const result = await client
      .insert(courtSubmissionBan)
      .values(data)
      .returning();
    return result[0];
  }

  async deleteByUserId(userId: string, ctx?: RequestContext): Promise<void> {
    const client = this.getClient(ctx);
    await client
      .delete(courtSubmissionBan)
      .where(eq(courtSubmissionBan.userId, userId));
  }

  async findByUserId(
    userId: string,
    ctx?: RequestContext,
  ): Promise<CourtSubmissionBanRecord | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select()
      .from(courtSubmissionBan)
      .where(eq(courtSubmissionBan.userId, userId))
      .limit(1);
    return result[0] ?? null;
  }
}
