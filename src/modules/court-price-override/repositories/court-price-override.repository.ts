import { and, gt, inArray, lt } from "drizzle-orm";
import {
  type CourtPriceOverrideRecord,
  courtPriceOverride,
} from "@/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/shared/infra/db/types";
import type { RequestContext } from "@/shared/kernel/context";

export interface ICourtPriceOverrideRepository {
  findOverlappingByCourtIds(
    courtIds: string[],
    startTime: Date,
    endTime: Date,
    ctx?: RequestContext,
  ): Promise<CourtPriceOverrideRecord[]>;
}

export class CourtPriceOverrideRepository
  implements ICourtPriceOverrideRepository
{
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async findOverlappingByCourtIds(
    courtIds: string[],
    startTime: Date,
    endTime: Date,
    ctx?: RequestContext,
  ): Promise<CourtPriceOverrideRecord[]> {
    const client = this.getClient(ctx);
    if (courtIds.length === 0) return [];

    return client
      .select()
      .from(courtPriceOverride)
      .where(
        and(
          inArray(courtPriceOverride.courtId, courtIds),
          lt(courtPriceOverride.startTime, endTime),
          gt(courtPriceOverride.endTime, startTime),
        ),
      );
  }
}
