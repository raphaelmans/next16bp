import { v4 as uuidv4 } from "uuid";
import type { IOrganizationRepository } from "@/modules/organization/repositories/organization.repository";
import { STORAGE_BUCKETS } from "@/modules/storage/dtos";
import type { IObjectStorageService } from "@/modules/storage/services/object-storage.service";
import type {
  CourtAmenityRecord,
  CourtPhotoRecord,
  CourtRecord,
  ReservableCourtDetailRecord,
} from "@/shared/infra/db/schema";
import { logger } from "@/shared/infra/logger";
import type { RequestContext } from "@/shared/kernel/context";
import type { TransactionManager } from "@/shared/kernel/transaction";
import type {
  AddAmenityDTO,
  AddPhotoDTO,
  RemoveAmenityDTO,
  RemovePhotoDTO,
  ReorderPhotosDTO,
  UpdateCourtDTO,
  UpdateReservableCourtDetailDTO,
} from "../dtos";
import {
  AmenityNotFoundError,
  CourtNotFoundError,
  CourtNotReservableError,
  DuplicateAmenityError,
  MaxPhotosExceededError,
  NotCourtOwnerError,
  PhotoNotFoundError,
} from "../errors/court.errors";
import type {
  CourtWithDetails,
  ICourtRepository,
} from "../repositories/court.repository";
import type { ICourtAmenityRepository } from "../repositories/court-amenity.repository";
import type { ICourtPhotoRepository } from "../repositories/court-photo.repository";
import type { IReservableCourtDetailRepository } from "../repositories/reservable-court-detail.repository";

const MAX_PHOTOS = 10;

export interface ICourtManagementService {
  // Court operations
  getCourtById(courtId: string): Promise<CourtWithDetails>;
  getMyCourts(userId: string): Promise<CourtRecord[]>;
  updateCourt(userId: string, data: UpdateCourtDTO): Promise<CourtRecord>;
  updateReservableCourtDetail(
    userId: string,
    data: UpdateReservableCourtDetailDTO,
  ): Promise<ReservableCourtDetailRecord>;
  deactivateCourt(userId: string, courtId: string): Promise<CourtRecord>;

  // Photo operations
  uploadPhoto(
    userId: string,
    courtId: string,
    file: File,
  ): Promise<CourtPhotoRecord>;
  addPhoto(userId: string, data: AddPhotoDTO): Promise<CourtPhotoRecord>;
  removePhoto(userId: string, data: RemovePhotoDTO): Promise<void>;
  reorderPhotos(userId: string, data: ReorderPhotosDTO): Promise<void>;

  // Amenity operations
  addAmenity(userId: string, data: AddAmenityDTO): Promise<CourtAmenityRecord>;
  removeAmenity(userId: string, data: RemoveAmenityDTO): Promise<void>;
}

export class CourtManagementService implements ICourtManagementService {
  constructor(
    private courtRepository: ICourtRepository,
    private reservableCourtDetailRepository: IReservableCourtDetailRepository,
    private courtPhotoRepository: ICourtPhotoRepository,
    private courtAmenityRepository: ICourtAmenityRepository,
    private organizationRepository: IOrganizationRepository,
    private transactionManager: TransactionManager,
    private storageService: IObjectStorageService,
  ) {}

  /**
   * Verify that the user owns the court via organization ownership
   */
  private async verifyCourtOwnership(
    userId: string,
    courtId: string,
    ctx?: RequestContext,
  ): Promise<CourtRecord> {
    const court = await this.courtRepository.findById(courtId, ctx);
    if (!court) {
      throw new CourtNotFoundError(courtId);
    }

    if (!court.organizationId) {
      throw new NotCourtOwnerError();
    }

    const org = await this.organizationRepository.findById(
      court.organizationId,
      ctx,
    );
    if (!org || org.ownerUserId !== userId) {
      throw new NotCourtOwnerError();
    }

    return court;
  }

  async getCourtById(courtId: string): Promise<CourtWithDetails> {
    const court = await this.courtRepository.findWithDetails(courtId);
    if (!court) {
      throw new CourtNotFoundError(courtId);
    }
    return court;
  }

  async getMyCourts(userId: string): Promise<CourtRecord[]> {
    // Get all organizations owned by the user
    const orgs = await this.organizationRepository.findByOwnerId(userId);

    // Get all courts for those organizations
    const allCourts: CourtRecord[] = [];
    for (const org of orgs) {
      const courts = await this.courtRepository.findByOrganizationId(org.id);
      allCourts.push(...courts);
    }

    return allCourts;
  }

  async updateCourt(
    userId: string,
    data: UpdateCourtDTO,
  ): Promise<CourtRecord> {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };

      await this.verifyCourtOwnership(userId, data.courtId, ctx);

      const { courtId, ...updateData } = data;
      const updated = await this.courtRepository.update(
        courtId,
        updateData,
        ctx,
      );

      logger.info(
        {
          event: "court.updated",
          courtId,
          userId,
          fields: Object.keys(updateData),
        },
        "Court updated",
      );

      return updated;
    });
  }

  async updateReservableCourtDetail(
    userId: string,
    data: UpdateReservableCourtDetailDTO,
  ): Promise<ReservableCourtDetailRecord> {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };

      const court = await this.verifyCourtOwnership(userId, data.courtId, ctx);

      if (court.courtType !== "RESERVABLE") {
        throw new CourtNotReservableError(data.courtId);
      }

      const detail = await this.reservableCourtDetailRepository.findByCourtId(
        data.courtId,
        ctx,
      );
      if (!detail) {
        throw new CourtNotFoundError(data.courtId);
      }

      const { courtId, ...updateData } = data;
      const updated = await this.reservableCourtDetailRepository.update(
        detail.id,
        updateData,
        ctx,
      );

      logger.info(
        {
          event: "court.detail_updated",
          courtId,
          userId,
          fields: Object.keys(updateData),
        },
        "Court detail updated",
      );

      return updated;
    });
  }

  async deactivateCourt(userId: string, courtId: string): Promise<CourtRecord> {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };

      await this.verifyCourtOwnership(userId, courtId, ctx);

      const updated = await this.courtRepository.update(
        courtId,
        { isActive: false },
        ctx,
      );

      logger.info(
        {
          event: "court.deactivated",
          courtId,
          userId,
        },
        "Court deactivated",
      );

      return updated;
    });
  }

  /**
   * Upload a photo to storage and add it to the court.
   */
  async uploadPhoto(
    userId: string,
    courtId: string,
    file: File,
  ): Promise<CourtPhotoRecord> {
    // Verify ownership first (outside transaction for fail-fast)
    await this.verifyCourtOwnership(userId, courtId);

    // Check photo limit
    const photoCount = await this.courtPhotoRepository.countByCourtId(courtId);
    if (photoCount >= MAX_PHOTOS) {
      throw new MaxPhotosExceededError(MAX_PHOTOS);
    }

    // Generate unique path: {courtId}/{uuid}.{ext}
    const photoId = uuidv4();
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${courtId}/${photoId}.${ext}`;

    // Upload to storage
    const result = await this.storageService.upload({
      bucket: STORAGE_BUCKETS.COURT_PHOTOS,
      path,
      file,
      upsert: false,
    });

    // Add photo record using existing logic
    const photo = await this.addPhoto(userId, {
      courtId,
      url: result.url,
    });

    logger.info(
      {
        event: "court.photo_uploaded",
        courtId,
        photoId: photo.id,
        url: result.url,
      },
      "Court photo uploaded",
    );

    return photo;
  }

  async addPhoto(userId: string, data: AddPhotoDTO): Promise<CourtPhotoRecord> {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };

      await this.verifyCourtOwnership(userId, data.courtId, ctx);

      // Check photo limit
      const photoCount = await this.courtPhotoRepository.countByCourtId(
        data.courtId,
        ctx,
      );
      if (photoCount >= MAX_PHOTOS) {
        throw new MaxPhotosExceededError(MAX_PHOTOS);
      }

      // Determine display order
      const displayOrder = data.displayOrder ?? photoCount;

      const photo = await this.courtPhotoRepository.create(
        {
          courtId: data.courtId,
          url: data.url,
          displayOrder,
        },
        ctx,
      );

      logger.info(
        {
          event: "court.photo_added",
          courtId: data.courtId,
          photoId: photo.id,
          userId,
        },
        "Photo added to court",
      );

      return photo;
    });
  }

  async removePhoto(userId: string, data: RemovePhotoDTO): Promise<void> {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };

      await this.verifyCourtOwnership(userId, data.courtId, ctx);

      const photo = await this.courtPhotoRepository.findById(data.photoId, ctx);
      if (!photo || photo.courtId !== data.courtId) {
        throw new PhotoNotFoundError(data.photoId);
      }

      await this.courtPhotoRepository.delete(data.photoId, ctx);

      logger.info(
        {
          event: "court.photo_removed",
          courtId: data.courtId,
          photoId: data.photoId,
          userId,
        },
        "Photo removed from court",
      );
    });
  }

  async reorderPhotos(userId: string, data: ReorderPhotosDTO): Promise<void> {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };

      await this.verifyCourtOwnership(userId, data.courtId, ctx);

      // Update display order for each photo
      for (let i = 0; i < data.photoIds.length; i++) {
        await this.courtPhotoRepository.updateDisplayOrder(
          data.photoIds[i],
          i,
          ctx,
        );
      }

      logger.info(
        {
          event: "court.photos_reordered",
          courtId: data.courtId,
          userId,
        },
        "Photos reordered",
      );
    });
  }

  async addAmenity(
    userId: string,
    data: AddAmenityDTO,
  ): Promise<CourtAmenityRecord> {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };

      await this.verifyCourtOwnership(userId, data.courtId, ctx);

      // Check for duplicate
      const exists = await this.courtAmenityRepository.exists(
        data.courtId,
        data.name,
        ctx,
      );
      if (exists) {
        throw new DuplicateAmenityError(data.courtId, data.name);
      }

      const amenity = await this.courtAmenityRepository.create(
        {
          courtId: data.courtId,
          name: data.name,
        },
        ctx,
      );

      logger.info(
        {
          event: "court.amenity_added",
          courtId: data.courtId,
          amenityId: amenity.id,
          amenityName: data.name,
          userId,
        },
        "Amenity added to court",
      );

      return amenity;
    });
  }

  async removeAmenity(userId: string, data: RemoveAmenityDTO): Promise<void> {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };

      await this.verifyCourtOwnership(userId, data.courtId, ctx);

      const amenity = await this.courtAmenityRepository.findById(
        data.amenityId,
        ctx,
      );
      if (!amenity || amenity.courtId !== data.courtId) {
        throw new AmenityNotFoundError(data.amenityId);
      }

      await this.courtAmenityRepository.delete(data.amenityId, ctx);

      logger.info(
        {
          event: "court.amenity_removed",
          courtId: data.courtId,
          amenityId: data.amenityId,
          userId,
        },
        "Amenity removed from court",
      );
    });
  }
}
