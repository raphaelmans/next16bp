import { and, count, eq, gte, sql } from "drizzle-orm";
import {
  courtSubmission,
  type CourtSubmissionRecord,
  type InsertCourtSubmission,
  place,
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

    return {
      items,
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
