import { and, eq } from "drizzle-orm";
import {
  type CourtRecord,
  court,
  type InsertCourt,
  type SportRecord,
  sport,
} from "@/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/shared/infra/db/types";
import type { RequestContext } from "@/shared/kernel/context";

export interface CourtWithSport {
  court: CourtRecord;
  sport: SportRecord;
}

export interface ICourtRepository {
  findById(id: string, ctx?: RequestContext): Promise<CourtRecord | null>;
  findByIdForUpdate(
    id: string,
    ctx: RequestContext,
  ): Promise<CourtRecord | null>;
  findByIdWithSport(
    id: string,
    ctx?: RequestContext,
  ): Promise<CourtWithSport | null>;
  findByPlaceId(placeId: string, ctx?: RequestContext): Promise<CourtRecord[]>;
  findByPlaceWithSport(
    placeId: string,
    ctx?: RequestContext,
  ): Promise<CourtWithSport[]>;
  findByPlaceAndSport(
    placeId: string,
    sportId: string,
    ctx?: RequestContext,
  ): Promise<CourtRecord[]>;
  create(data: InsertCourt, ctx?: RequestContext): Promise<CourtRecord>;
  update(
    id: string,
    data: Partial<InsertCourt>,
    ctx?: RequestContext,
  ): Promise<CourtRecord>;
}

export class CourtRepository implements ICourtRepository {
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async findById(
    id: string,
    ctx?: RequestContext,
  ): Promise<CourtRecord | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select()
      .from(court)
      .where(eq(court.id, id))
      .limit(1);

    return result[0] ?? null;
  }

  async findByIdForUpdate(
    id: string,
    ctx: RequestContext,
  ): Promise<CourtRecord | null> {
    const client = this.getClient(ctx) as DrizzleTransaction;
    const result = await client
      .select()
      .from(court)
      .where(eq(court.id, id))
      .for("update")
      .limit(1);

    return result[0] ?? null;
  }

  async findByIdWithSport(
    id: string,
    ctx?: RequestContext,
  ): Promise<CourtWithSport | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select({
        court: court,
        sport: sport,
      })
      .from(court)
      .innerJoin(sport, eq(court.sportId, sport.id))
      .where(eq(court.id, id))
      .limit(1);

    return result[0] ?? null;
  }

  async findByPlaceId(
    placeId: string,
    ctx?: RequestContext,
  ): Promise<CourtRecord[]> {
    const client = this.getClient(ctx);
    return client.select().from(court).where(eq(court.placeId, placeId));
  }

  async findByPlaceWithSport(
    placeId: string,
    ctx?: RequestContext,
  ): Promise<CourtWithSport[]> {
    const client = this.getClient(ctx);
    return client
      .select({
        court: court,
        sport: sport,
      })
      .from(court)
      .innerJoin(sport, eq(court.sportId, sport.id))
      .where(eq(court.placeId, placeId))
      .orderBy(court.label);
  }

  async findByPlaceAndSport(
    placeId: string,
    sportId: string,
    ctx?: RequestContext,
  ): Promise<CourtRecord[]> {
    const client = this.getClient(ctx);
    return client
      .select()
      .from(court)
      .where(and(eq(court.placeId, placeId), eq(court.sportId, sportId)));
  }

  async create(data: InsertCourt, ctx?: RequestContext): Promise<CourtRecord> {
    const client = this.getClient(ctx);
    const result = await client.insert(court).values(data).returning();
    return result[0];
  }

  async update(
    id: string,
    data: Partial<InsertCourt>,
    ctx?: RequestContext,
  ): Promise<CourtRecord> {
    const client = this.getClient(ctx);
    const result = await client
      .update(court)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(court.id, id))
      .returning();

    return result[0];
  }
}
