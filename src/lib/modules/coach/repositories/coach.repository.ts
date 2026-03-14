import { asc, eq } from "drizzle-orm";
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
  coachSessionDuration,
  coachSessionType,
  coachSkillLevel,
  coachSpecialty,
  coachSport,
  type InsertCoach,
  type InsertCoachAgeGroup,
  type InsertCoachCertification,
  type InsertCoachContactDetail,
  type InsertCoachSessionDuration,
  type InsertCoachSessionType,
  type InsertCoachSkillLevel,
  type InsertCoachSpecialty,
  type InsertCoachSport,
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
}

export class CoachRepository implements ICoachRepository {
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
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
}
