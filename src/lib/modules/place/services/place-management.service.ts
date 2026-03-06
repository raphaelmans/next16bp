import { v4 as uuidv4 } from "uuid";
import { DEFAULT_COUNTRY, DEFAULT_TIME_ZONE } from "@/common/location-defaults";
import {
  NotOrganizationOwnerError,
  OrganizationNotFoundError,
} from "@/lib/modules/organization/errors/organization.errors";
import type { IOrganizationRepository } from "@/lib/modules/organization/repositories/organization.repository";
import type { IOrganizationMemberService } from "@/lib/modules/organization-member/services/organization-member.service";
import { STORAGE_BUCKETS } from "@/lib/modules/storage/dtos";
import type { IObjectStorageService } from "@/lib/modules/storage/services/object-storage.service";
import type {
  InsertPlace,
  PlacePhotoRecord,
  PlaceRecord,
  PlaceVerificationRecord,
} from "@/lib/shared/infra/db/schema";
import { logger } from "@/lib/shared/infra/logger";
import type { RequestContext } from "@/lib/shared/kernel/context";
import type { TransactionManager } from "@/lib/shared/kernel/transaction";
import type {
  CreatePlaceDTO,
  ListMyPlacesDTO,
  ReorderPlacePhotosDTO,
  UpdatePlaceDTO,
} from "../dtos";
import {
  MaxPlacePhotosExceededError,
  NotPlaceOwnerError,
  PlaceNotFoundError,
  PlacePhotoNotFoundError,
  PlacePhotoOrderInvalidError,
} from "../errors/place.errors";
import { resolvePlaceSlug } from "../helpers";
import type {
  IPlaceRepository,
  PlaceWithDetails,
} from "../repositories/place.repository";
import type { IPlacePhotoRepository } from "../repositories/place-photo.repository";

const MAX_PLACE_PHOTOS = 10;

function extractPublicStoragePath(url: string, bucket: string): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return url.slice(index + marker.length);
}

export interface IPlaceManagementService {
  createPlace(userId: string, data: CreatePlaceDTO): Promise<PlaceRecord>;
  updatePlace(userId: string, data: UpdatePlaceDTO): Promise<PlaceRecord>;
  deletePlace(userId: string, placeId: string): Promise<void>;
  listMyPlaces(
    userId: string,
    data: ListMyPlacesDTO,
  ): Promise<
    (PlaceRecord & { verification: PlaceVerificationRecord | null })[]
  >;
  getPlaceById(userId: string, placeId: string): Promise<PlaceWithDetails>;
  uploadPhoto(
    userId: string,
    placeId: string,
    file: File,
  ): Promise<PlacePhotoRecord>;
  removePhoto(userId: string, placeId: string, photoId: string): Promise<void>;
  reorderPhotos(
    userId: string,
    placeId: string,
    orderedIds: ReorderPlacePhotosDTO["orderedIds"],
  ): Promise<PlacePhotoRecord[]>;
}

export class PlaceManagementService implements IPlaceManagementService {
  constructor(
    private placeRepository: IPlaceRepository,
    private placePhotoRepository: IPlacePhotoRepository,
    private organizationRepository: IOrganizationRepository,
    private organizationMemberService: IOrganizationMemberService,
    private transactionManager: TransactionManager,
    private storageService: IObjectStorageService,
  ) {}

  async createPlace(
    userId: string,
    data: CreatePlaceDTO,
  ): Promise<PlaceRecord> {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };

      const organization = await this.organizationRepository.findById(
        data.organizationId,
        ctx,
      );
      if (!organization) {
        throw new OrganizationNotFoundError(data.organizationId);
      }
      if (organization.ownerUserId !== userId) {
        throw new NotOrganizationOwnerError();
      }

      const slug = await resolvePlaceSlug({
        fallbackName: data.name,
        findBySlug: this.placeRepository.findBySlug.bind(this.placeRepository),
        ctx,
      });

      const created = await this.placeRepository.create(
        {
          organizationId: data.organizationId,
          name: data.name,
          slug,
          address: data.address,
          city: data.city,
          province: data.province,
          country: DEFAULT_COUNTRY,
          latitude: data.latitude,
          longitude: data.longitude,
          timeZone: DEFAULT_TIME_ZONE,
          placeType: "RESERVABLE",
          claimStatus: "CLAIMED",
          isActive: true,
        },
        ctx,
      );

      await this.placeRepository.upsertContactDetail(
        {
          placeId: created.id,
          facebookUrl: data.facebookUrl ?? null,
          instagramUrl: data.instagramUrl ?? null,
          websiteUrl: data.websiteUrl ?? null,
          phoneNumber: data.phoneNumber ?? null,
          viberInfo: data.viberInfo ?? null,
          otherContactInfo: data.otherContactInfo ?? null,
        },
        ctx,
      );

      if (data.amenities && data.amenities.length > 0) {
        const normalizedAmenities = Array.from(
          new Set(
            data.amenities
              .map((amenity) => amenity.trim())
              .filter((amenity) => amenity.length > 0),
          ),
        );

        await this.placeRepository.createAmenities(
          created.id,
          normalizedAmenities,
          ctx,
        );
      }

      logger.info(
        {
          event: "place.created",
          placeId: created.id,
          organizationId: data.organizationId,
          userId,
        },
        "Venue created",
      );

      return created;
    });
  }

  async updatePlace(
    userId: string,
    data: UpdatePlaceDTO,
  ): Promise<PlaceRecord> {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };

      const place = await this.placeRepository.findById(data.placeId, ctx);
      if (!place) {
        throw new PlaceNotFoundError(data.placeId);
      }

      await this.assertPlaceManageAccess(userId, place.organizationId, ctx);

      const {
        placeId,
        amenities,
        facebookUrl,
        instagramUrl,
        websiteUrl,
        phoneNumber,
        viberInfo,
        otherContactInfo,
        ...updateData
      } = data;

      let resolvedSlug: string | undefined;
      if (data.name || !place.slug) {
        resolvedSlug = await resolvePlaceSlug({
          fallbackName: data.name ?? place.name,
          findBySlug: this.placeRepository.findBySlug.bind(
            this.placeRepository,
          ),
          ctx,
          excludePlaceId: place.id,
        });
      }

      const normalizedUpdateData: Partial<InsertPlace> & {
        country: string;
      } = {
        ...updateData,
        country: DEFAULT_COUNTRY,
        timeZone: DEFAULT_TIME_ZONE,
        ...(resolvedSlug !== undefined ? { slug: resolvedSlug } : {}),
      };
      const updated = await this.placeRepository.update(
        placeId,
        normalizedUpdateData,
        ctx,
      );

      await this.placeRepository.upsertContactDetail(
        {
          placeId,
          facebookUrl: facebookUrl ?? null,
          instagramUrl: instagramUrl ?? null,
          websiteUrl: websiteUrl ?? null,
          phoneNumber: phoneNumber ?? null,
          viberInfo: viberInfo ?? null,
          otherContactInfo: otherContactInfo ?? null,
        },
        ctx,
      );

      if (amenities !== undefined) {
        const normalizedAmenities = Array.from(
          new Set(
            amenities
              .map((amenity) => amenity.trim())
              .filter((amenity) => amenity.length > 0),
          ),
        );

        await this.placeRepository.replaceAmenitiesByPlaceId(
          placeId,
          normalizedAmenities,
          ctx,
        );
      }

      logger.info(
        {
          event: "place.updated",
          placeId,
          userId,
          fields: Object.keys(normalizedUpdateData),
        },
        "Venue updated",
      );

      return updated;
    });
  }

  async deletePlace(userId: string, placeId: string): Promise<void> {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };

      const place = await this.placeRepository.findByIdForUpdate(placeId, ctx);
      if (!place) {
        throw new PlaceNotFoundError(placeId);
      }

      await this.assertOwner(userId, place.organizationId, ctx);

      await this.placeRepository.delete(placeId, ctx);

      logger.info(
        {
          event: "place.deleted",
          placeId,
          organizationId: place.organizationId,
          userId,
        },
        "Venue deleted",
      );
    });
  }

  async listMyPlaces(
    userId: string,
    data: ListMyPlacesDTO,
  ): Promise<
    (PlaceRecord & { verification: PlaceVerificationRecord | null })[]
  > {
    await this.assertPlaceManageAccess(userId, data.organizationId);
    return this.placeRepository.findByOrganizationIdWithVerification(
      data.organizationId,
    );
  }

  async getPlaceById(
    userId: string,
    placeId: string,
  ): Promise<PlaceWithDetails> {
    const place = await this.placeRepository.findWithDetails(placeId);
    if (!place) {
      throw new PlaceNotFoundError(placeId);
    }

    await this.assertPlaceManageAccess(userId, place.place.organizationId);
    return place;
  }

  async uploadPhoto(
    userId: string,
    placeId: string,
    file: File,
  ): Promise<PlacePhotoRecord> {
    const place = await this.placeRepository.findById(placeId);
    if (!place) {
      throw new PlaceNotFoundError(placeId);
    }

    await this.assertOwner(userId, place.organizationId);

    const photoCount = await this.placePhotoRepository.countByPlaceId(placeId);
    if (photoCount >= MAX_PLACE_PHOTOS) {
      throw new MaxPlacePhotosExceededError(MAX_PLACE_PHOTOS);
    }

    const photoId = uuidv4();
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${placeId}/${photoId}.${ext}`;

    const result = await this.storageService.upload({
      bucket: STORAGE_BUCKETS.PLACE_PHOTOS,
      path,
      file,
      upsert: false,
    });

    const publicUrl = result.url;
    if (!publicUrl) {
      throw new Error("Expected public URL for place photo upload");
    }

    try {
      const created = await this.transactionManager.run(async (tx) => {
        const ctx: RequestContext = { tx };
        const photos = await this.placePhotoRepository.findByPlaceId(
          placeId,
          ctx,
        );
        const nextOrder =
          photos.length > 0
            ? Math.max(...photos.map((p) => p.displayOrder)) + 1
            : 0;

        return this.placePhotoRepository.create(
          {
            placeId,
            url: publicUrl,
            displayOrder: nextOrder,
          },
          ctx,
        );
      });

      logger.info(
        {
          event: "place.photo_uploaded",
          placeId,
          photoId: created.id,
          userId,
        },
        "Venue photo uploaded",
      );

      return created;
    } catch (error) {
      try {
        await this.storageService.delete(STORAGE_BUCKETS.PLACE_PHOTOS, path);
      } catch (deleteError) {
        logger.warn(
          {
            event: "place.photo_upload_cleanup_failed",
            placeId,
            path,
            err: deleteError,
          },
          "Failed to cleanup uploaded place photo",
        );
      }

      throw error;
    }
  }

  async removePhoto(userId: string, placeId: string, photoId: string) {
    const place = await this.placeRepository.findById(placeId);
    if (!place) {
      throw new PlaceNotFoundError(placeId);
    }

    await this.assertOwner(userId, place.organizationId);

    const photo = await this.placePhotoRepository.findById(photoId);
    if (!photo || photo.placeId !== placeId) {
      throw new PlacePhotoNotFoundError(photoId);
    }

    const path = extractPublicStoragePath(
      photo.url,
      STORAGE_BUCKETS.PLACE_PHOTOS,
    );
    if (!path) {
      throw new PlacePhotoOrderInvalidError();
    }

    await this.storageService.delete(STORAGE_BUCKETS.PLACE_PHOTOS, path);

    await this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };
      await this.placePhotoRepository.delete(photoId, ctx);
    });

    logger.info(
      {
        event: "place.photo_removed",
        placeId,
        photoId,
        userId,
      },
      "Venue photo removed",
    );
  }

  async reorderPhotos(
    userId: string,
    placeId: string,
    orderedIds: ReorderPlacePhotosDTO["orderedIds"],
  ): Promise<PlacePhotoRecord[]> {
    const place = await this.placeRepository.findById(placeId);
    if (!place) {
      throw new PlaceNotFoundError(placeId);
    }

    await this.assertOwner(userId, place.organizationId);

    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };
      const photos = await this.placePhotoRepository.findByPlaceId(
        placeId,
        ctx,
      );
      const existingIds = new Set(photos.map((p) => p.id));

      if (orderedIds.length !== photos.length) {
        throw new PlacePhotoOrderInvalidError();
      }

      const orderedIdSet = new Set(orderedIds);
      if (orderedIdSet.size !== orderedIds.length) {
        throw new PlacePhotoOrderInvalidError();
      }

      for (const id of orderedIds) {
        if (!existingIds.has(id)) {
          throw new PlacePhotoOrderInvalidError();
        }
      }

      await Promise.all(
        orderedIds.map((id, index) =>
          this.placePhotoRepository.updateDisplayOrder(id, index, ctx),
        ),
      );

      return this.placePhotoRepository.findByPlaceId(placeId, ctx);
    });
  }

  private async assertPlaceManageAccess(
    userId: string,
    organizationId?: string | null,
    ctx?: RequestContext,
  ): Promise<void> {
    if (!organizationId) {
      throw new NotPlaceOwnerError();
    }

    await this.organizationMemberService.assertOrganizationPermission(
      userId,
      organizationId,
      "place.manage",
      ctx,
    );
  }

  private async assertOwner(
    userId: string,
    organizationId?: string | null,
    ctx?: RequestContext,
  ): Promise<void> {
    if (!organizationId) {
      throw new NotPlaceOwnerError();
    }

    const organization = await this.organizationRepository.findById(
      organizationId,
      ctx,
    );
    if (!organization) {
      throw new OrganizationNotFoundError(organizationId);
    }
    if (organization.ownerUserId !== userId) {
      throw new NotPlaceOwnerError();
    }
  }
}
