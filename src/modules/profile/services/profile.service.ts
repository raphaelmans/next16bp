import type { TransactionManager } from "@/shared/kernel/transaction";
import type { RequestContext } from "@/shared/kernel/context";
import type { IProfileRepository } from "../repositories/profile.repository";
import type { ProfileRecord } from "@/shared/infra/db/schema";
import type { UpdateProfileDTO } from "../dtos";
import { ProfileNotFoundError } from "../errors/profile.errors";
import { logger } from "@/shared/infra/logger";

export interface IProfileService {
  getProfile(userId: string): Promise<ProfileRecord>;
  getOrCreateProfile(userId: string): Promise<ProfileRecord>;
  getProfileById(profileId: string): Promise<ProfileRecord>;
  updateProfile(userId: string, data: UpdateProfileDTO): Promise<ProfileRecord>;
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

  async getProfileById(profileId: string): Promise<ProfileRecord> {
    const profile = await this.profileRepository.findById(profileId);
    if (!profile) {
      throw new ProfileNotFoundError(profileId);
    }
    return profile;
  }

  async getOrCreateProfile(userId: string): Promise<ProfileRecord> {
    // First, try to find existing profile
    const existing = await this.profileRepository.findByUserId(userId);
    if (existing) {
      return existing;
    }

    // Create new profile if none exists
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };

      // Double-check within transaction to prevent race conditions
      const existingInTx = await this.profileRepository.findByUserId(
        userId,
        ctx,
      );
      if (existingInTx) {
        return existingInTx;
      }

      const newProfile = await this.profileRepository.create({ userId }, ctx);

      logger.info(
        {
          event: "profile.created",
          profileId: newProfile.id,
          userId: newProfile.userId,
        },
        "Profile auto-created for user",
      );

      return newProfile;
    });
  }

  async updateProfile(
    userId: string,
    data: UpdateProfileDTO,
  ): Promise<ProfileRecord> {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };

      // Get or create profile first
      let profile = await this.profileRepository.findByUserId(userId, ctx);

      if (!profile) {
        // Auto-create if doesn't exist
        profile = await this.profileRepository.create({ userId }, ctx);
        logger.info(
          {
            event: "profile.created",
            profileId: profile.id,
            userId: profile.userId,
          },
          "Profile auto-created during update",
        );
      }

      // Update the profile
      const updatedProfile = await this.profileRepository.update(
        profile.id,
        data,
        ctx,
      );

      logger.info(
        {
          event: "profile.updated",
          profileId: updatedProfile.id,
          userId: updatedProfile.userId,
          fields: Object.keys(data),
        },
        "Profile updated",
      );

      return updatedProfile;
    });
  }
}
