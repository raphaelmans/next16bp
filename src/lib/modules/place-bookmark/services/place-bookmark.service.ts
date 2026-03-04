import type { IProfileRepository } from "@/lib/modules/profile/repositories/profile.repository";
import { logger } from "@/lib/shared/infra/logger";
import type {
  IPlaceBookmarkRepository,
  PlaceBookmarkListItem,
} from "../repositories/place-bookmark.repository";

export interface IPlaceBookmarkService {
  toggle(userId: string, placeId: string): Promise<{ bookmarked: boolean }>;
  isBookmarked(userId: string, placeId: string): Promise<boolean>;
  getBookmarkedPlaceIds(userId: string, placeIds: string[]): Promise<string[]>;
  listBookmarks(
    userId: string,
    params: { limit: number; offset: number },
  ): Promise<{ items: PlaceBookmarkListItem[]; total: number }>;
}

export class PlaceBookmarkService implements IPlaceBookmarkService {
  constructor(
    private placeBookmarkRepository: IPlaceBookmarkRepository,
    private profileRepository: IProfileRepository,
  ) {}

  private async resolveProfileId(userId: string): Promise<string> {
    const profile = await this.profileRepository.findByUserId(userId);
    if (!profile) {
      throw new Error("Profile not found for user");
    }
    return profile.id;
  }

  async toggle(
    userId: string,
    placeId: string,
  ): Promise<{ bookmarked: boolean }> {
    const profileId = await this.resolveProfileId(userId);
    const exists = await this.placeBookmarkRepository.existsByProfileAndPlace(
      profileId,
      placeId,
    );

    if (exists) {
      await this.placeBookmarkRepository.deleteByProfileAndPlace(
        profileId,
        placeId,
      );
      logger.info(
        { event: "place_bookmark.toggled", userId, placeId, bookmarked: false },
        "Place bookmark removed",
      );
      return { bookmarked: false };
    }

    await this.placeBookmarkRepository.create(profileId, placeId);
    logger.info(
      { event: "place_bookmark.toggled", userId, placeId, bookmarked: true },
      "Place bookmark added",
    );
    return { bookmarked: true };
  }

  async isBookmarked(userId: string, placeId: string): Promise<boolean> {
    const profileId = await this.resolveProfileId(userId);
    return this.placeBookmarkRepository.existsByProfileAndPlace(
      profileId,
      placeId,
    );
  }

  async getBookmarkedPlaceIds(
    userId: string,
    placeIds: string[],
  ): Promise<string[]> {
    const profileId = await this.resolveProfileId(userId);
    return this.placeBookmarkRepository.findBookmarkedPlaceIds(
      profileId,
      placeIds,
    );
  }

  async listBookmarks(
    userId: string,
    params: { limit: number; offset: number },
  ): Promise<{ items: PlaceBookmarkListItem[]; total: number }> {
    const profileId = await this.resolveProfileId(userId);
    return this.placeBookmarkRepository.listByProfile(profileId, params);
  }
}
