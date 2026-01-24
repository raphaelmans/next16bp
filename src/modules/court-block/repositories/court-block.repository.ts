import { and, gt, inArray, lt } from "drizzle-orm";
import { type CourtBlockRecord, courtBlock } from "@/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/shared/infra/db/types";
import type { RequestContext } from "@/shared/kernel/context";

export interface ICourtBlockRepository {
  findOverlappingByCourtIds(
    courtIds: string[],
    startTime: Date,
    endTime: Date,
    ctx?: RequestContext,
  ): Promise<CourtBlockRecord[]>;
}

export class CourtBlockRepository implements ICourtBlockRepository {
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async findOverlappingByCourtIds(
    courtIds: string[],
    startTime: Date,
    endTime: Date,
    ctx?: RequestContext,
  ): Promise<CourtBlockRecord[]> {
    const client = this.getClient(ctx);
    if (courtIds.length === 0) return [];

    return client
      .select()
      .from(courtBlock)
      .where(
        and(
          inArray(courtBlock.courtId, courtIds),
          lt(courtBlock.startTime, endTime),
          gt(courtBlock.endTime, startTime),
        ),
      );
  }
}
