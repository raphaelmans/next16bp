import { and, count, eq, gte, sql } from "drizzle-orm";
import {
  court,
  courtSubmission,
  type CourtSubmissionRecord,
  type InsertCourtSubmission,
  place,
  sport,
} from "@/lib/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/lib/shared/infra/db/types";
import type { RequestContext } from "@/lib/shared/kernel/context";

export class CourtSubmissionRepository {
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async create(
    data: InsertCourtSubmission,
    ctx?: RequestContext,
  ): Promise<CourtSubmissionRecord> {
    const client = this.getClient(ctx);
    const result = await client
      .insert(courtSubmission)
      .values(data)
      .returning();
    return result[0];
  }

  async findById(
    id: string,
    ctx?: RequestContext,
  ): Promise<CourtSubmissionRecord | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select()
      .from(courtSubmission)
      .where(eq(courtSubmission.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async findByUserId(
    userId: string,
    options: { limit: number; offset: number },
    ctx?: RequestContext,
  ): Promise<{ items: CourtSubmissionRecord[]; total: number }> {
    const client = this.getClient(ctx);

    const [items, totalResult] = await Promise.all([
      client
        .select()
        .from(courtSubmission)
        .where(eq(courtSubmission.submittedByUserId, userId))
        .orderBy(sql`${courtSubmission.createdAt} desc`)
        .limit(options.limit)
        .offset(options.offset),
      client
        .select({ count: count() })
        .from(courtSubmission)
        .where(eq(courtSubmission.submittedByUserId, userId)),
    ]);

    return {
      items,
      total: totalResult[0]?.count ?? 0,
    };
  }

  async findByStatus(
    status: "PENDING" | "APPROVED" | "REJECTED",
    options: { limit: number; offset: number },
    ctx?: RequestContext,
  ) {
    const client = this.getClient(ctx);

    const [items, totalResult] = await Promise.all([
      client
        .select({
          submission: courtSubmission,
          placeName: place.name,
          placeCity: place.city,
          placeProvince: place.province,
          placeIsActive: place.isActive,
        })
        .from(courtSubmission)
        .innerJoin(place, eq(courtSubmission.placeId, place.id))
        .where(eq(courtSubmission.status, status))
        .orderBy(sql`${courtSubmission.createdAt} asc`)
        .limit(options.limit)
        .offset(options.offset),
      client
        .select({ count: count() })
        .from(courtSubmission)
        .where(eq(courtSubmission.status, status)),
    ]);

    return {
      items,
      total: totalResult[0]?.count ?? 0,
    };
  }

  async listAll(
    options: {
      status?: "PENDING" | "APPROVED" | "REJECTED";
      limit: number;
      offset: number;
    },
    ctx?: RequestContext,
  ) {
    const client = this.getClient(ctx);
    const conditions = options.status
      ? eq(courtSubmission.status, options.status)
      : undefined;

    const [items, totalResult] = await Promise.all([
      client
        .select({
          submission: courtSubmission,
          placeName: place.name,
          placeCity: place.city,
          placeProvince: place.province,
          placeAddress: place.address,
          placeLatitude: place.latitude,
          placeLongitude: place.longitude,
          placeIsActive: place.isActive,
          placeSlug: place.slug,
        })
        .from(courtSubmission)
        .innerJoin(place, eq(courtSubmission.placeId, place.id))
        .where(conditions)
        .orderBy(sql`${courtSubmission.createdAt} asc`)
        .limit(options.limit)
        .offset(options.offset),
      client.select({ count: count() }).from(courtSubmission).where(conditions),
    ]);

    // Fetch court/sport data for all submissions
    const placeIds = items.map((i) => i.submission.placeId);
    const courtSportRows =
      placeIds.length > 0
        ? await client
            .select({
              placeId: court.placeId,
              sportName: sport.name,
              sportId: court.sportId,
            })
            .from(court)
            .innerJoin(sport, eq(court.sportId, sport.id))
            .where(sql`${court.placeId} IN ${placeIds}`)
        : [];

    // Group courts by place, then by sport
    const courtsByPlace = new Map<
      string,
      { sportName: string; count: number }[]
    >();
    for (const row of courtSportRows) {
      if (!row.placeId) continue;
      if (!courtsByPlace.has(row.placeId)) {
        courtsByPlace.set(row.placeId, []);
      }
      const sports = courtsByPlace.get(row.placeId)!;
      const existing = sports.find((s) => s.sportName === row.sportName);
      if (existing) {
        existing.count++;
      } else {
        sports.push({ sportName: row.sportName, count: 1 });
      }
    }

    const enrichedItems = items.map((item) => ({
      ...item,
      courts: courtsByPlace.get(item.submission.placeId) ?? [],
    }));

    return {
      items: enrichedItems,
      total: totalResult[0]?.count ?? 0,
    };
  }

  async updateStatus(
    id: string,
    data: {
      status: "APPROVED" | "REJECTED";
      rejectionReason?: string;
      reviewedByUserId: string;
    },
    ctx?: RequestContext,
  ): Promise<CourtSubmissionRecord> {
    const client = this.getClient(ctx);
    const result = await client
      .update(courtSubmission)
      .set({
        status: data.status,
        rejectionReason: data.rejectionReason ?? null,
        reviewedByUserId: data.reviewedByUserId,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(courtSubmission.id, id))
      .returning();
    return result[0];
  }

  async getDailyCount(userId: string, ctx?: RequestContext): Promise<number> {
    const client = this.getClient(ctx);
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);

    const result = await client
      .select({ count: count() })
      .from(courtSubmission)
      .where(
        and(
          eq(courtSubmission.submittedByUserId, userId),
          gte(courtSubmission.createdAt, startOfDay),
        ),
      );

    return result[0]?.count ?? 0;
  }

  async findByPlaceId(
    placeId: string,
    ctx?: RequestContext,
  ): Promise<CourtSubmissionRecord | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select()
      .from(courtSubmission)
      .where(eq(courtSubmission.placeId, placeId))
      .limit(1);
    return result[0] ?? null;
  }
}
