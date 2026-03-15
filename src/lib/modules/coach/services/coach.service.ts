import type { IProfileRepository } from "@/lib/modules/profile/repositories/profile.repository";
import type {
  CoachRecord,
  InsertCoach,
  InsertCoachAgeGroup,
  InsertCoachSessionDuration,
  InsertCoachSessionType,
  InsertCoachSkillLevel,
  ProfileRecord,
} from "@/lib/shared/infra/db/schema";
import { logger } from "@/lib/shared/infra/logger";
import type { RequestContext } from "@/lib/shared/kernel/context";
import { ValidationError } from "@/lib/shared/kernel/errors";
import type { TransactionManager } from "@/lib/shared/kernel/transaction";
import type {
  CoachCertificationInput,
  CreateCoachDTO,
  UpdateCoachDTO,
} from "../dtos";
import {
  CoachAlreadyExistsError,
  CoachNotFoundError,
} from "../errors/coach.errors";
import { resolveCoachSlug } from "../helpers";
import type {
  CoachWithDetails,
  ICoachRepository,
} from "../repositories/coach.repository";

type CoachSkillLevelValue = InsertCoachSkillLevel["level"];
type CoachAgeGroupValue = InsertCoachAgeGroup["ageGroup"];
type CoachSessionTypeValue = InsertCoachSessionType["sessionType"];
type CoachSessionDurationValue = InsertCoachSessionDuration["durationMinutes"];

export interface ICoachService {
  createCoach(userId: string, data: CreateCoachDTO): Promise<CoachWithDetails>;
  updateCoach(userId: string, data: UpdateCoachDTO): Promise<CoachWithDetails>;
  getCoachByUserId(userId: string): Promise<CoachWithDetails | null>;
  deactivateCoach(userId: string): Promise<void>;
}

export class CoachService implements ICoachService {
  constructor(
    private coachRepository: ICoachRepository,
    private profileRepository: IProfileRepository,
    private transactionManager: TransactionManager,
  ) {}

  async createCoach(
    userId: string,
    data: CreateCoachDTO,
  ): Promise<CoachWithDetails> {
    return this.transactionManager.run(async (tx) => {
      return this.createCoachInContext(userId, data, { tx });
    });
  }

  async updateCoach(
    userId: string,
    data: UpdateCoachDTO,
  ): Promise<CoachWithDetails> {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };
      const existingCoach = await this.coachRepository.findByUserId(
        userId,
        ctx,
      );

      if (!existingCoach) {
        if (!data.name) {
          throw new ValidationError(
            "Coach name is required to create a coach profile",
            { userId },
          );
        }

        return this.createCoachInContext(
          userId,
          {
            ...data,
            name: data.name,
            sportIds: data.sportIds ?? [],
            certifications: data.certifications ?? [],
            specialties: data.specialties ?? [],
            skillLevels: data.skillLevels ?? [],
            ageGroups: data.ageGroups ?? [],
            sessionTypes: data.sessionTypes ?? [],
            sessionDurations: data.sessionDurations ?? [],
          },
          ctx,
        );
      }

      const lockedCoach = await this.coachRepository.findByIdForUpdate(
        existingCoach.id,
        ctx,
      );
      if (!lockedCoach) {
        throw new CoachNotFoundError(existingCoach.id);
      }

      const normalized = this.normalizeUpdateInput(data);
      const updatePayload = this.buildUpdatePayload(lockedCoach, normalized);

      if (normalized.slug !== undefined || normalized.name !== undefined) {
        updatePayload.slug = await resolveCoachSlug({
          rawSlug: normalized.slug ?? lockedCoach.slug,
          fallbackName: normalized.name ?? lockedCoach.name,
          findBySlug: this.coachRepository.findBySlug.bind(
            this.coachRepository,
          ),
          ctx,
          excludeCoachId: lockedCoach.id,
        });
      }

      await this.coachRepository.update(lockedCoach.id, updatePayload, ctx);
      await this.persistRelations(lockedCoach.id, normalized, ctx);

      logger.info(
        {
          event: "coach.updated",
          coachId: lockedCoach.id,
          userId,
          fields: Object.keys(data),
        },
        "Coach profile updated",
      );

      return this.requireDetails(lockedCoach.id, ctx);
    });
  }

  async getCoachByUserId(userId: string): Promise<CoachWithDetails | null> {
    const existingCoach = await this.coachRepository.findByUserId(userId);
    if (!existingCoach) {
      return null;
    }

    return this.coachRepository.findWithDetails(existingCoach.id);
  }

  async deactivateCoach(userId: string): Promise<void> {
    await this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };
      const existingCoach = await this.coachRepository.findByUserId(
        userId,
        ctx,
      );
      if (!existingCoach) {
        throw new CoachNotFoundError(userId);
      }

      const lockedCoach = await this.coachRepository.findByIdForUpdate(
        existingCoach.id,
        ctx,
      );
      if (!lockedCoach) {
        throw new CoachNotFoundError(existingCoach.id);
      }

      await this.coachRepository.update(
        lockedCoach.id,
        { isActive: false },
        ctx,
      );

      logger.info(
        {
          event: "coach.deactivated",
          coachId: lockedCoach.id,
          userId,
        },
        "Coach profile deactivated",
      );
    });
  }

  private async getOrCreateProfile(
    userId: string,
    ctx: RequestContext,
  ): Promise<ProfileRecord> {
    const existing = await this.profileRepository.findByUserId(userId, ctx);
    if (existing) {
      return existing;
    }

    return this.profileRepository.create({ userId }, ctx);
  }

  private async createCoachInContext(
    userId: string,
    data: CreateCoachDTO,
    ctx: RequestContext,
  ): Promise<CoachWithDetails> {
    const existingCoach = await this.coachRepository.findByUserId(userId, ctx);
    if (existingCoach) {
      throw new CoachAlreadyExistsError(userId);
    }

    const profile = await this.getOrCreateProfile(userId, ctx);
    const normalized = this.normalizeCreateInput(data);
    const slug = await resolveCoachSlug({
      rawSlug: normalized.slug,
      fallbackName: normalized.name,
      findBySlug: this.coachRepository.findBySlug.bind(this.coachRepository),
      ctx,
    });

    const createdCoach = await this.coachRepository.create(
      {
        userId,
        profileId: profile.id,
        name: normalized.name,
        slug,
        tagline: normalized.tagline,
        bio: normalized.bio,
        introVideoUrl: normalized.introVideoUrl,
        yearsOfExperience: normalized.yearsOfExperience,
        playingBackground: normalized.playingBackground,
        coachingPhilosophy: normalized.coachingPhilosophy,
        city: normalized.city,
        province: normalized.province,
        latitude: normalized.latitude,
        longitude: normalized.longitude,
        timeZone: normalized.timeZone,
        willingToTravel: normalized.willingToTravel,
        onlineCoaching: normalized.onlineCoaching,
        baseHourlyRateCents: normalized.baseHourlyRateCents,
        baseHourlyRateCurrency: normalized.baseHourlyRateCurrency,
        isActive: true,
      },
      ctx,
    );

    await this.persistRelations(createdCoach.id, normalized, ctx);

    logger.info(
      {
        event: "coach.created",
        coachId: createdCoach.id,
        profileId: profile.id,
        userId,
      },
      "Coach profile created",
    );

    return this.requireDetails(createdCoach.id, ctx);
  }

  private async requireDetails(
    coachId: string,
    ctx: RequestContext,
  ): Promise<CoachWithDetails> {
    const details = await this.coachRepository.findWithDetails(coachId, ctx);
    if (!details) {
      throw new CoachNotFoundError(coachId);
    }
    return details;
  }

  private normalizeCreateInput(data: CreateCoachDTO) {
    return {
      ...this.normalizeUpdateInput(data),
      name: data.name.trim(),
    };
  }

  private normalizeUpdateInput(data: UpdateCoachDTO) {
    return {
      name: data.name?.trim(),
      slug: data.slug?.trim(),
      tagline: data.tagline?.trim(),
      bio: data.bio?.trim(),
      introVideoUrl: data.introVideoUrl?.trim(),
      yearsOfExperience: data.yearsOfExperience,
      playingBackground: data.playingBackground?.trim(),
      coachingPhilosophy: data.coachingPhilosophy?.trim(),
      city: data.city?.trim(),
      province: data.province?.trim(),
      latitude: data.latitude,
      longitude: data.longitude,
      timeZone: data.timeZone?.trim(),
      willingToTravel: data.willingToTravel,
      onlineCoaching: data.onlineCoaching,
      baseHourlyRateCents: data.baseHourlyRateCents,
      baseHourlyRateCurrency: data.baseHourlyRateCurrency?.trim().toUpperCase(),
      phoneNumber: data.phoneNumber?.trim(),
      facebookUrl: data.facebookUrl?.trim(),
      instagramUrl: data.instagramUrl?.trim(),
      websiteUrl: data.websiteUrl?.trim(),
      sportIds:
        data.sportIds !== undefined
          ? this.uniqueValues(data.sportIds)
          : undefined,
      certifications:
        data.certifications !== undefined
          ? this.normalizeCertifications(data.certifications)
          : undefined,
      specialties:
        data.specialties !== undefined
          ? this.uniqueValues(
              data.specialties
                .map((specialty) => specialty.trim())
                .filter(Boolean),
            )
          : undefined,
      skillLevels:
        data.skillLevels !== undefined
          ? this.uniqueValues(data.skillLevels)
          : undefined,
      ageGroups:
        data.ageGroups !== undefined
          ? this.uniqueValues(data.ageGroups)
          : undefined,
      sessionTypes:
        data.sessionTypes !== undefined
          ? this.uniqueValues(data.sessionTypes)
          : undefined,
      sessionDurations:
        data.sessionDurations !== undefined
          ? this.uniqueValues(data.sessionDurations)
          : undefined,
    };
  }

  private buildUpdatePayload(
    existingCoach: CoachRecord,
    data: ReturnType<CoachService["normalizeUpdateInput"]>,
  ): Partial<InsertCoach> {
    const updatePayload: Partial<InsertCoach> = {};

    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.tagline !== undefined)
      updatePayload.tagline = data.tagline || null;
    if (data.bio !== undefined) updatePayload.bio = data.bio || null;
    if (data.introVideoUrl !== undefined) {
      updatePayload.introVideoUrl = data.introVideoUrl || null;
    }
    if (data.yearsOfExperience !== undefined) {
      updatePayload.yearsOfExperience = data.yearsOfExperience;
    }
    if (data.playingBackground !== undefined) {
      updatePayload.playingBackground = data.playingBackground || null;
    }
    if (data.coachingPhilosophy !== undefined) {
      updatePayload.coachingPhilosophy = data.coachingPhilosophy || null;
    }
    if (data.city !== undefined) updatePayload.city = data.city || null;
    if (data.province !== undefined)
      updatePayload.province = data.province || null;
    if (data.latitude !== undefined)
      updatePayload.latitude = data.latitude ?? null;
    if (data.longitude !== undefined) {
      updatePayload.longitude = data.longitude ?? null;
    }
    if (data.timeZone !== undefined) updatePayload.timeZone = data.timeZone;
    if (data.willingToTravel !== undefined) {
      updatePayload.willingToTravel = data.willingToTravel;
    }
    if (data.onlineCoaching !== undefined) {
      updatePayload.onlineCoaching = data.onlineCoaching;
    }
    if (data.baseHourlyRateCents !== undefined) {
      updatePayload.baseHourlyRateCents = data.baseHourlyRateCents;
    }
    if (data.baseHourlyRateCurrency !== undefined) {
      updatePayload.baseHourlyRateCurrency = data.baseHourlyRateCurrency;
    }

    if (Object.keys(updatePayload).length === 0) {
      return { slug: existingCoach.slug };
    }

    return updatePayload;
  }

  private async persistRelations(
    coachId: string,
    data: ReturnType<CoachService["normalizeUpdateInput"]>,
    ctx: RequestContext,
  ): Promise<void> {
    if (
      data.phoneNumber !== undefined ||
      data.facebookUrl !== undefined ||
      data.instagramUrl !== undefined ||
      data.websiteUrl !== undefined
    ) {
      await this.coachRepository.upsertContactDetail(
        {
          coachId,
          phoneNumber: data.phoneNumber ?? null,
          facebookUrl: data.facebookUrl ?? null,
          instagramUrl: data.instagramUrl ?? null,
          websiteUrl: data.websiteUrl ?? null,
        },
        ctx,
      );
    }

    if (data.sportIds !== undefined) {
      await this.coachRepository.replaceCoachSports(
        coachId,
        data.sportIds,
        ctx,
      );
    }
    if (data.certifications !== undefined) {
      await this.coachRepository.replaceCertifications(
        coachId,
        data.certifications,
        ctx,
      );
    }
    if (data.specialties !== undefined) {
      await this.coachRepository.replaceSpecialties(
        coachId,
        data.specialties,
        ctx,
      );
    }
    if (data.skillLevels !== undefined) {
      await this.coachRepository.replaceSkillLevels(
        coachId,
        data.skillLevels as CoachSkillLevelValue[],
        ctx,
      );
    }
    if (data.ageGroups !== undefined) {
      await this.coachRepository.replaceAgeGroups(
        coachId,
        data.ageGroups as CoachAgeGroupValue[],
        ctx,
      );
    }
    if (data.sessionTypes !== undefined) {
      await this.coachRepository.replaceSessionTypes(
        coachId,
        data.sessionTypes as CoachSessionTypeValue[],
        ctx,
      );
    }
    if (data.sessionDurations !== undefined) {
      await this.coachRepository.replaceSessionDurations(
        coachId,
        data.sessionDurations as CoachSessionDurationValue[],
        ctx,
      );
    }
  }

  private normalizeCertifications(
    certifications: CoachCertificationInput[],
  ): CoachCertificationInput[] {
    return certifications
      .map((certification) => ({
        name: certification.name.trim(),
        issuingBody: certification.issuingBody?.trim(),
        level: certification.level?.trim(),
      }))
      .filter((certification) => certification.name.length > 0);
  }

  private uniqueValues<T>(values: T[]): T[] {
    return [...new Set(values)];
  }
}
