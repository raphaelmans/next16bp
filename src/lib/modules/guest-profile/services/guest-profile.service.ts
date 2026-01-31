import { NotOrganizationOwnerError } from "@/lib/modules/organization/errors/organization.errors";
import type { IOrganizationRepository } from "@/lib/modules/organization/repositories/organization.repository";
import type { GuestProfileRecord } from "@/lib/shared/infra/db/schema";
import { logger } from "@/lib/shared/infra/logger";
import type { CreateGuestProfileDTO, ListGuestProfilesDTO } from "../dtos";
import type { IGuestProfileRepository } from "../repositories/guest-profile.repository";

export interface IGuestProfileService {
  list(
    userId: string,
    data: ListGuestProfilesDTO,
  ): Promise<GuestProfileRecord[]>;
  create(
    userId: string,
    data: CreateGuestProfileDTO,
  ): Promise<GuestProfileRecord>;
}

export class GuestProfileService implements IGuestProfileService {
  constructor(
    private guestProfileRepository: IGuestProfileRepository,
    private organizationRepository: IOrganizationRepository,
  ) {}

  private async verifyOrganizationOwnership(
    userId: string,
    organizationId: string,
  ): Promise<void> {
    const org = await this.organizationRepository.findById(organizationId);
    if (!org || org.ownerUserId !== userId) {
      throw new NotOrganizationOwnerError();
    }
  }

  async list(
    userId: string,
    data: ListGuestProfilesDTO,
  ): Promise<GuestProfileRecord[]> {
    await this.verifyOrganizationOwnership(userId, data.organizationId);
    return this.guestProfileRepository.findByOrganizationId(
      data.organizationId,
      { query: data.query, limit: data.limit },
    );
  }

  async create(
    userId: string,
    data: CreateGuestProfileDTO,
  ): Promise<GuestProfileRecord> {
    await this.verifyOrganizationOwnership(userId, data.organizationId);

    const created = await this.guestProfileRepository.create({
      organizationId: data.organizationId,
      displayName: data.displayName,
      email: data.email,
      phoneNumber: data.phoneNumber,
      notes: data.notes,
    });

    logger.info(
      {
        event: "guest_profile.created",
        guestProfileId: created.id,
        organizationId: data.organizationId,
        ownerId: userId,
      },
      "Guest profile created",
    );

    return created;
  }
}
