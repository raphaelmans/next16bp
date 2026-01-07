import { eq, and } from "drizzle-orm";
import {
  courtAmenity,
  type CourtAmenityRecord,
  type InsertCourtAmenity,
} from "@/shared/infra/db/schema";
import type { RequestContext } from "@/shared/kernel/context";
import type { DbClient, DrizzleTransaction } from "@/shared/infra/db/types";

export interface ICourtAmenityRepository {
  findByCourtId(
    courtId: string,
    ctx?: RequestContext,
  ): Promise<CourtAmenityRecord[]>;
  findById(
    id: string,
    ctx?: RequestContext,
  ): Promise<CourtAmenityRecord | null>;
  create(
    data: InsertCourtAmenity,
    ctx?: RequestContext,
  ): Promise<CourtAmenityRecord>;
  delete(id: string, ctx?: RequestContext): Promise<void>;
  exists(courtId: string, name: string, ctx?: RequestContext): Promise<boolean>;
}

export class CourtAmenityRepository implements ICourtAmenityRepository {
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async findByCourtId(
    courtId: string,
    ctx?: RequestContext,
  ): Promise<CourtAmenityRecord[]> {
    const client = this.getClient(ctx);
    return client
      .select()
      .from(courtAmenity)
      .where(eq(courtAmenity.courtId, courtId));
  }

  async findById(
    id: string,
    ctx?: RequestContext,
  ): Promise<CourtAmenityRecord | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select()
      .from(courtAmenity)
      .where(eq(courtAmenity.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async create(
    data: InsertCourtAmenity,
    ctx?: RequestContext,
  ): Promise<CourtAmenityRecord> {
    const client = this.getClient(ctx);
    const result = await client.insert(courtAmenity).values(data).returning();
    return result[0];
  }

  async delete(id: string, ctx?: RequestContext): Promise<void> {
    const client = this.getClient(ctx);
    await client.delete(courtAmenity).where(eq(courtAmenity.id, id));
  }

  async exists(
    courtId: string,
    name: string,
    ctx?: RequestContext,
  ): Promise<boolean> {
    const client = this.getClient(ctx);
    const result = await client
      .select({ id: courtAmenity.id })
      .from(courtAmenity)
      .where(
        and(eq(courtAmenity.courtId, courtId), eq(courtAmenity.name, name)),
      )
      .limit(1);
    return result.length > 0;
  }
}
