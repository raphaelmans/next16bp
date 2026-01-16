import { v4 as uuidv4 } from "uuid";
import {
  NotOrganizationOwnerError,
  OrganizationNotFoundError,
} from "@/modules/organization/errors/organization.errors";
import type { IOrganizationRepository } from "@/modules/organization/repositories/organization.repository";
import { STORAGE_BUCKETS } from "@/modules/storage/dtos";
import type { IObjectStorageService } from "@/modules/storage/services/object-storage.service";
import type { PlacePhotoRecord, PlaceRecord } from "@/shared/infra/db/schema";
import { logger } from "@/shared/infra/logger";
import type { RequestContext } from "@/shared/kernel/context";
import type { TransactionManager } from "@/shared/kernel/transaction";
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
  listMyPlaces(userId: string, data: ListMyPlacesDTO): Promise<PlaceRecord[]>;
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

      const created = await this.placeRepository.create(
        {
          organizationId: data.organizationId,
          name: data.name,
          address: data.address,
          city: data.city,
          province: data.province,
          country: "PH",
          latitude: data.latitude,
          longitude: data.longitude,
          timeZone: data.timeZone ?? "Asia/Manila",
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
          viberInfo: data.viberInfo ?? null,
          otherContactInfo: data.otherContactInfo ?? null,
        },
        ctx,
      );

      logger.info(
        {
          event: "place.created",
          placeId: created.id,
          organizationId: data.organizationId,
          userId,
        },
        "Place created",
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

      await this.assertOwner(userId, place.organizationId, ctx);

      const {
        placeId,
        facebookUrl,
        instagramUrl,
        websiteUrl,
        viberInfo,
        otherContactInfo,
        country: _country,
        ...updateData
      } = data;
      const normalizedUpdateData = {
        ...updateData,
        country: "PH",
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
          viberInfo: viberInfo ?? null,
          otherContactInfo: otherContactInfo ?? null,
        },
        ctx,
      );

      logger.info(
        {
          event: "place.updated",
          placeId,
          userId,
          fields: Object.keys(normalizedUpdateData),
        },
        "Place updated",
      );

      return updated;
    });
  }

  async listMyPlaces(
    userId: string,
    data: ListMyPlacesDTO,
  ): Promise<PlaceRecord[]> {
    await this.assertOwner(userId, data.organizationId);
    return this.placeRepository.findByOrganizationId(data.organizationId);
  }

  async getPlaceById(
    userId: string,
    placeId: string,
  ): Promise<PlaceWithDetails> {
    const place = await this.placeRepository.findWithDetails(placeId);
    if (!place) {
      throw new PlaceNotFoundError(placeId);
    }

    await this.assertOwner(userId, place.place.organizationId);
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
            url: result.url,
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
        "Place photo uploaded",
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
      "Place photo removed",
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
