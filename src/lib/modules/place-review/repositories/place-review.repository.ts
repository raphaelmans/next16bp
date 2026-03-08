import {
  and,
  avg,
  count,
  desc,
  eq,
  isNull,
  isNotNull,
  type SQL,
  sql,
} from "drizzle-orm";
import {
  placeReview,
  type PlaceReviewRecord,
  profile,
} from "@/lib/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/lib/shared/infra/db/types";
import type { RequestContext } from "@/lib/shared/kernel/context";

export interface ReviewAggregate {
  averageRating: number;
  reviewCount: number;
  histogram: Record<number, number>;
}

export interface ReviewListItem {
  id: string;
  placeId: string;
  authorUserId: string;
  authorDisplayName: string | null;
  authorAvatarUrl: string | null;
  rating: number;
  body: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminReviewListItem extends ReviewListItem {
  removedAt: Date | null;
  removedByUserId: string | null;
  removalReason: string | null;
}

export interface PlaceReviewRepository {
  findActiveByPlaceAndUser(
    placeId: string,
    userId: string,
    ctx?: RequestContext,
  ): Promise<PlaceReviewRecord | null>;
  findById(id: string, ctx?: RequestContext): Promise<PlaceReviewRecord | null>;
  upsertActive(
    data: {
      placeId: string;
      authorUserId: string;
      rating: number;
      body?: string | null;
    },
    ctx?: RequestContext,
  ): Promise<PlaceReviewRecord>;
  softRemove(
    id: string,
    removedByUserId: string,
    reason?: string,
    ctx?: RequestContext,
  ): Promise<void>;
  getAggregate(placeId: string, ctx?: RequestContext): Promise<ReviewAggregate>;
  getAggregatesByPlaceIds(
    placeIds: string[],
    ctx?: RequestContext,
  ): Promise<Map<string, { averageRating: number; reviewCount: number }>>;
  listActiveByPlace(
    placeId: string,
    limit: number,
    offset: number,
    ctx?: RequestContext,
  ): Promise<{ items: ReviewListItem[]; total: number }>;
  listForAdmin(
    filters: {
      placeId?: string;
      authorUserId?: string;
      status?: "active" | "removed";
      rating?: number;
    },
    limit: number,
    offset: number,
    ctx?: RequestContext,
  ): Promise<{ items: AdminReviewListItem[]; total: number }>;
}

export class PlaceReviewRepositoryImpl implements PlaceReviewRepository {
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async findActiveByPlaceAndUser(
    placeId: string,
    userId: string,
    ctx?: RequestContext,
  ): Promise<PlaceReviewRecord | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select()
      .from(placeReview)
      .where(
        and(
          eq(placeReview.placeId, placeId),
          eq(placeReview.authorUserId, userId),
          isNull(placeReview.removedAt),
        ),
      )
      .limit(1);
    return result[0] ?? null;
  }

  async findById(
    id: string,
    ctx?: RequestContext,
  ): Promise<PlaceReviewRecord | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select()
      .from(placeReview)
      .where(eq(placeReview.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async upsertActive(
    data: {
      placeId: string;
      authorUserId: string;
      rating: number;
      body?: string | null;
    },
    ctx?: RequestContext,
  ): Promise<PlaceReviewRecord> {
    const client = this.getClient(ctx);
    const existing = await this.findActiveByPlaceAndUser(
      data.placeId,
      data.authorUserId,
      ctx,
    );

    if (existing) {
      const updated = await client
        .update(placeReview)
        .set({
          rating: data.rating,
          body: data.body ?? null,
          updatedAt: new Date(),
        })
        .where(eq(placeReview.id, existing.id))
        .returning();
      return updated[0];
    }

    const created = await client
      .insert(placeReview)
      .values({
        placeId: data.placeId,
        authorUserId: data.authorUserId,
        rating: data.rating,
        body: data.body ?? null,
      })
      .returning();
    return created[0];
  }

  async softRemove(
    id: string,
    removedByUserId: string,
    reason?: string,
    ctx?: RequestContext,
  ): Promise<void> {
    const client = this.getClient(ctx);
    await client
      .update(placeReview)
      .set({
        removedAt: new Date(),
        removedByUserId,
        removalReason: reason ?? null,
        updatedAt: new Date(),
      })
      .where(eq(placeReview.id, id));
  }

  async getAggregate(
    placeId: string,
    ctx?: RequestContext,
  ): Promise<ReviewAggregate> {
    const client = this.getClient(ctx);

    const [summary] = await client
      .select({
        averageRating: avg(placeReview.rating),
        reviewCount: count(),
      })
      .from(placeReview)
      .where(
        and(eq(placeReview.placeId, placeId), isNull(placeReview.removedAt)),
      );

    const histogramRows = await client
      .select({
        rating: placeReview.rating,
        count: count(),
      })
      .from(placeReview)
      .where(
        and(eq(placeReview.placeId, placeId), isNull(placeReview.removedAt)),
      )
      .groupBy(placeReview.rating);

    const histogram: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const row of histogramRows) {
      histogram[row.rating] = row.count;
    }

    return {
      averageRating: summary?.averageRating
        ? Number.parseFloat(String(summary.averageRating))
        : 0,
      reviewCount: summary?.reviewCount ?? 0,
      histogram,
    };
  }

  async getAggregatesByPlaceIds(
    placeIds: string[],
    ctx?: RequestContext,
  ): Promise<Map<string, { averageRating: number; reviewCount: number }>> {
    if (placeIds.length === 0) return new Map();

    const client = this.getClient(ctx);
    const rows = await client
      .select({
        placeId: placeReview.placeId,
        averageRating: avg(placeReview.rating),
        reviewCount: count(),
      })
      .from(placeReview)
      .where(
        and(
          sql`${placeReview.placeId} IN ${placeIds}`,
          isNull(placeReview.removedAt),
        ),
      )
      .groupBy(placeReview.placeId);

    const map = new Map<
      string,
      { averageRating: number; reviewCount: number }
    >();
    for (const row of rows) {
      map.set(row.placeId, {
        averageRating: row.averageRating
          ? Number.parseFloat(String(row.averageRating))
          : 0,
        reviewCount: row.reviewCount,
      });
    }
    return map;
  }

  async listActiveByPlace(
    placeId: string,
    limit: number,
    offset: number,
    ctx?: RequestContext,
  ): Promise<{ items: ReviewListItem[]; total: number }> {
    const client = this.getClient(ctx);
    const activeCondition = and(
      eq(placeReview.placeId, placeId),
      isNull(placeReview.removedAt),
    );

    const [totalResult, items] = await Promise.all([
      client
        .select({ count: count() })
        .from(placeReview)
        .where(activeCondition),
      client
        .select({
          id: placeReview.id,
          placeId: placeReview.placeId,
          authorUserId: placeReview.authorUserId,
          authorDisplayName: profile.displayName,
          authorAvatarUrl: profile.avatarUrl,
          rating: placeReview.rating,
          body: placeReview.body,
          createdAt: placeReview.createdAt,
          updatedAt: placeReview.updatedAt,
        })
        .from(placeReview)
        .leftJoin(profile, eq(profile.userId, placeReview.authorUserId))
        .where(activeCondition)
        .orderBy(desc(placeReview.createdAt))
        .limit(limit)
        .offset(offset),
    ]);

    return {
      items,
      total: totalResult[0]?.count ?? 0,
    };
  }

  async listForAdmin(
    filters: {
      placeId?: string;
      authorUserId?: string;
      status?: "active" | "removed";
      rating?: number;
    },
    limit: number,
    offset: number,
    ctx?: RequestContext,
  ): Promise<{ items: AdminReviewListItem[]; total: number }> {
    const client = this.getClient(ctx);

    const conditions: SQL[] = [];
    if (filters.placeId) {
      conditions.push(eq(placeReview.placeId, filters.placeId));
    }
    if (filters.authorUserId) {
      conditions.push(eq(placeReview.authorUserId, filters.authorUserId));
    }
    if (filters.status === "active") {
      conditions.push(isNull(placeReview.removedAt));
    } else if (filters.status === "removed") {
      conditions.push(isNotNull(placeReview.removedAt));
    }
    if (filters.rating) {
      conditions.push(eq(placeReview.rating, filters.rating));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalResult, items] = await Promise.all([
      client.select({ count: count() }).from(placeReview).where(whereClause),
      client
        .select({
          id: placeReview.id,
          placeId: placeReview.placeId,
          authorUserId: placeReview.authorUserId,
          authorDisplayName: profile.displayName,
          authorAvatarUrl: profile.avatarUrl,
          rating: placeReview.rating,
          body: placeReview.body,
          createdAt: placeReview.createdAt,
          updatedAt: placeReview.updatedAt,
          removedAt: placeReview.removedAt,
          removedByUserId: placeReview.removedByUserId,
          removalReason: placeReview.removalReason,
        })
        .from(placeReview)
        .leftJoin(profile, eq(profile.userId, placeReview.authorUserId))
        .where(whereClause)
        .orderBy(desc(placeReview.createdAt))
        .limit(limit)
        .offset(offset),
    ]);

    return {
      items,
      total: totalResult[0]?.count ?? 0,
    };
  }
}
