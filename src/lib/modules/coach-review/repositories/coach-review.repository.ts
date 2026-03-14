import { and, avg, count, desc, eq, isNull } from "drizzle-orm";
import {
  type CoachReviewRecord,
  coachReview,
  profile,
} from "@/lib/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/lib/shared/infra/db/types";
import type { RequestContext } from "@/lib/shared/kernel/context";

export interface CoachReviewAggregate {
  averageRating: number;
  reviewCount: number;
  histogram: Record<number, number>;
}

export interface CoachReviewListItem {
  id: string;
  coachId: string;
  authorUserId: string;
  authorDisplayName: string | null;
  authorAvatarUrl: string | null;
  rating: number;
  body: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICoachReviewRepository {
  findActiveByCoachAndUser(
    coachId: string,
    userId: string,
    ctx?: RequestContext,
  ): Promise<CoachReviewRecord | null>;
  findById(id: string, ctx?: RequestContext): Promise<CoachReviewRecord | null>;
  upsertActive(
    data: {
      coachId: string;
      authorUserId: string;
      rating: number;
      body?: string | null;
    },
    ctx?: RequestContext,
  ): Promise<CoachReviewRecord>;
  softRemove(
    id: string,
    removedByUserId: string,
    reason?: string,
    ctx?: RequestContext,
  ): Promise<void>;
  getAggregate(
    coachId: string,
    ctx?: RequestContext,
  ): Promise<CoachReviewAggregate>;
  listActiveByCoach(
    coachId: string,
    limit: number,
    offset: number,
    ctx?: RequestContext,
  ): Promise<{ items: CoachReviewListItem[]; total: number }>;
}

export class CoachReviewRepository implements ICoachReviewRepository {
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async findActiveByCoachAndUser(
    coachId: string,
    userId: string,
    ctx?: RequestContext,
  ): Promise<CoachReviewRecord | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select()
      .from(coachReview)
      .where(
        and(
          eq(coachReview.coachId, coachId),
          eq(coachReview.authorUserId, userId),
          isNull(coachReview.removedAt),
        ),
      )
      .limit(1);

    return result[0] ?? null;
  }

  async findById(
    id: string,
    ctx?: RequestContext,
  ): Promise<CoachReviewRecord | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select()
      .from(coachReview)
      .where(eq(coachReview.id, id))
      .limit(1);

    return result[0] ?? null;
  }

  async upsertActive(
    data: {
      coachId: string;
      authorUserId: string;
      rating: number;
      body?: string | null;
    },
    ctx?: RequestContext,
  ): Promise<CoachReviewRecord> {
    const client = this.getClient(ctx);
    const existing = await this.findActiveByCoachAndUser(
      data.coachId,
      data.authorUserId,
      ctx,
    );

    if (existing) {
      const updated = await client
        .update(coachReview)
        .set({
          rating: data.rating,
          body: data.body ?? null,
          updatedAt: new Date(),
        })
        .where(eq(coachReview.id, existing.id))
        .returning();

      return updated[0];
    }

    const created = await client
      .insert(coachReview)
      .values({
        coachId: data.coachId,
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
      .update(coachReview)
      .set({
        removedAt: new Date(),
        removedByUserId,
        removalReason: reason ?? null,
        updatedAt: new Date(),
      })
      .where(eq(coachReview.id, id));
  }

  async getAggregate(
    coachId: string,
    ctx?: RequestContext,
  ): Promise<CoachReviewAggregate> {
    const client = this.getClient(ctx);

    const [summary] = await client
      .select({
        averageRating: avg(coachReview.rating),
        reviewCount: count(),
      })
      .from(coachReview)
      .where(
        and(eq(coachReview.coachId, coachId), isNull(coachReview.removedAt)),
      );

    const histogramRows = await client
      .select({
        rating: coachReview.rating,
        count: count(),
      })
      .from(coachReview)
      .where(
        and(eq(coachReview.coachId, coachId), isNull(coachReview.removedAt)),
      )
      .groupBy(coachReview.rating);

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

  async listActiveByCoach(
    coachId: string,
    limit: number,
    offset: number,
    ctx?: RequestContext,
  ): Promise<{ items: CoachReviewListItem[]; total: number }> {
    const client = this.getClient(ctx);

    const [items, [{ total } = { total: 0 }]] = await Promise.all([
      client
        .select({
          id: coachReview.id,
          coachId: coachReview.coachId,
          authorUserId: coachReview.authorUserId,
          authorDisplayName: profile.displayName,
          authorAvatarUrl: profile.avatarUrl,
          rating: coachReview.rating,
          body: coachReview.body,
          createdAt: coachReview.createdAt,
          updatedAt: coachReview.updatedAt,
        })
        .from(coachReview)
        .leftJoin(profile, eq(profile.userId, coachReview.authorUserId))
        .where(
          and(eq(coachReview.coachId, coachId), isNull(coachReview.removedAt)),
        )
        .orderBy(desc(coachReview.createdAt))
        .limit(limit)
        .offset(offset),
      client
        .select({ total: count() })
        .from(coachReview)
        .where(
          and(eq(coachReview.coachId, coachId), isNull(coachReview.removedAt)),
        ),
    ]);

    return {
      items,
      total,
    };
  }
}
