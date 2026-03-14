import { and, asc, count, eq, ilike, inArray, isNull, sql } from "drizzle-orm";
import {
  type CoachAgeGroupRecord,
  type CoachCertificationRecord,
  type CoachContactDetailRecord,
  type CoachPhotoRecord,
  type CoachRecord,
  type CoachSessionDurationRecord,
  type CoachSessionTypeRecord,
  type CoachSkillLevelRecord,
  type CoachSpecialtyRecord,
  type CoachSportRecord,
  coach,
  coachAgeGroup,
  coachCertification,
  coachContactDetail,
  coachPhoto,
  coachReview,
  coachSessionDuration,
  coachSessionType,
  coachSkillLevel,
  coachSpecialty,
  coachSport,
  coachVenue,
  type InsertCoach,
  type InsertCoachAgeGroup,
  type InsertCoachCertification,
  type InsertCoachContactDetail,
  type InsertCoachSessionDuration,
  type InsertCoachSessionType,
  type InsertCoachSkillLevel,
  type InsertCoachSpecialty,
  type InsertCoachSport,
  profile,
  sport,
} from "@/lib/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/lib/shared/infra/db/types";
import type { RequestContext } from "@/lib/shared/kernel/context";
import { isUuid } from "@/lib/slug";

export interface CoachWithDetails {
  coach: CoachRecord;
  contactDetail: CoachContactDetailRecord | null;
  sports: CoachSportRecord[];
  certifications: CoachCertificationRecord[];
  specialties: CoachSpecialtyRecord[];
  skillLevels: CoachSkillLevelRecord[];
  ageGroups: CoachAgeGroupRecord[];
  sessionTypes: CoachSessionTypeRecord[];
  sessionDurations: CoachSessionDurationRecord[];
  photos: CoachPhotoRecord[];
}

export interface CoachCardMediaItem {
  coachId: string;
  avatarUrl: string | null;
  primaryPhotoUrl: string | null;
}

export interface CoachCardMetaItem {
  coachId: string;
  sports: { id: string; slug: string; name: string }[];
  sessionTypes: InsertCoachSessionType["sessionType"][];
  baseHourlyRateCents: number | null;
  currency: string | null;
  averageRating: number | null;
  reviewCount: number;
  verified: boolean;
}

export interface CoachSummaryMeta {
  sports: CoachCardMetaItem["sports"];
  sessionTypes: CoachCardMetaItem["sessionTypes"];
  averageRating: number | null;
  reviewCount: number;
  verified: boolean;
}

export interface CoachSummaryItem {
  coach: {
    id: string;
    slug: string;
    name: string;
    tagline: string | null;
    city: string | null;
    province: string | null;
    baseHourlyRateCents: number | null;
    baseHourlyRateCurrency: string;
    featuredRank: number;
    provinceRank: number;
  };
  meta?: CoachSummaryMeta;
}

export interface CoachListItem {
  coach: CoachSummaryItem["coach"];
  meta?: CoachCardMetaItem;
  media?: CoachCardMediaItem;
}

export interface CoachDiscoveryFilters {
  q?: string;
  province?: string;
  city?: string;
  sportId?: string;
  minRate?: number;
  maxRate?: number;
  minRating?: number;
  skillLevel?: InsertCoachSkillLevel["level"];
  ageGroup?: InsertCoachAgeGroup["ageGroup"];
  sessionType?: InsertCoachSessionType["sessionType"];
  verified?: boolean;
  venueId?: string;
  limit: number;
  offset: number;
}

export interface ICoachRepository {
  findById(id: string, ctx?: RequestContext): Promise<CoachRecord | null>;
  findByUserId(
    userId: string,
    ctx?: RequestContext,
  ): Promise<CoachRecord | null>;
  findBySlug(slug: string, ctx?: RequestContext): Promise<CoachRecord | null>;
  findByIdOrSlug(
    idOrSlug: string,
    ctx?: RequestContext,
  ): Promise<CoachRecord | null>;
  findByIdForUpdate(
    id: string,
    ctx: RequestContext,
  ): Promise<CoachRecord | null>;
  findWithDetails(
    id: string,
    ctx?: RequestContext,
  ): Promise<CoachWithDetails | null>;
  list(
    filters: CoachDiscoveryFilters,
    ctx?: RequestContext,
  ): Promise<{ items: CoachListItem[]; total: number }>;
  listSummary(
    filters: CoachDiscoveryFilters,
    ctx?: RequestContext,
  ): Promise<{ items: CoachSummaryItem[]; total: number }>;
  listCardMediaByCoachIds(
    coachIds: string[],
    ctx?: RequestContext,
  ): Promise<CoachCardMediaItem[]>;
  listCardMetaByCoachIds(
    coachIds: string[],
    ctx?: RequestContext,
  ): Promise<CoachCardMetaItem[]>;
  create(data: InsertCoach, ctx?: RequestContext): Promise<CoachRecord>;
  update(
    id: string,
    data: Partial<InsertCoach>,
    ctx?: RequestContext,
  ): Promise<CoachRecord>;
  replaceCoachSports(
    coachId: string,
    sportIds: string[],
    ctx?: RequestContext,
  ): Promise<void>;
  replaceCertifications(
    coachId: string,
    certifications: Array<{
      name: string;
      issuingBody?: string | null;
      level?: string | null;
    }>,
    ctx?: RequestContext,
  ): Promise<void>;
  replaceSpecialties(
    coachId: string,
    specialties: string[],
    ctx?: RequestContext,
  ): Promise<void>;
  replaceSkillLevels(
    coachId: string,
    levels: InsertCoachSkillLevel["level"][],
    ctx?: RequestContext,
  ): Promise<void>;
  replaceAgeGroups(
    coachId: string,
    ageGroups: InsertCoachAgeGroup["ageGroup"][],
    ctx?: RequestContext,
  ): Promise<void>;
  replaceSessionTypes(
    coachId: string,
    sessionTypes: InsertCoachSessionType["sessionType"][],
    ctx?: RequestContext,
  ): Promise<void>;
  replaceSessionDurations(
    coachId: string,
    durations: InsertCoachSessionDuration["durationMinutes"][],
    ctx?: RequestContext,
  ): Promise<void>;
  upsertContactDetail(
    data: InsertCoachContactDetail,
    ctx?: RequestContext,
  ): Promise<CoachContactDetailRecord>;
  getPublicStats(ctx?: RequestContext): Promise<{
    totalCoaches: number;
    totalCities: number;
    totalSports: number;
  }>;
}

export class CoachRepository implements ICoachRepository {
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  private buildReviewAggregate(client: DbClient | DrizzleTransaction) {
    return client
      .select({
        coachId: coachReview.coachId,
        averageRating:
          sql<number>`cast(avg(${coachReview.rating}) as double precision)`.as(
            "average_rating",
          ),
        reviewCount: count().as("review_count"),
      })
      .from(coachReview)
      .where(isNull(coachReview.removedAt))
      .groupBy(coachReview.coachId)
      .as("coach_review_aggregate");
  }

  async findById(
    id: string,
    ctx?: RequestContext,
  ): Promise<CoachRecord | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select()
      .from(coach)
      .where(eq(coach.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async findByUserId(
    userId: string,
    ctx?: RequestContext,
  ): Promise<CoachRecord | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select()
      .from(coach)
      .where(eq(coach.userId, userId))
      .limit(1);
    return result[0] ?? null;
  }

  async findBySlug(
    slug: string,
    ctx?: RequestContext,
  ): Promise<CoachRecord | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select()
      .from(coach)
      .where(eq(coach.slug, slug))
      .limit(1);
    return result[0] ?? null;
  }

  async findByIdOrSlug(
    idOrSlug: string,
    ctx?: RequestContext,
  ): Promise<CoachRecord | null> {
    if (isUuid(idOrSlug)) {
      return this.findById(idOrSlug, ctx);
    }
    return this.findBySlug(idOrSlug, ctx);
  }

  async findByIdForUpdate(
    id: string,
    ctx: RequestContext,
  ): Promise<CoachRecord | null> {
    const client = this.getClient(ctx) as DrizzleTransaction;
    const result = await client
      .select()
      .from(coach)
      .where(eq(coach.id, id))
      .for("update")
      .limit(1);
    return result[0] ?? null;
  }

  async findWithDetails(
    id: string,
    ctx?: RequestContext,
  ): Promise<CoachWithDetails | null> {
    const client = this.getClient(ctx);
    const result = await this.findById(id, ctx);

    if (!result) {
      return null;
    }

    const [
      contactDetailResult,
      sports,
      certifications,
      specialties,
      skillLevels,
      ageGroups,
      sessionTypes,
      sessionDurations,
      photos,
    ] = await Promise.all([
      client
        .select()
        .from(coachContactDetail)
        .where(eq(coachContactDetail.coachId, id))
        .limit(1),
      client
        .select()
        .from(coachSport)
        .where(eq(coachSport.coachId, id))
        .orderBy(asc(coachSport.createdAt)),
      client
        .select()
        .from(coachCertification)
        .where(eq(coachCertification.coachId, id))
        .orderBy(asc(coachCertification.createdAt)),
      client
        .select()
        .from(coachSpecialty)
        .where(eq(coachSpecialty.coachId, id))
        .orderBy(asc(coachSpecialty.name)),
      client
        .select()
        .from(coachSkillLevel)
        .where(eq(coachSkillLevel.coachId, id))
        .orderBy(asc(coachSkillLevel.createdAt)),
      client
        .select()
        .from(coachAgeGroup)
        .where(eq(coachAgeGroup.coachId, id))
        .orderBy(asc(coachAgeGroup.createdAt)),
      client
        .select()
        .from(coachSessionType)
        .where(eq(coachSessionType.coachId, id))
        .orderBy(asc(coachSessionType.createdAt)),
      client
        .select()
        .from(coachSessionDuration)
        .where(eq(coachSessionDuration.coachId, id))
        .orderBy(asc(coachSessionDuration.durationMinutes)),
      client
        .select()
        .from(coachPhoto)
        .where(eq(coachPhoto.coachId, id))
        .orderBy(asc(coachPhoto.displayOrder), asc(coachPhoto.createdAt)),
    ]);

    return {
      coach: result,
      contactDetail: contactDetailResult[0] ?? null,
      sports,
      certifications,
      specialties,
      skillLevels,
      ageGroups,
      sessionTypes,
      sessionDurations,
      photos,
    };
  }

  async list(
    filters: CoachDiscoveryFilters,
    ctx?: RequestContext,
  ): Promise<{ items: CoachListItem[]; total: number }> {
    const summaryResult = await this.listSummary(filters, ctx);
    const mediaItems = await this.listCardMediaByCoachIds(
      summaryResult.items.map((item) => item.coach.id),
      ctx,
    );
    const mediaByCoachId = new Map(
      mediaItems.map((item) => [item.coachId, item] as const),
    );

    return {
      total: summaryResult.total,
      items: summaryResult.items.map((item) => ({
        coach: item.coach,
        meta: item.meta
          ? {
              coachId: item.coach.id,
              sports: item.meta.sports,
              sessionTypes: item.meta.sessionTypes,
              baseHourlyRateCents: item.coach.baseHourlyRateCents,
              currency: item.coach.baseHourlyRateCurrency,
              averageRating: item.meta.averageRating,
              reviewCount: item.meta.reviewCount,
              verified: item.meta.verified,
            }
          : undefined,
        media: mediaByCoachId.get(item.coach.id),
      })),
    };
  }

  async listSummary(
    filters: CoachDiscoveryFilters,
    ctx?: RequestContext,
  ): Promise<{ items: CoachSummaryItem[]; total: number }> {
    const client = this.getClient(ctx);
    const reviewAggregate = this.buildReviewAggregate(client);
    const conditions = [eq(coach.isActive, true)];

    if (filters.q?.trim()) {
      conditions.push(ilike(coach.name, `%${filters.q.trim()}%`));
    }

    if (filters.province?.trim()) {
      conditions.push(
        sql`lower(${coach.province}) = lower(${filters.province.trim()})`,
      );
    }

    if (filters.city?.trim()) {
      conditions.push(
        sql`lower(${coach.city}) = lower(${filters.city.trim()})`,
      );
    }

    if (filters.sportId) {
      conditions.push(
        sql`exists (
          select 1
          from ${coachSport}
          where ${coachSport.coachId} = ${coach.id}
            and ${coachSport.sportId} = ${filters.sportId}
        )`,
      );
    }

    if (filters.minRate !== undefined) {
      conditions.push(
        sql`${coach.baseHourlyRateCents} is not null and ${coach.baseHourlyRateCents} >= ${filters.minRate}`,
      );
    }

    if (filters.maxRate !== undefined) {
      conditions.push(
        sql`${coach.baseHourlyRateCents} is not null and ${coach.baseHourlyRateCents} <= ${filters.maxRate}`,
      );
    }

    if (filters.minRating !== undefined) {
      conditions.push(
        sql`coalesce(${reviewAggregate.averageRating}, 0) >= ${filters.minRating}`,
      );
    }

    if (filters.skillLevel) {
      conditions.push(
        sql`exists (
          select 1
          from ${coachSkillLevel}
          where ${coachSkillLevel.coachId} = ${coach.id}
            and ${coachSkillLevel.level} = ${filters.skillLevel}
        )`,
      );
    }

    if (filters.ageGroup) {
      conditions.push(
        sql`exists (
          select 1
          from ${coachAgeGroup}
          where ${coachAgeGroup.coachId} = ${coach.id}
            and ${coachAgeGroup.ageGroup} = ${filters.ageGroup}
        )`,
      );
    }

    if (filters.sessionType) {
      conditions.push(
        sql`exists (
          select 1
          from ${coachSessionType}
          where ${coachSessionType.coachId} = ${coach.id}
            and ${coachSessionType.sessionType} = ${filters.sessionType}
        )`,
      );
    }

    if (filters.verified) {
      conditions.push(eq(coach.verificationStatus, "VERIFIED"));
    }

    if (filters.venueId) {
      conditions.push(
        sql`exists (
          select 1
          from ${coachVenue}
          where ${coachVenue.coachId} = ${coach.id}
            and ${coachVenue.placeId} = ${filters.venueId}
            and ${coachVenue.status} = 'ACCEPTED'
        )`,
      );
    }

    const whereClause = and(...conditions);

    const [totalRow, rows] = await Promise.all([
      client
        .select({ total: count() })
        .from(coach)
        .leftJoin(reviewAggregate, eq(reviewAggregate.coachId, coach.id))
        .where(whereClause),
      client
        .select({
          id: coach.id,
          slug: coach.slug,
          name: coach.name,
          tagline: coach.tagline,
          city: coach.city,
          province: coach.province,
          baseHourlyRateCents: coach.baseHourlyRateCents,
          baseHourlyRateCurrency: coach.baseHourlyRateCurrency,
          featuredRank: coach.featuredRank,
          provinceRank: coach.provinceRank,
        })
        .from(coach)
        .leftJoin(reviewAggregate, eq(reviewAggregate.coachId, coach.id))
        .where(whereClause)
        .orderBy(
          sql`case when ${coach.featuredRank} > 0 then 0 else 1 end`,
          asc(coach.featuredRank),
          sql`case when ${coach.provinceRank} > 0 then 0 else 1 end`,
          asc(coach.provinceRank),
          asc(coach.name),
          asc(coach.id),
        )
        .limit(filters.limit)
        .offset(filters.offset),
    ]);

    const metaItems = await this.listCardMetaByCoachIds(
      rows.map((row) => row.id),
      ctx,
    );
    const metaByCoachId = new Map(
      metaItems.map((item) => [
        item.coachId,
        {
          sports: item.sports,
          sessionTypes: item.sessionTypes,
          averageRating: item.averageRating,
          reviewCount: item.reviewCount,
          verified: item.verified,
        } satisfies CoachSummaryMeta,
      ]),
    );

    return {
      total: totalRow[0]?.total ?? 0,
      items: rows.map((row) => ({
        coach: {
          id: row.id,
          slug: row.slug,
          name: row.name,
          tagline: row.tagline,
          city: row.city,
          province: row.province,
          baseHourlyRateCents: row.baseHourlyRateCents,
          baseHourlyRateCurrency: row.baseHourlyRateCurrency,
          featuredRank: row.featuredRank,
          provinceRank: row.provinceRank,
        },
        meta: metaByCoachId.get(row.id),
      })),
    };
  }

  async listCardMediaByCoachIds(
    coachIds: string[],
    ctx?: RequestContext,
  ): Promise<CoachCardMediaItem[]> {
    if (coachIds.length === 0) {
      return [];
    }

    const uniqueCoachIds = Array.from(new Set(coachIds));
    const client = this.getClient(ctx);

    const [avatarRows, photoRows] = await Promise.all([
      client
        .select({
          coachId: coach.id,
          avatarUrl: profile.avatarUrl,
        })
        .from(coach)
        .innerJoin(profile, eq(profile.id, coach.profileId))
        .where(
          and(inArray(coach.id, uniqueCoachIds), eq(coach.isActive, true)),
        ),
      client
        .select({
          coachId: coachPhoto.coachId,
          url: coachPhoto.url,
        })
        .from(coachPhoto)
        .where(inArray(coachPhoto.coachId, uniqueCoachIds))
        .orderBy(
          asc(coachPhoto.coachId),
          asc(coachPhoto.displayOrder),
          asc(coachPhoto.createdAt),
        ),
    ]);

    const avatarByCoachId = new Map(
      avatarRows.map((row) => [row.coachId, row.avatarUrl ?? null] as const),
    );
    const primaryPhotoByCoachId = new Map<string, string | null>();

    for (const row of photoRows) {
      if (!primaryPhotoByCoachId.has(row.coachId)) {
        primaryPhotoByCoachId.set(row.coachId, row.url);
      }
    }

    return uniqueCoachIds.flatMap((coachId) => {
      if (
        !avatarByCoachId.has(coachId) &&
        !primaryPhotoByCoachId.has(coachId)
      ) {
        return [];
      }

      return [
        {
          coachId,
          avatarUrl: avatarByCoachId.get(coachId) ?? null,
          primaryPhotoUrl: primaryPhotoByCoachId.get(coachId) ?? null,
        },
      ];
    });
  }

  async listCardMetaByCoachIds(
    coachIds: string[],
    ctx?: RequestContext,
  ): Promise<CoachCardMetaItem[]> {
    if (coachIds.length === 0) {
      return [];
    }

    const uniqueCoachIds = Array.from(new Set(coachIds));
    const client = this.getClient(ctx);
    const reviewAggregate = this.buildReviewAggregate(client);

    const [coachRows, sportRows, sessionTypeRows] = await Promise.all([
      client
        .select({
          coachId: coach.id,
          baseHourlyRateCents: coach.baseHourlyRateCents,
          currency: coach.baseHourlyRateCurrency,
          averageRating: reviewAggregate.averageRating,
          reviewCount: reviewAggregate.reviewCount,
          verified: sql<boolean>`${coach.verificationStatus} = 'VERIFIED'`.as(
            "verified",
          ),
        })
        .from(coach)
        .leftJoin(reviewAggregate, eq(reviewAggregate.coachId, coach.id))
        .where(
          and(inArray(coach.id, uniqueCoachIds), eq(coach.isActive, true)),
        ),
      client
        .select({
          coachId: coachSport.coachId,
          sportId: sport.id,
          sportSlug: sport.slug,
          sportName: sport.name,
        })
        .from(coachSport)
        .innerJoin(sport, eq(sport.id, coachSport.sportId))
        .where(inArray(coachSport.coachId, uniqueCoachIds))
        .orderBy(asc(coachSport.coachId), asc(sport.name)),
      client
        .select({
          coachId: coachSessionType.coachId,
          sessionType: coachSessionType.sessionType,
        })
        .from(coachSessionType)
        .where(inArray(coachSessionType.coachId, uniqueCoachIds))
        .orderBy(
          asc(coachSessionType.coachId),
          asc(coachSessionType.createdAt),
        ),
    ]);

    const sportsByCoachId = new Map<
      string,
      { id: string; slug: string; name: string }[]
    >();
    for (const row of sportRows) {
      const current = sportsByCoachId.get(row.coachId) ?? [];
      current.push({
        id: row.sportId,
        slug: row.sportSlug,
        name: row.sportName,
      });
      sportsByCoachId.set(row.coachId, current);
    }

    const sessionTypesByCoachId = new Map<
      string,
      InsertCoachSessionType["sessionType"][]
    >();
    for (const row of sessionTypeRows) {
      const current = sessionTypesByCoachId.get(row.coachId) ?? [];
      current.push(row.sessionType);
      sessionTypesByCoachId.set(row.coachId, current);
    }

    const metaByCoachId = new Map(
      coachRows.map((row) => [
        row.coachId,
        {
          coachId: row.coachId,
          sports: sportsByCoachId.get(row.coachId) ?? [],
          sessionTypes: sessionTypesByCoachId.get(row.coachId) ?? [],
          baseHourlyRateCents: row.baseHourlyRateCents,
          currency: row.currency,
          averageRating:
            row.averageRating === null || row.averageRating === undefined
              ? null
              : Number(row.averageRating),
          reviewCount: row.reviewCount ?? 0,
          verified: row.verified,
        } satisfies CoachCardMetaItem,
      ]),
    );

    return uniqueCoachIds.flatMap((coachId) => {
      const item = metaByCoachId.get(coachId);
      return item ? [item] : [];
    });
  }

  async create(data: InsertCoach, ctx?: RequestContext): Promise<CoachRecord> {
    const client = this.getClient(ctx);
    const result = await client.insert(coach).values(data).returning();
    return result[0];
  }

  async update(
    id: string,
    data: Partial<InsertCoach>,
    ctx?: RequestContext,
  ): Promise<CoachRecord> {
    const client = this.getClient(ctx);
    const result = await client
      .update(coach)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(coach.id, id))
      .returning();
    return result[0];
  }

  async replaceCoachSports(
    coachId: string,
    sportIds: string[],
    ctx?: RequestContext,
  ): Promise<void> {
    const client = this.getClient(ctx);
    await client.delete(coachSport).where(eq(coachSport.coachId, coachId));
    if (sportIds.length === 0) {
      return;
    }
    await client.insert(coachSport).values(
      sportIds.map((sportId) => ({
        coachId,
        sportId,
      })) satisfies InsertCoachSport[],
    );
  }

  async replaceCertifications(
    coachId: string,
    certifications: Array<{
      name: string;
      issuingBody?: string | null;
      level?: string | null;
    }>,
    ctx?: RequestContext,
  ): Promise<void> {
    const client = this.getClient(ctx);
    await client
      .delete(coachCertification)
      .where(eq(coachCertification.coachId, coachId));
    if (certifications.length === 0) {
      return;
    }
    await client.insert(coachCertification).values(
      certifications.map((certification) => ({
        coachId,
        name: certification.name,
        issuingBody: certification.issuingBody ?? null,
        level: certification.level ?? null,
      })) satisfies InsertCoachCertification[],
    );
  }

  async replaceSpecialties(
    coachId: string,
    specialties: string[],
    ctx?: RequestContext,
  ): Promise<void> {
    const client = this.getClient(ctx);
    await client
      .delete(coachSpecialty)
      .where(eq(coachSpecialty.coachId, coachId));
    if (specialties.length === 0) {
      return;
    }
    await client.insert(coachSpecialty).values(
      specialties.map((name) => ({
        coachId,
        name,
      })) satisfies InsertCoachSpecialty[],
    );
  }

  async replaceSkillLevels(
    coachId: string,
    levels: InsertCoachSkillLevel["level"][],
    ctx?: RequestContext,
  ): Promise<void> {
    const client = this.getClient(ctx);
    await client
      .delete(coachSkillLevel)
      .where(eq(coachSkillLevel.coachId, coachId));
    if (levels.length === 0) {
      return;
    }
    await client.insert(coachSkillLevel).values(
      levels.map((level) => ({
        coachId,
        level,
      })) satisfies InsertCoachSkillLevel[],
    );
  }

  async replaceAgeGroups(
    coachId: string,
    ageGroups: InsertCoachAgeGroup["ageGroup"][],
    ctx?: RequestContext,
  ): Promise<void> {
    const client = this.getClient(ctx);
    await client
      .delete(coachAgeGroup)
      .where(eq(coachAgeGroup.coachId, coachId));
    if (ageGroups.length === 0) {
      return;
    }
    await client.insert(coachAgeGroup).values(
      ageGroups.map((ageGroup) => ({
        coachId,
        ageGroup,
      })) satisfies InsertCoachAgeGroup[],
    );
  }

  async replaceSessionTypes(
    coachId: string,
    sessionTypes: InsertCoachSessionType["sessionType"][],
    ctx?: RequestContext,
  ): Promise<void> {
    const client = this.getClient(ctx);
    await client
      .delete(coachSessionType)
      .where(eq(coachSessionType.coachId, coachId));
    if (sessionTypes.length === 0) {
      return;
    }
    await client.insert(coachSessionType).values(
      sessionTypes.map((sessionType) => ({
        coachId,
        sessionType,
      })) satisfies InsertCoachSessionType[],
    );
  }

  async replaceSessionDurations(
    coachId: string,
    durations: InsertCoachSessionDuration["durationMinutes"][],
    ctx?: RequestContext,
  ): Promise<void> {
    const client = this.getClient(ctx);
    await client
      .delete(coachSessionDuration)
      .where(eq(coachSessionDuration.coachId, coachId));
    if (durations.length === 0) {
      return;
    }
    await client.insert(coachSessionDuration).values(
      durations.map((durationMinutes) => ({
        coachId,
        durationMinutes,
      })) satisfies InsertCoachSessionDuration[],
    );
  }

  async upsertContactDetail(
    data: InsertCoachContactDetail,
    ctx?: RequestContext,
  ): Promise<CoachContactDetailRecord> {
    const client = this.getClient(ctx);
    const result = await client
      .insert(coachContactDetail)
      .values(data)
      .onConflictDoUpdate({
        target: coachContactDetail.coachId,
        set: {
          phoneNumber: data.phoneNumber ?? null,
          facebookUrl: data.facebookUrl ?? null,
          instagramUrl: data.instagramUrl ?? null,
          websiteUrl: data.websiteUrl ?? null,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result[0];
  }

  async getPublicStats(ctx?: RequestContext): Promise<{
    totalCoaches: number;
    totalCities: number;
    totalSports: number;
  }> {
    const client = this.getClient(ctx);

    const [[coachTotals], [cityTotals], [sportTotals]] = await Promise.all([
      client
        .select({ totalCoaches: count() })
        .from(coach)
        .where(eq(coach.isActive, true)),
      client
        .select({
          totalCities: sql<number>`count(distinct ${coach.city})`.as(
            "total_cities",
          ),
        })
        .from(coach)
        .where(and(eq(coach.isActive, true), sql`${coach.city} is not null`)),
      client
        .select({
          totalSports: sql<number>`count(distinct ${coachSport.sportId})`.as(
            "total_sports",
          ),
        })
        .from(coachSport)
        .innerJoin(coach, eq(coach.id, coachSport.coachId))
        .where(eq(coach.isActive, true)),
    ]);

    return {
      totalCoaches: coachTotals?.totalCoaches ?? 0,
      totalCities: Number(cityTotals?.totalCities ?? 0),
      totalSports: Number(sportTotals?.totalSports ?? 0),
    };
  }
}
