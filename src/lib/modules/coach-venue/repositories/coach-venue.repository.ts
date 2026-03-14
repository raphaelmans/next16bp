import { and, eq, inArray } from "drizzle-orm";
import {
  type CoachVenueRecord,
  coachVenue,
  type InsertCoachVenue,
} from "@/lib/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/lib/shared/infra/db/types";
import type { RequestContext } from "@/lib/shared/kernel/context";

export interface ICoachVenueRepository {
  create(
    data: InsertCoachVenue,
    ctx?: RequestContext,
  ): Promise<CoachVenueRecord>;
  findById(id: string, ctx?: RequestContext): Promise<CoachVenueRecord | null>;
  findByCoachAndPlace(
    coachId: string,
    placeId: string,
    ctx?: RequestContext,
  ): Promise<CoachVenueRecord | null>;
  findActiveByCoachAndPlace(
    coachId: string,
    placeId: string,
    ctx?: RequestContext,
  ): Promise<CoachVenueRecord | null>;
  findByCoachId(
    coachId: string,
    ctx?: RequestContext,
  ): Promise<CoachVenueRecord[]>;
  findByPlaceId(
    placeId: string,
    ctx?: RequestContext,
  ): Promise<CoachVenueRecord[]>;
  findAcceptedByPlaceId(
    placeId: string,
    ctx?: RequestContext,
  ): Promise<CoachVenueRecord[]>;
  findPendingByCoachId(
    coachId: string,
    ctx?: RequestContext,
  ): Promise<CoachVenueRecord[]>;
  updateStatus(
    id: string,
    status: CoachVenueRecord["status"],
    ctx?: RequestContext,
  ): Promise<CoachVenueRecord | null>;
}

export class CoachVenueRepository implements ICoachVenueRepository {
  constructor(private db: DbClient) {}

  private getDb(ctx?: RequestContext) {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async create(
    data: InsertCoachVenue,
    ctx?: RequestContext,
  ): Promise<CoachVenueRecord> {
    const db = this.getDb(ctx);
    const [record] = await db.insert(coachVenue).values(data).returning();
    return record;
  }

  async findById(
    id: string,
    ctx?: RequestContext,
  ): Promise<CoachVenueRecord | null> {
    const db = this.getDb(ctx);
    const [record] = await db
      .select()
      .from(coachVenue)
      .where(eq(coachVenue.id, id))
      .limit(1);
    return record ?? null;
  }

  async findByCoachAndPlace(
    coachId: string,
    placeId: string,
    ctx?: RequestContext,
  ): Promise<CoachVenueRecord | null> {
    const db = this.getDb(ctx);
    const [record] = await db
      .select()
      .from(coachVenue)
      .where(
        and(eq(coachVenue.coachId, coachId), eq(coachVenue.placeId, placeId)),
      )
      .limit(1);
    return record ?? null;
  }

  async findActiveByCoachAndPlace(
    coachId: string,
    placeId: string,
    ctx?: RequestContext,
  ): Promise<CoachVenueRecord | null> {
    const db = this.getDb(ctx);
    const [record] = await db
      .select()
      .from(coachVenue)
      .where(
        and(
          eq(coachVenue.coachId, coachId),
          eq(coachVenue.placeId, placeId),
          inArray(coachVenue.status, ["PENDING", "ACCEPTED"]),
        ),
      )
      .limit(1);
    return record ?? null;
  }

  async findByCoachId(
    coachId: string,
    ctx?: RequestContext,
  ): Promise<CoachVenueRecord[]> {
    const db = this.getDb(ctx);
    return db.select().from(coachVenue).where(eq(coachVenue.coachId, coachId));
  }

  async findByPlaceId(
    placeId: string,
    ctx?: RequestContext,
  ): Promise<CoachVenueRecord[]> {
    const db = this.getDb(ctx);
    return db.select().from(coachVenue).where(eq(coachVenue.placeId, placeId));
  }

  async findAcceptedByPlaceId(
    placeId: string,
    ctx?: RequestContext,
  ): Promise<CoachVenueRecord[]> {
    const db = this.getDb(ctx);
    return db
      .select()
      .from(coachVenue)
      .where(
        and(eq(coachVenue.placeId, placeId), eq(coachVenue.status, "ACCEPTED")),
      );
  }

  async findPendingByCoachId(
    coachId: string,
    ctx?: RequestContext,
  ): Promise<CoachVenueRecord[]> {
    const db = this.getDb(ctx);
    return db
      .select()
      .from(coachVenue)
      .where(
        and(eq(coachVenue.coachId, coachId), eq(coachVenue.status, "PENDING")),
      );
  }

  async updateStatus(
    id: string,
    status: CoachVenueRecord["status"],
    ctx?: RequestContext,
  ): Promise<CoachVenueRecord | null> {
    const db = this.getDb(ctx);
    const now = new Date();
    const [record] = await db
      .update(coachVenue)
      .set({
        status,
        respondedAt: status !== "PENDING" ? now : undefined,
        updatedAt: now,
      })
      .where(eq(coachVenue.id, id))
      .returning();
    return record ?? null;
  }
}
