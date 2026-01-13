import {
  NotOrganizationOwnerError,
  OrganizationNotFoundError,
} from "@/modules/organization/errors/organization.errors";
import type { IOrganizationRepository } from "@/modules/organization/repositories/organization.repository";
import type { PlaceRecord } from "@/shared/infra/db/schema";
import { logger } from "@/shared/infra/logger";
import type { RequestContext } from "@/shared/kernel/context";
import type { TransactionManager } from "@/shared/kernel/transaction";
import type { CreatePlaceDTO, ListMyPlacesDTO, UpdatePlaceDTO } from "../dtos";
import { NotPlaceOwnerError, PlaceNotFoundError } from "../errors/place.errors";
import type {
  IPlaceRepository,
  PlaceWithDetails,
} from "../repositories/place.repository";
import type { IPlacePolicyRepository } from "../repositories/place-policy.repository";

export interface IPlaceManagementService {
  createPlace(userId: string, data: CreatePlaceDTO): Promise<PlaceRecord>;
  updatePlace(userId: string, data: UpdatePlaceDTO): Promise<PlaceRecord>;
  listMyPlaces(userId: string, data: ListMyPlacesDTO): Promise<PlaceRecord[]>;
  getPlaceById(userId: string, placeId: string): Promise<PlaceWithDetails>;
}

export class PlaceManagementService implements IPlaceManagementService {
  constructor(
    private placeRepository: IPlaceRepository,
    private placePolicyRepository: IPlacePolicyRepository,
    private organizationRepository: IOrganizationRepository,
    private transactionManager: TransactionManager,
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
          country: data.country ?? "PH",
          latitude: data.latitude,
          longitude: data.longitude,
          timeZone: data.timeZone ?? "Asia/Manila",
          placeType: "RESERVABLE",
          claimStatus: "CLAIMED",
          isActive: true,
        },
        ctx,
      );

      await this.placePolicyRepository.create(
        {
          placeId: created.id,
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

      const { placeId, ...updateData } = data;
      const updated = await this.placeRepository.update(
        placeId,
        updateData,
        ctx,
      );

      logger.info(
        {
          event: "place.updated",
          placeId,
          userId,
          fields: Object.keys(updateData),
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
