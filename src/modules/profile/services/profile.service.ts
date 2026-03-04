import type { ProfileRecord } from "@/shared/infra/db/schema";
import { logger } from "@/shared/infra/logger";
import type { RequestContext } from "@/shared/kernel/context";
import type { TransactionManager } from "@/shared/kernel/transaction";
import type { UpdateProfileDTO } from "../dtos/update-profile.dto";
import { ProfileNotFoundError } from "../errors/profile.errors";
import type { IProfileRepository } from "../repositories/profile.repository";

export interface IProfileService {
  getProfile(userId: string): Promise<ProfileRecord>;
  getOrCreateProfile(
    userId: string,
    fallbackEmail?: string | null,
  ): Promise<ProfileRecord>;
  updateProfile(
    userId: string,
    data: UpdateProfileDTO,
    fallbackEmail?: string | null,
  ): Promise<ProfileRecord>;
}

export class ProfileService implements IProfileService {
  constructor(
    private profileRepository: IProfileRepository,
    private transactionManager: TransactionManager,
  ) {}

  async getProfile(userId: string): Promise<ProfileRecord> {
    const profile = await this.profileRepository.findByUserId(userId);
    if (!profile) {
      throw new ProfileNotFoundError(userId);
    }
    return profile;
  }

  async getOrCreateProfile(
    userId: string,
    fallbackEmail?: string | null,
  ): Promise<ProfileRecord> {
    const existing = await this.profileRepository.findByUserId(userId);
    if (existing) {
      return existing;
    }

    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };
      const existingInTx = await this.profileRepository.findByUserId(
        userId,
        ctx,
      );
      if (existingInTx) {
        return existingInTx;
      }

      const created = await this.profileRepository.create(
        {
          userId,
          email: fallbackEmail ?? null,
        },
        ctx,
      );

      logger.info(
        {
          event: "profile.created",
          profileId: created.id,
          userId: created.userId,
        },
        "Profile created",
      );

      return created;
    });
  }

  async updateProfile(
    userId: string,
    data: UpdateProfileDTO,
    fallbackEmail?: string | null,
  ): Promise<ProfileRecord> {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };
      const existing = await this.profileRepository.findByUserId(userId, ctx);
      const profile =
        existing ??
        (await this.profileRepository.create(
          {
            userId,
            email: fallbackEmail ?? null,
          },
          ctx,
        ));

      const updated = await this.profileRepository.update(
        profile.id,
        data,
        ctx,
      );

      logger.info(
        {
          event: "profile.updated",
          profileId: updated.id,
          userId: updated.userId,
          fields: Object.keys(data),
        },
        "Profile updated",
      );

      return updated;
    });
  }
}
