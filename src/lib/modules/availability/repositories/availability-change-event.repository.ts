import {
  type AvailabilityChangeEventRecord,
  availabilityChangeEvent,
  type InsertAvailabilityChangeEvent,
} from "@/lib/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/lib/shared/infra/db/types";
import type { RequestContext } from "@/lib/shared/kernel/context";

export interface IAvailabilityChangeEventRepository {
  create(
    data: InsertAvailabilityChangeEvent,
    ctx?: RequestContext,
  ): Promise<AvailabilityChangeEventRecord>;
  createMany(
    data: InsertAvailabilityChangeEvent[],
    ctx?: RequestContext,
  ): Promise<AvailabilityChangeEventRecord[]>;
}

export class AvailabilityChangeEventRepository
  implements IAvailabilityChangeEventRepository
{
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async create(
    data: InsertAvailabilityChangeEvent,
    ctx?: RequestContext,
  ): Promise<AvailabilityChangeEventRecord> {
    const client = this.getClient(ctx);
    const result = await client
      .insert(availabilityChangeEvent)
      .values(data)
      .returning();
    return result[0];
  }

  async createMany(
    data: InsertAvailabilityChangeEvent[],
    ctx?: RequestContext,
  ): Promise<AvailabilityChangeEventRecord[]> {
    if (data.length === 0) return [];
    const client = this.getClient(ctx);
    return client.insert(availabilityChangeEvent).values(data).returning();
  }
}
