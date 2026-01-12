import { PlaceNotFoundError } from "@/modules/place/errors/place.errors";
import type { PlaceRecord } from "@/shared/infra/db/schema";
import { logger } from "@/shared/infra/logger";
import type { RequestContext } from "@/shared/kernel/context";
import type { TransactionManager } from "@/shared/kernel/transaction";
import type {
  AdminCourtFiltersDTO,
  AdminUpdateCourtDTO,
  CreateCuratedCourtDTO,
} from "../dtos";
import type {
  CreatedCuratedPlace,
  IAdminCourtRepository,
  PaginatedAdminPlaces,
} from "../repositories/admin-court.repository";

export interface IAdminCourtService {
  createCuratedPlace(
    adminUserId: string,
    data: CreateCuratedCourtDTO,
  ): Promise<CreatedCuratedPlace>;
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
  listAllPlaces(
    filters: AdminCourtFiltersDTO,
    ctx?: RequestContext,
  ): Promise<PaginatedAdminPlaces>;
}

export class AdminCourtService implements IAdminCourtService {
  constructor(
    private adminCourtRepository: IAdminCourtRepository,
    private transactionManager: TransactionManager,
  ) {}

  async createCuratedPlace(
    adminUserId: string,
    data: CreateCuratedCourtDTO,
  ): Promise<CreatedCuratedPlace> {
    return this.transactionManager.run(async (tx) => {
      const ctx = { tx };

      // 1. Create place (no organization - admin-created)
      const placeRecord = await this.adminCourtRepository.create(
        {
          organizationId: null,
          name: data.name,
          address: data.address,
          city: data.city,
          latitude: data.latitude,
          longitude: data.longitude,
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
          viberInfo: data.viberInfo,
          instagramUrl: data.instagramUrl,
          websiteUrl: data.websiteUrl,
          otherContactInfo: data.otherContactInfo,
        },
        ctx,
      );

      // 3. Create photos
      const photos = [];
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
      const amenities = [];
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

      logger.info(
        {
          event: "place.created",
          placeId: placeRecord.id,
          adminUserId,
          placeType: "CURATED",
        },
        "Admin created curated place",
      );

      return { place: placeRecord, detail, photos, amenities };
    });
  }

  async updatePlace(
    adminUserId: string,
    data: AdminUpdateCourtDTO,
  ): Promise<PlaceRecord> {
    // Verify place exists
    const existing = await this.adminCourtRepository.findById(data.placeId);
    if (!existing) {
      throw new PlaceNotFoundError(data.placeId);
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.latitude !== undefined) updateData.latitude = data.latitude;
    if (data.longitude !== undefined) updateData.longitude = data.longitude;
    if (data.timeZone !== undefined) updateData.timeZone = data.timeZone;

    const updated = await this.adminCourtRepository.update(
      data.placeId,
      updateData,
    );

    logger.info(
      {
        event: "place.updated",
        placeId: data.placeId,
        adminUserId,
      },
      "Admin updated place",
    );

    return updated;
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
      "Admin deactivated place",
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
      "Admin activated place",
    );

    return updated;
  }

  async listAllPlaces(
    filters: AdminCourtFiltersDTO,
    ctx?: RequestContext,
  ): Promise<PaginatedAdminPlaces> {
    return this.adminCourtRepository.findAll(filters, ctx);
  }
}
