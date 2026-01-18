import { STORAGE_BUCKETS } from "@/modules/storage/dtos";
import type { IObjectStorageService } from "@/modules/storage/services/object-storage.service";
import type {
  OrganizationProfileRecord,
  OrganizationRecord,
} from "@/shared/infra/db/schema";
import { logger } from "@/shared/infra/logger";
import type { RequestContext } from "@/shared/kernel/context";
import type { TransactionManager } from "@/shared/kernel/transaction";
import type {
  CreateOrganizationDTO,
  UpdateOrganizationDTO,
  UpdateOrganizationProfileDTO,
} from "../dtos";
import {
  NotOrganizationOwnerError,
  OrganizationNotFoundError,
  SlugAlreadyExistsError,
  UserAlreadyHasOrganizationError,
} from "../errors/organization.errors";
import type { IOrganizationRepository } from "../repositories/organization.repository";
import type { IOrganizationProfileRepository } from "../repositories/organization-profile.repository";
import { generateUniqueSlug } from "../utils/slug.utils";

export interface OrganizationWithProfile {
  organization: OrganizationRecord;
  profile: OrganizationProfileRecord | null;
}

export interface IOrganizationService {
  createOrganization(
    ownerId: string,
    data: CreateOrganizationDTO,
  ): Promise<OrganizationWithProfile>;
  getOrganization(id: string): Promise<OrganizationWithProfile>;
  getOrganizationBySlug(slug: string): Promise<OrganizationWithProfile>;
  getMyOrganizations(userId: string): Promise<OrganizationRecord[]>;
  updateOrganization(
    userId: string,
    data: UpdateOrganizationDTO,
  ): Promise<OrganizationRecord>;
  updateOrganizationProfile(
    userId: string,
    data: UpdateOrganizationProfileDTO,
  ): Promise<OrganizationProfileRecord>;
  uploadLogo(
    userId: string,
    organizationId: string,
    file: File,
  ): Promise<string>;
}

export class OrganizationService implements IOrganizationService {
  constructor(
    private organizationRepository: IOrganizationRepository,
    private organizationProfileRepository: IOrganizationProfileRepository,
    private transactionManager: TransactionManager,
    private storageService: IObjectStorageService,
  ) {}

  async createOrganization(
    ownerId: string,
    data: CreateOrganizationDTO,
  ): Promise<OrganizationWithProfile> {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };

      const existingOrganizations =
        await this.organizationRepository.findByOwnerId(ownerId, ctx);
      if (existingOrganizations.length > 0) {
        throw new UserAlreadyHasOrganizationError();
      }

      // Generate or validate slug
      let slug: string;
      if (data.slug) {
        // User provided slug - check if it exists
        const exists = await this.organizationRepository.slugExists(data.slug);
        if (exists) {
          throw new SlugAlreadyExistsError(data.slug);
        }
        slug = data.slug;
      } else {
        // Auto-generate unique slug from name
        slug = await generateUniqueSlug(data.name, (s) =>
          this.organizationRepository.slugExists(s),
        );
      }

      // Create organization
      const org = await this.organizationRepository.create(
        {
          ownerUserId: ownerId,
          name: data.name,
          slug,
        },
        ctx,
      );

      // Create empty profile
      const profile = await this.organizationProfileRepository.create(
        {
          organizationId: org.id,
        },
        ctx,
      );

      logger.info(
        {
          event: "organization.created",
          organizationId: org.id,
          ownerId: ownerId,
          slug: org.slug,
        },
        "Organization created",
      );

      return { organization: org, profile };
    });
  }

  async getOrganization(id: string): Promise<OrganizationWithProfile> {
    const org = await this.organizationRepository.findById(id);
    if (!org) {
      throw new OrganizationNotFoundError(id);
    }

    const profile =
      await this.organizationProfileRepository.findByOrganizationId(org.id);

    return { organization: org, profile };
  }

  async getOrganizationBySlug(slug: string): Promise<OrganizationWithProfile> {
    const org = await this.organizationRepository.findBySlug(slug);
    if (!org) {
      throw new OrganizationNotFoundError(slug);
    }

    const profile =
      await this.organizationProfileRepository.findByOrganizationId(org.id);

    return { organization: org, profile };
  }

  async getMyOrganizations(userId: string): Promise<OrganizationRecord[]> {
    return this.organizationRepository.findByOwnerId(userId);
  }

  async updateOrganization(
    userId: string,
    data: UpdateOrganizationDTO,
  ): Promise<OrganizationRecord> {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };

      // Get organization and check ownership
      const org = await this.organizationRepository.findById(data.id, ctx);
      if (!org) {
        throw new OrganizationNotFoundError(data.id);
      }

      if (org.ownerUserId !== userId) {
        throw new NotOrganizationOwnerError();
      }

      // If updating slug, check uniqueness
      if (data.slug && data.slug !== org.slug) {
        const slugExists = await this.organizationRepository.slugExists(
          data.slug,
          org.id,
        );
        if (slugExists) {
          throw new SlugAlreadyExistsError(data.slug);
        }
      }

      // Update organization
      const { id: _id, ...updateData } = data;
      const updated = await this.organizationRepository.update(
        org.id,
        updateData,
        ctx,
      );

      logger.info(
        {
          event: "organization.updated",
          organizationId: updated.id,
          fields: Object.keys(updateData),
        },
        "Organization updated",
      );

      return updated;
    });
  }

  async updateOrganizationProfile(
    userId: string,
    data: UpdateOrganizationProfileDTO,
  ): Promise<OrganizationProfileRecord> {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };

      // Get organization and check ownership
      const org = await this.organizationRepository.findById(
        data.organizationId,
        ctx,
      );
      if (!org) {
        throw new OrganizationNotFoundError(data.organizationId);
      }

      if (org.ownerUserId !== userId) {
        throw new NotOrganizationOwnerError();
      }

      // Get or create profile
      let profile =
        await this.organizationProfileRepository.findByOrganizationId(
          org.id,
          ctx,
        );

      const { organizationId: _orgId, ...updateData } = data;

      if (!profile) {
        // Create profile if it doesn't exist
        profile = await this.organizationProfileRepository.create(
          {
            organizationId: org.id,
            ...updateData,
          },
          ctx,
        );
      } else {
        // Update existing profile
        profile = await this.organizationProfileRepository.update(
          profile.id,
          updateData,
          ctx,
        );
      }

      logger.info(
        {
          event: "organization_profile.updated",
          organizationId: org.id,
          profileId: profile.id,
          fields: Object.keys(updateData),
        },
        "Organization profile updated",
      );

      return profile;
    });
  }

  /**
   * Upload a logo for an organization.
   * Uploads to storage and updates the organization profile.
   */
  async uploadLogo(
    userId: string,
    organizationId: string,
    file: File,
  ): Promise<string> {
    // Verify ownership first
    const org = await this.organizationRepository.findById(organizationId);
    if (!org) {
      throw new OrganizationNotFoundError(organizationId);
    }

    if (org.ownerUserId !== userId) {
      throw new NotOrganizationOwnerError();
    }

    // Generate path: {organizationId}/logo.{ext}
    const ext = file.name.split(".").pop() || "png";
    const path = `${organizationId}/logo.${ext}`;

    // Upload to storage (upsert to replace existing logo)
    const result = await this.storageService.upload({
      bucket: STORAGE_BUCKETS.ORGANIZATION_ASSETS,
      path,
      file,
      upsert: true,
    });

    // Update or create profile with logo URL
    let profile =
      await this.organizationProfileRepository.findByOrganizationId(
        organizationId,
      );

    if (!profile) {
      profile = await this.organizationProfileRepository.create({
        organizationId,
        logoUrl: result.url,
      });
    } else {
      await this.organizationProfileRepository.update(profile.id, {
        logoUrl: result.url,
      });
    }

    logger.info(
      {
        event: "organization.logo_uploaded",
        organizationId,
        url: result.url,
        userId,
      },
      "Organization logo uploaded",
    );

    return result.url;
  }
}
