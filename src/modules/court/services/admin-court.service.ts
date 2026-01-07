import type { TransactionManager } from "@/shared/kernel/transaction";
import type { RequestContext } from "@/shared/kernel/context";
import type { CourtRecord } from "@/shared/infra/db/schema";
import type {
  IAdminCourtRepository,
  CreatedCuratedCourt,
  PaginatedAdminCourts,
} from "../repositories/admin-court.repository";
import type {
  CreateCuratedCourtDTO,
  AdminUpdateCourtDTO,
  AdminCourtFiltersDTO,
} from "../dtos";
import { CourtNotFoundError } from "../errors/court.errors";
import { logger } from "@/shared/infra/logger";

export interface IAdminCourtService {
  createCuratedCourt(
    adminUserId: string,
    data: CreateCuratedCourtDTO,
  ): Promise<CreatedCuratedCourt>;
  updateCourt(
    adminUserId: string,
    data: AdminUpdateCourtDTO,
  ): Promise<CourtRecord>;
  deactivateCourt(
    adminUserId: string,
    courtId: string,
    reason: string,
  ): Promise<CourtRecord>;
  activateCourt(adminUserId: string, courtId: string): Promise<CourtRecord>;
  listAllCourts(
    filters: AdminCourtFiltersDTO,
    ctx?: RequestContext,
  ): Promise<PaginatedAdminCourts>;
}

export class AdminCourtService implements IAdminCourtService {
  constructor(
    private adminCourtRepository: IAdminCourtRepository,
    private transactionManager: TransactionManager,
  ) {}

  async createCuratedCourt(
    adminUserId: string,
    data: CreateCuratedCourtDTO,
  ): Promise<CreatedCuratedCourt> {
    return this.transactionManager.run(async (tx) => {
      const ctx = { tx };

      // 1. Create court (no organization - admin-created)
      const courtRecord = await this.adminCourtRepository.create(
        {
          organizationId: null,
          name: data.name,
          address: data.address,
          city: data.city,
          latitude: data.latitude,
          longitude: data.longitude,
          courtType: "CURATED",
          claimStatus: "UNCLAIMED",
          isActive: true,
        },
        ctx,
      );

      // 2. Create curated detail
      const detail = await this.adminCourtRepository.createCuratedDetail(
        {
          courtId: courtRecord.id,
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
              courtId: courtRecord.id,
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
              courtId: courtRecord.id,
              name,
            },
            ctx,
          );
          amenities.push(created);
        }
      }

      logger.info(
        {
          event: "admin.court.created",
          courtId: courtRecord.id,
          adminUserId,
          courtType: "CURATED",
        },
        "Admin created curated court",
      );

      return { court: courtRecord, detail, photos, amenities };
    });
  }

  async updateCourt(
    adminUserId: string,
    data: AdminUpdateCourtDTO,
  ): Promise<CourtRecord> {
    // Verify court exists
    const existing = await this.adminCourtRepository.findById(data.courtId);
    if (!existing) {
      throw new CourtNotFoundError(data.courtId);
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.latitude !== undefined) updateData.latitude = data.latitude;
    if (data.longitude !== undefined) updateData.longitude = data.longitude;

    const updated = await this.adminCourtRepository.update(
      data.courtId,
      updateData,
    );

    logger.info(
      {
        event: "admin.court.updated",
        courtId: data.courtId,
        adminUserId,
      },
      "Admin updated court",
    );

    return updated;
  }

  async deactivateCourt(
    adminUserId: string,
    courtId: string,
    reason: string,
  ): Promise<CourtRecord> {
    // Verify court exists
    const existing = await this.adminCourtRepository.findById(courtId);
    if (!existing) {
      throw new CourtNotFoundError(courtId);
    }

    const updated = await this.adminCourtRepository.update(courtId, {
      isActive: false,
    });

    logger.info(
      {
        event: "admin.court.deactivated",
        courtId,
        adminUserId,
        reason,
      },
      "Admin deactivated court",
    );

    return updated;
  }

  async activateCourt(
    adminUserId: string,
    courtId: string,
  ): Promise<CourtRecord> {
    // Verify court exists
    const existing = await this.adminCourtRepository.findById(courtId);
    if (!existing) {
      throw new CourtNotFoundError(courtId);
    }

    const updated = await this.adminCourtRepository.update(courtId, {
      isActive: true,
    });

    logger.info(
      {
        event: "admin.court.activated",
        courtId,
        adminUserId,
      },
      "Admin activated court",
    );

    return updated;
  }

  async listAllCourts(
    filters: AdminCourtFiltersDTO,
    ctx?: RequestContext,
  ): Promise<PaginatedAdminCourts> {
    return this.adminCourtRepository.findAll(filters, ctx);
  }
}
