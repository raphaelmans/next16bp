import { STORAGE_BUCKETS } from "@/lib/modules/storage/dtos";
import type { IObjectStorageService } from "@/lib/modules/storage/services/object-storage.service";
import type { ProfileRecord } from "@/lib/shared/infra/db/schema";
import { logger } from "@/lib/shared/infra/logger";
import type { RequestContext } from "@/lib/shared/kernel/context";
import type { TransactionManager } from "@/lib/shared/kernel/transaction";
import type { UpdateProfileDTO } from "../dtos";
import { ProfileNotFoundError } from "../errors/profile.errors";
import type { IProfileRepository } from "../repositories/profile.repository";

export interface IProfileService {
  getProfile(userId: string): Promise<ProfileRecord>;
  getOrCreateProfile(userId: string): Promise<ProfileRecord>;
  getProfileById(profileId: string): Promise<ProfileRecord>;
  updateProfile(userId: string, data: UpdateProfileDTO): Promise<ProfileRecord>;
  uploadAvatar(userId: string, file: File): Promise<string>;
}

export class ProfileService implements IProfileService {
  constructor(
    private profileRepository: IProfileRepository,
    private transactionManager: TransactionManager,
    private storageService: IObjectStorageService,
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

  /**
   * Upload avatar image and update profile.
   * Returns the public URL of the uploaded avatar.
   */
  async uploadAvatar(userId: string, file: File): Promise<string> {
    // Get or create profile first
    const profile = await this.getOrCreateProfile(userId);

    // Generate path: {userId}/avatar.{ext}
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${userId}/avatar.${ext}`;

    // Upload file (upsert to replace existing)
    const result = await this.storageService.upload({
      bucket: STORAGE_BUCKETS.AVATARS,
      path,
      file,
      upsert: true,
    });

    // Update profile with new avatar URL
    await this.profileRepository.update(profile.id, {
      avatarUrl: result.url,
    });

    logger.info(
      {
        event: "profile.avatar_uploaded",
        profileId: profile.id,
        userId,
        url: result.url,
      },
      "Profile avatar uploaded",
    );

    return result.url;
  }
}
