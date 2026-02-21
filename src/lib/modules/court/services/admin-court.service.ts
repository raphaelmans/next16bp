import { randomUUID } from "node:crypto";
import type { ICourtHoursRepository } from "@/lib/modules/court-hours/repositories/court-hours.repository";
import type { ICourtRateRuleRepository } from "@/lib/modules/court-rate-rule/repositories/court-rate-rule.repository";
import { OrganizationNotFoundError } from "@/lib/modules/organization/errors/organization.errors";
import type { IOrganizationRepository } from "@/lib/modules/organization/repositories/organization.repository";
import type { PlaceOnboardingStatus } from "@/lib/modules/owner-setup/shared";
import {
  computePlaceOnboardingStatus,
  normalizeVerificationStatus,
} from "@/lib/modules/owner-setup/shared";
import {
  MaxPlacePhotosExceededError,
  PlaceNotFoundError,
  PlacePhotoNotFoundError,
  PlacePhotoOrderInvalidError,
} from "@/lib/modules/place/errors/place.errors";
import { resolvePlaceSlug } from "@/lib/modules/place/helpers";
import type { IPlaceVerificationRepository } from "@/lib/modules/place-verification/repositories/place-verification.repository";
import { STORAGE_BUCKETS } from "@/lib/modules/storage/dtos";
import type { IObjectStorageService } from "@/lib/modules/storage/services/object-storage.service";
import type { PlaceRecord } from "@/lib/shared/infra/db/schema";
import { logger } from "@/lib/shared/infra/logger";
import type { RequestContext } from "@/lib/shared/kernel/context";
import type { TransactionManager } from "@/lib/shared/kernel/transaction";
import type {
  AdminCourtDetailDTO,
  AdminCourtFiltersDTO,
  AdminUpdateCourtDTO,
  CreateCuratedCourtDTO,
  RecuratePlaceDTO,
  RemoveCourtPhotoDTO,
  TransferPlaceDTO,
  UploadCourtPhotoInput,
} from "../dtos";
import {
  PlaceAlreadyCuratedError,
  PlaceFeaturedRankTakenError,
  PlaceProvinceRankTakenError,
} from "../errors/court.errors";
import type {
  AdminPlaceDetails,
  CreatedCuratedPlace,
  IAdminCourtRepository,
  PaginatedAdminPlaces,
} from "../repositories/admin-court.repository";

export type CuratedBatchResultStatus =
  | "created"
  | "skipped_duplicate"
  | "error";

export interface CuratedBatchResultItem {
  index: number;
  status: CuratedBatchResultStatus;
  placeId?: string;
  message?: string;
}

export interface CuratedBatchResultSummary {
  total: number;
  created: number;
  skipped: number;
  failed: number;
}

export interface CuratedBatchResult {
  summary: CuratedBatchResultSummary;
  items: CuratedBatchResultItem[];
}

export interface IAdminCourtService {
  createCuratedPlace(
    adminUserId: string,
    data: CreateCuratedCourtDTO,
  ): Promise<CreatedCuratedPlace>;
  createCuratedPlacesBatch(
    adminUserId: string,
    items: CreateCuratedCourtDTO[],
  ): Promise<CuratedBatchResult>;
  getPlaceById(
    adminUserId: string,
    data: AdminCourtDetailDTO,
    ctx?: RequestContext,
  ): Promise<AdminPlaceDetails>;
  uploadPhoto(
    adminUserId: string,
    data: UploadCourtPhotoInput,
  ): Promise<{ url: string }>;
  removePhoto(adminUserId: string, data: RemoveCourtPhotoDTO): Promise<void>;
  updatePlace(
    adminUserId: string,
    data: AdminUpdateCourtDTO,
  ): Promise<PlaceRecord>;
  deactivatePlace(
    adminUserId: string,
    placeId: string,
    reason: string,
  ): Promise<PlaceRecord>;
  activatePlace(adminUserId: string, placeId: string): Promise<PlaceRecord>;
  deletePlaceHard(adminUserId: string, placeId: string): Promise<void>;
  listAllPlaces(
    filters: AdminCourtFiltersDTO,
    ctx?: RequestContext,
  ): Promise<PaginatedAdminPlaces>;

  transferPlaceToOrganization(
    adminUserId: string,
    data: TransferPlaceDTO,
  ): Promise<PlaceRecord>;
  recuratePlace(
    adminUserId: string,
    data: RecuratePlaceDTO,
  ): Promise<PlaceRecord>;
  getStats(): Promise<{ total: number; reservable: number }>;
  getPlaceOnboardingStatus(
    adminUserId: string,
    data: AdminCourtDetailDTO,
  ): Promise<PlaceOnboardingStatus>;
}

export class AdminCourtService implements IAdminCourtService {
  constructor(
    private adminCourtRepository: IAdminCourtRepository,
    private transactionManager: TransactionManager,
    private storageService: IObjectStorageService,
    private organizationRepository: IOrganizationRepository,
    private placeVerificationRepository: IPlaceVerificationRepository,
    private courtHoursRepository: ICourtHoursRepository,
    private courtRateRuleRepository: ICourtRateRuleRepository,
  ) {}

  private extractPublicStoragePath(url: string, bucket: string): string | null {
    const marker = `/storage/v1/object/public/${bucket}/`;
    const index = url.indexOf(marker);
    if (index === -1) return null;
    return url.slice(index + marker.length);
  }

  async createCuratedPlace(
    adminUserId: string,
    data: CreateCuratedCourtDTO,
  ): Promise<CreatedCuratedPlace> {
    return this.transactionManager.run(async (tx) => {
      const ctx = { tx };

      const slug = await resolvePlaceSlug({
        fallbackName: data.name,
        findBySlug: this.adminCourtRepository.findBySlug.bind(
          this.adminCourtRepository,
        ),
        ctx,
      });

      // 1. Create place (no organization - admin-created)
      const placeRecord = await this.adminCourtRepository.create(
        {
          organizationId: null,
          name: data.name,
          slug,
          address: data.address,
          city: data.city,
          province: data.province,
          country: "PH",
          latitude: data.latitude ?? null,
          longitude: data.longitude ?? null,
          extGPlaceId: data.extGPlaceId ?? null,
          timeZone: data.timeZone ?? "Asia/Manila",
          placeType: "CURATED",
          claimStatus: "UNCLAIMED",
          isActive: true,
        },
        ctx,
      );

      // 2. Create curated detail
      const detail = await this.adminCourtRepository.createCuratedDetail(
        {
          placeId: placeRecord.id,
          facebookUrl: data.facebookUrl,
          phoneNumber: data.phoneNumber,
          viberInfo: data.viberInfo,
          instagramUrl: data.instagramUrl,
          websiteUrl: data.websiteUrl,
          otherContactInfo: data.otherContactInfo,
        },
        ctx,
      );

      // 3. Create photos
      const photos: any[] = [];
      if (data.photos?.length) {
        for (let i = 0; i < data.photos.length; i++) {
          const photo = data.photos[i];
          const created = await this.adminCourtRepository.createPhoto(
            {
              placeId: placeRecord.id,
              url: photo.url,
              displayOrder: photo.displayOrder ?? i,
            },
            ctx,
          );
          photos.push(created);
        }
      }

      // 4. Create amenities
      const amenities: any[] = [];
      if (data.amenities?.length) {
        for (const name of data.amenities) {
          const created = await this.adminCourtRepository.createAmenity(
            {
              placeId: placeRecord.id,
              name,
            },
            ctx,
          );
          amenities.push(created);
        }
      }

      // 5. Create courts
      if (data.courts.length > 0) {
        for (const court of data.courts) {
          await this.adminCourtRepository.createCourt(
            {
              placeId: placeRecord.id,
              sportId: court.sportId,
              label: court.label,
              tierLabel: court.tierLabel ?? null,
              isActive: true,
            },
            ctx,
          );
        }
      }

      logger.info(
        {
          event: "place.created",
          placeId: placeRecord.id,
          adminUserId,
          placeType: "CURATED",
        },
        "Admin created curated venue",
      );

      return { place: placeRecord, detail, photos, amenities };
    });
  }

  async createCuratedPlacesBatch(
    adminUserId: string,
    items: CreateCuratedCourtDTO[],
  ): Promise<CuratedBatchResult> {
    const results: CuratedBatchResultItem[] = [];
    const seenKeys = new Set<string>();
    let created = 0;
    let skipped = 0;
    let failed = 0;

    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      const normalizedName = item.name.trim();
      const normalizedCity = item.city.trim();
      const normalizedProvince = item.province.trim();
      const key = `${normalizedName.toLowerCase()}|${normalizedCity.toLowerCase()}`;

      if (seenKeys.has(key)) {
        skipped += 1;
        results.push({
          index,
          status: "skipped_duplicate",
          message: "Duplicate entry in batch",
        });
        continue;
      }

      seenKeys.add(key);

      const existing = await this.adminCourtRepository.findByNameCity(
        normalizedName,
        normalizedCity,
      );

      if (existing) {
        skipped += 1;
        results.push({
          index,
          status: "skipped_duplicate",
          placeId: existing.id,
          message: "Duplicate venue already exists",
        });
        continue;
      }

      try {
        const createdPlace = await this.createCuratedPlace(adminUserId, {
          ...item,
          name: normalizedName,
          city: normalizedCity,
          province: normalizedProvince,
          address: item.address.trim(),
        });
        created += 1;
        results.push({
          index,
          status: "created",
          placeId: createdPlace.place.id,
        });
      } catch (error) {
        failed += 1;
        logger.warn(
          {
            err: error,
            adminUserId,
            placeName: normalizedName,
            placeCity: normalizedCity,
          },
          "Batch curated venue creation failed",
        );
        results.push({
          index,
          status: "error",
          message:
            error instanceof Error ? error.message : "Failed to create venue",
        });
      }
    }

    return {
      summary: {
        total: items.length,
        created,
        skipped,
        failed,
      },
      items: results,
    };
  }

  async getPlaceById(
    adminUserId: string,
    data: AdminCourtDetailDTO,
    ctx?: RequestContext,
  ): Promise<AdminPlaceDetails> {
    const detail = await this.adminCourtRepository.findDetailsById(
      data.placeId,
      ctx,
    );
    if (!detail) {
      throw new PlaceNotFoundError(data.placeId);
    }

    logger.info(
      {
        event: "place.viewed",
        placeId: data.placeId,
        adminUserId,
      },
      "Admin viewed venue details",
    );

    return detail;
  }

  async uploadPhoto(
    adminUserId: string,
    data: UploadCourtPhotoInput,
  ): Promise<{ url: string }> {
    const place = await this.adminCourtRepository.findById(data.placeId);
    if (!place) {
      throw new PlaceNotFoundError(data.placeId);
    }

    const photoCount = await this.adminCourtRepository.countPhotosByPlaceId(
      data.placeId,
    );
    if (photoCount >= 10) {
      throw new MaxPlacePhotosExceededError(10);
    }

    const ext = data.image.name.split(".").pop() || "jpg";
    const photoId = randomUUID();
    const path = `${data.placeId}/${photoId}.${ext}`;

    const result = await this.storageService.upload({
      bucket: STORAGE_BUCKETS.PLACE_PHOTOS,
      path,
      file: data.image,
      upsert: false,
    });

    const publicUrl = result.url;
    if (!publicUrl) {
      throw new Error("Expected public URL for place photo upload");
    }

    const created = await this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };
      const photos = await this.adminCourtRepository.findPhotosByPlaceId(
        data.placeId,
        ctx,
      );
      const nextOrder =
        photos.length > 0
          ? Math.max(...photos.map((photo) => photo.displayOrder)) + 1
          : 0;
      return this.adminCourtRepository.createPhoto(
        {
          placeId: data.placeId,
          url: publicUrl,
          displayOrder: nextOrder,
        },
        ctx,
      );
    });

    logger.info(
      {
        event: "place.photo_uploaded",
        placeId: data.placeId,
        photoId: created.id,
        adminUserId,
      },
      "Admin uploaded venue photo",
    );

    return { url: publicUrl };
  }

  async removePhoto(
    adminUserId: string,
    data: RemoveCourtPhotoDTO,
  ): Promise<void> {
    const place = await this.adminCourtRepository.findById(data.placeId);
    if (!place) {
      throw new PlaceNotFoundError(data.placeId);
    }

    const photo = await this.adminCourtRepository.findPhotoById(data.photoId);
    if (!photo || photo.placeId !== data.placeId) {
      throw new PlacePhotoNotFoundError(data.photoId);
    }

    const path = this.extractPublicStoragePath(
      photo.url,
      STORAGE_BUCKETS.PLACE_PHOTOS,
    );
    if (!path) {
      throw new PlacePhotoOrderInvalidError();
    }

    await this.storageService.delete(STORAGE_BUCKETS.PLACE_PHOTOS, path);

    await this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };
      await this.adminCourtRepository.deletePhotoById(data.photoId, ctx);
    });

    logger.info(
      {
        event: "place.photo_removed",
        placeId: data.placeId,
        photoId: data.photoId,
        adminUserId,
      },
      "Admin removed venue photo",
    );
  }

  async updatePlace(
    adminUserId: string,
    data: AdminUpdateCourtDTO,
  ): Promise<PlaceRecord> {
    return this.transactionManager.run(async (tx) => {
      const ctx = { tx };
      // Verify place exists
      const existing = await this.adminCourtRepository.findById(
        data.placeId,
        ctx,
      );
      if (!existing) {
        throw new PlaceNotFoundError(data.placeId);
      }

      // Build update data
      const updateData: Record<string, unknown> = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.address !== undefined) updateData.address = data.address;
      if (data.city !== undefined) updateData.city = data.city;
      if (data.province !== undefined) updateData.province = data.province;
      if (data.country !== undefined) updateData.country = data.country;
      if (data.latitude !== undefined) updateData.latitude = data.latitude;
      if (data.longitude !== undefined) updateData.longitude = data.longitude;
      if (data.extGPlaceId !== undefined) {
        updateData.extGPlaceId = data.extGPlaceId;
      }
      if (data.timeZone !== undefined) updateData.timeZone = data.timeZone;
      if (data.featuredRank !== undefined) {
        if (data.featuredRank > 0) {
          const existingFeatured =
            await this.adminCourtRepository.findByFeaturedRank(
              data.featuredRank,
              ctx,
            );
          if (existingFeatured && existingFeatured.id !== data.placeId) {
            throw new PlaceFeaturedRankTakenError(
              data.featuredRank,
              existingFeatured.id,
            );
          }
        }
        updateData.featuredRank = data.featuredRank;
      }
      const provinceChanged =
        data.province !== undefined && data.province !== existing.province;
      const provinceRankChanged =
        data.provinceRank !== undefined &&
        data.provinceRank !== existing.provinceRank;
      if (provinceChanged || provinceRankChanged) {
        const targetProvince = data.province ?? existing.province;
        const targetProvinceRank =
          data.provinceRank ?? existing.provinceRank ?? 0;

        if (targetProvinceRank > 0) {
          const existingProvinceRank =
            await this.adminCourtRepository.findByProvinceAndProvinceRank(
              targetProvince,
              targetProvinceRank,
              ctx,
            );
          if (
            existingProvinceRank &&
            existingProvinceRank.id !== data.placeId
          ) {
            throw new PlaceProvinceRankTakenError(
              targetProvince,
              targetProvinceRank,
              existingProvinceRank.id,
            );
          }
        }
      }
      if (data.provinceRank !== undefined) {
        updateData.provinceRank = data.provinceRank;
      }

      const updated = await this.adminCourtRepository.update(
        data.placeId,
        updateData,
        ctx,
      );

      await this.adminCourtRepository.upsertContactDetail(
        {
          placeId: data.placeId,
          facebookUrl: data.facebookUrl || null,
          instagramUrl: data.instagramUrl || null,
          websiteUrl: data.websiteUrl || null,
          phoneNumber: data.phoneNumber || null,
          viberInfo: data.viberInfo || null,
          otherContactInfo: data.otherContactInfo || null,
        },
        ctx,
      );

      if (data.photos) {
        const normalizedPhotos = data.photos
          .map((photo, index) => ({
            url: photo.url?.trim() ?? "",
            displayOrder: photo.displayOrder ?? index,
          }))
          .filter((photo) => photo.url.length > 0);

        await this.adminCourtRepository.deletePhotosByPlaceId(
          data.placeId,
          ctx,
        );
        for (const photo of normalizedPhotos) {
          await this.adminCourtRepository.createPhoto(
            {
              placeId: data.placeId,
              url: photo.url,
              displayOrder: photo.displayOrder,
            },
            ctx,
          );
        }
      }

      if (data.amenities) {
        await this.adminCourtRepository.deleteAmenitiesByPlaceId(
          data.placeId,
          ctx,
        );
        for (const name of data.amenities) {
          await this.adminCourtRepository.createAmenity(
            {
              placeId: data.placeId,
              name,
            },
            ctx,
          );
        }
      }

      if (data.courts) {
        const existingCourts =
          await this.adminCourtRepository.findCourtsByPlaceId(
            data.placeId,
            ctx,
          );
        const existingById = new Map(
          existingCourts.map((court) => [court.id, court]),
        );
        const incomingIds = new Set(
          data.courts.map((court) => court.id).filter(Boolean) as string[],
        );

        for (const court of data.courts) {
          if (court.id && existingById.has(court.id)) {
            await this.adminCourtRepository.updateCourt(
              court.id,
              {
                sportId: court.sportId,
                label: court.label,
                tierLabel: court.tierLabel ?? null,
              },
              ctx,
            );
          } else {
            await this.adminCourtRepository.createCourt(
              {
                placeId: data.placeId,
                sportId: court.sportId,
                label: court.label,
                tierLabel: court.tierLabel ?? null,
                isActive: true,
              },
              ctx,
            );
          }
        }

        for (const courtRecord of existingCourts) {
          if (!incomingIds.has(courtRecord.id)) {
            await this.adminCourtRepository.deleteCourtById(
              courtRecord.id,
              ctx,
            );
          }
        }
      }

      logger.info(
        {
          event: "place.updated",
          placeId: data.placeId,
          adminUserId,
        },
        "Admin updated venue",
      );

      return updated;
    });
  }

  async deactivatePlace(
    adminUserId: string,
    placeId: string,
    reason: string,
  ): Promise<PlaceRecord> {
    // Verify place exists
    const existing = await this.adminCourtRepository.findById(placeId);
    if (!existing) {
      throw new PlaceNotFoundError(placeId);
    }

    const updated = await this.adminCourtRepository.update(placeId, {
      isActive: false,
    });

    logger.info(
      {
        event: "place.deactivated",
        placeId,
        adminUserId,
        reason,
      },
      "Admin deactivated venue",
    );

    return updated;
  }

  async activatePlace(
    adminUserId: string,
    placeId: string,
  ): Promise<PlaceRecord> {
    // Verify place exists
    const existing = await this.adminCourtRepository.findById(placeId);
    if (!existing) {
      throw new PlaceNotFoundError(placeId);
    }

    const updated = await this.adminCourtRepository.update(placeId, {
      isActive: true,
    });

    logger.info(
      {
        event: "place.activated",
        placeId,
        adminUserId,
      },
      "Admin activated venue",
    );

    return updated;
  }

  async deletePlaceHard(adminUserId: string, placeId: string): Promise<void> {
    await this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };
      const place = await this.adminCourtRepository.findByIdForUpdate(
        placeId,
        ctx,
      );
      if (!place) {
        throw new PlaceNotFoundError(placeId);
      }

      const photos = await this.adminCourtRepository.findPhotosByPlaceId(
        placeId,
        ctx,
      );

      await Promise.all(
        photos.map(async (photo) => {
          const path = this.extractPublicStoragePath(
            photo.url,
            STORAGE_BUCKETS.PLACE_PHOTOS,
          );
          if (!path) {
            return;
          }
          try {
            await this.storageService.delete(
              STORAGE_BUCKETS.PLACE_PHOTOS,
              path,
            );
          } catch (error) {
            logger.warn(
              {
                event: "place.photo_delete_failed",
                placeId,
                photoId: photo.id,
                adminUserId,
                err: error,
              },
              "Failed to delete place photo from storage",
            );
          }
        }),
      );

      await this.adminCourtRepository.deletePlaceById(placeId, ctx);

      logger.info(
        {
          event: "place.deleted",
          placeId,
          adminUserId,
        },
        "Admin deleted venue",
      );
    });
  }

  async getStats(): Promise<{ total: number; reservable: number }> {
    return this.adminCourtRepository.getStats();
  }

  async listAllPlaces(
    filters: AdminCourtFiltersDTO,
    ctx?: RequestContext,
  ): Promise<PaginatedAdminPlaces> {
    return this.adminCourtRepository.findAll(filters, ctx);
  }

  async transferPlaceToOrganization(
    adminUserId: string,
    data: TransferPlaceDTO,
  ): Promise<PlaceRecord> {
    return this.transactionManager.run(async (tx) => {
      const ctx = { tx };

      const place = await this.adminCourtRepository.findByIdForUpdate(
        data.placeId,
        ctx,
      );
      if (!place) {
        throw new PlaceNotFoundError(data.placeId);
      }

      const targetOrg = await this.organizationRepository.findById(
        data.targetOrganizationId,
        ctx,
      );
      if (!targetOrg) {
        throw new OrganizationNotFoundError(data.targetOrganizationId);
      }

      const fromOrganizationId = place.organizationId ?? null;
      const now = new Date();

      const updated = await this.adminCourtRepository.update(
        place.id,
        {
          organizationId: targetOrg.id,
          placeType: "RESERVABLE",
          claimStatus: "CLAIMED",
        },
        ctx,
      );

      if (data.autoVerifyAndEnable) {
        await this.placeVerificationRepository.upsert(
          {
            placeId: place.id,
            status: "VERIFIED",
            verifiedAt: now,
            verifiedByUserId: adminUserId,
            reservationsEnabled: true,
            reservationsEnabledAt: now,
          },
          ctx,
        );
      }

      logger.info(
        {
          event: "place.transferred",
          placeId: place.id,
          fromOrganizationId,
          toOrganizationId: targetOrg.id,
          autoVerifyAndEnable: data.autoVerifyAndEnable,
          adminUserId,
        },
        "Admin transferred venue to organization",
      );

      return updated;
    });
  }

  async recuratePlace(
    adminUserId: string,
    data: RecuratePlaceDTO,
  ): Promise<PlaceRecord> {
    return this.transactionManager.run(async (tx) => {
      const ctx = { tx };

      const place = await this.adminCourtRepository.findByIdForUpdate(
        data.placeId,
        ctx,
      );
      if (!place) {
        throw new PlaceNotFoundError(data.placeId);
      }

      const isAlreadyCurated =
        place.placeType === "CURATED" &&
        place.claimStatus === "UNCLAIMED" &&
        !place.organizationId;
      if (isAlreadyCurated) {
        throw new PlaceAlreadyCuratedError(data.placeId);
      }

      const fromOrganizationId = place.organizationId ?? null;

      const updated = await this.adminCourtRepository.update(
        place.id,
        {
          organizationId: null,
          placeType: "CURATED",
          claimStatus: "UNCLAIMED",
        },
        ctx,
      );

      await this.placeVerificationRepository.upsert(
        {
          placeId: place.id,
          status: "UNVERIFIED",
          verifiedAt: null,
          verifiedByUserId: null,
          reservationsEnabled: false,
          reservationsEnabledAt: null,
        },
        ctx,
      );

      logger.info(
        {
          event: "place.recurated",
          placeId: place.id,
          fromOrganizationId,
          adminUserId,
          reason: data.reason,
        },
        "Admin returned venue to curated",
      );

      return updated;
    });
  }

  async getPlaceOnboardingStatus(
    _adminUserId: string,
    data: AdminCourtDetailDTO,
  ): Promise<PlaceOnboardingStatus> {
    const place = await this.adminCourtRepository.findById(data.placeId);
    if (!place) {
      throw new PlaceNotFoundError(data.placeId);
    }

    const verification = await this.placeVerificationRepository.findByPlaceId(
      data.placeId,
    );

    const courts = await this.adminCourtRepository.findCourtsByPlaceId(
      data.placeId,
    );

    const courtIds = courts.map((c) => c.id);
    const [courtHoursWindows, courtRateRules] =
      courtIds.length > 0
        ? await Promise.all([
            this.courtHoursRepository.findByCourtIds(courtIds),
            this.courtRateRuleRepository.findByCourtIds(courtIds),
          ])
        : [[], []];

    const courtsWithHours = new Set(courtHoursWindows.map((w) => w.courtId));
    const courtsWithPricing = new Set(courtRateRules.map((r) => r.courtId));

    const verificationStatus = normalizeVerificationStatus(
      verification?.status ?? null,
    );

    return computePlaceOnboardingStatus({
      verificationStatus,
      courts: courts.map((c) => ({
        courtId: c.id,
        isActive: c.isActive,
      })),
      courtsWithHours,
      courtsWithPricing,
    });
  }
}
