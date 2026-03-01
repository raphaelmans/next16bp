import { appRoutes } from "@/common/app-routes";
import type { IPlaceRepository } from "@/lib/modules/place/repositories/place.repository";
import { STORAGE_BUCKETS } from "@/lib/modules/storage/dtos";
import type { IObjectStorageService } from "@/lib/modules/storage/services/object-storage.service";
import type { IUserPreferenceService } from "@/lib/modules/user-preference/services/user-preference.service";
import type {
  OrganizationProfileRecord,
  OrganizationRecord,
} from "@/lib/shared/infra/db/schema";
import { logger } from "@/lib/shared/infra/logger";
import type { RequestContext } from "@/lib/shared/kernel/context";
import type { TransactionManager } from "@/lib/shared/kernel/transaction";
import type {
  CreateOrganizationDTO,
  UpdateOrganizationDTO,
  UpdateOrganizationProfileDTO,
} from "../dtos";
import {
  NotOrganizationOwnerError,
  OrganizationNotFoundError,
  OrganizationSlugReservedError,
  SlugAlreadyExistsError,
  UserAlreadyHasOrganizationError,
} from "../errors/organization.errors";
import type { IOrganizationRepository } from "../repositories/organization.repository";
import type { IOrganizationProfileRepository } from "../repositories/organization-profile.repository";
import { generateUniqueSlug } from "../utils/slug.utils";

const extractTopLevelSegment = (path: string): string | null => {
  const normalized = path.split("?")[0]?.split("#")[0] ?? path;
  const segments = normalized.split("/").filter(Boolean);
  return segments[0] ?? null;
};

const collectRouteBases = (
  node: unknown,
  bases: string[],
  visited: Set<object>,
) => {
  if (!node || typeof node !== "object") return;
  if (visited.has(node)) return;
  visited.add(node);

  const maybeBase = (node as { base?: unknown }).base;
  if (typeof maybeBase === "string") {
    bases.push(maybeBase);
  }

  for (const value of Object.values(node as Record<string, unknown>)) {
    collectRouteBases(value, bases, visited);
  }
};

const RESERVED_ORG_ROOT_SLUGS = (() => {
  const bases: string[] = [];
  collectRouteBases(appRoutes, bases, new Set());

  const reserved = new Set<string>();
  for (const base of bases) {
    const segment = extractTopLevelSegment(base);
    if (segment) {
      reserved.add(segment);
    }
  }

  reserved.add("api");
  reserved.add("_next");
  reserved.add("org");

  return reserved;
})();

const isReservedOrgRootSlug = (slug: string) =>
  RESERVED_ORG_ROOT_SLUGS.has(slug);

export interface OrganizationWithProfile {
  organization: OrganizationRecord;
  profile: OrganizationProfileRecord | null;
}

export interface OrganizationLandingProfile {
  description?: string;
  logoUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
}

export interface OrganizationLandingPlace {
  id: string;
  slug: string;
  name: string;
  address: string;
  city: string;
  coverImageUrl?: string;
  logoUrl?: string;
  sports: { id: string; slug: string; name: string }[];
  courtCount: number;
  lowestPriceCents?: number;
  currency?: string;
  placeType: "CURATED" | "RESERVABLE";
  verificationStatus?: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
  reservationsEnabled?: boolean;
  featuredRank?: number;
}

export interface OrganizationLandingSport {
  id: string;
  slug: string;
  name: string;
  count: number;
}

export interface OrganizationLandingStats {
  venueCount: number;
  totalCourts: number;
  cityCount: number;
  verifiedVenueCount: number;
  topSports: OrganizationLandingSport[];
}

export interface OrganizationLanding {
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  profile: OrganizationLandingProfile | null;
  places: OrganizationLandingPlace[];
  stats: OrganizationLandingStats;
}

export interface IOrganizationService {
  createOrganization(
    ownerId: string,
    data: CreateOrganizationDTO,
  ): Promise<OrganizationWithProfile>;
  getOrganization(id: string): Promise<OrganizationWithProfile>;
  getOrganizationBySlug(slug: string): Promise<OrganizationWithProfile>;
  getLandingBySlug(slug: string): Promise<OrganizationLanding>;
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
    private placeRepository: IPlaceRepository,
    private transactionManager: TransactionManager,
    private storageService: IObjectStorageService,
    private userPreferenceService: IUserPreferenceService,
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
        const requestedSlug = data.slug.trim().toLowerCase();

        if (isReservedOrgRootSlug(requestedSlug)) {
          throw new OrganizationSlugReservedError(requestedSlug);
        }

        // User provided slug - check if it exists
        const exists = await this.organizationRepository.slugExists(
          requestedSlug,
          undefined,
          ctx,
        );
        if (exists) {
          throw new SlugAlreadyExistsError(requestedSlug);
        }
        slug = requestedSlug;
      } else {
        // Auto-generate unique slug from name
        slug = await generateUniqueSlug(data.name, async (candidate) => {
          if (isReservedOrgRootSlug(candidate)) {
            return true;
          }
          return await this.organizationRepository.slugExists(
            candidate,
            undefined,
            ctx,
          );
        });
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

      await this.userPreferenceService.setDefaultPortal(
        ownerId,
        "organization",
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

  async getLandingBySlug(slug: string): Promise<OrganizationLanding> {
    const org = await this.organizationRepository.findBySlug(slug);
    if (!org || !org.isActive) {
      throw new OrganizationNotFoundError(slug);
    }

    const profileRecord =
      await this.organizationProfileRepository.findByOrganizationId(org.id);

    const placeRecords = await this.placeRepository.findActiveByOrganizationId(
      org.id,
    );
    const placeIds = placeRecords.map((place) => place.id);

    const [media, meta] =
      placeIds.length > 0
        ? await Promise.all([
            this.placeRepository.listCardMediaByPlaceIds(placeIds),
            this.placeRepository.listCardMetaByPlaceIds(placeIds),
          ])
        : [[], []];

    const mediaByPlaceId = new Map(media.map((item) => [item.placeId, item]));
    const metaByPlaceId = new Map(meta.map((item) => [item.placeId, item]));

    const places: OrganizationLandingPlace[] = placeRecords.map((place) => {
      const placeMedia = mediaByPlaceId.get(place.id);
      const placeMeta = metaByPlaceId.get(place.id);

      return {
        id: place.id,
        slug: place.slug,
        name: place.name,
        address: place.address,
        city: place.city,
        coverImageUrl: placeMedia?.coverImageUrl ?? undefined,
        logoUrl: placeMedia?.organizationLogoUrl ?? undefined,
        sports: placeMeta?.sports ?? [],
        courtCount: placeMeta?.courtCount ?? 0,
        lowestPriceCents:
          placeMeta?.lowestPriceCents === null ||
          placeMeta?.lowestPriceCents === undefined
            ? undefined
            : placeMeta.lowestPriceCents,
        currency: placeMeta?.currency ?? undefined,
        placeType: place.placeType,
        verificationStatus: placeMeta?.verificationStatus ?? undefined,
        reservationsEnabled: placeMeta?.reservationsEnabled ?? undefined,
        featuredRank: place.featuredRank,
      };
    });

    const cities = new Set(places.map((place) => place.city));
    const totalCourts = places.reduce(
      (sum, place) => sum + (place.courtCount ?? 0),
      0,
    );
    const verifiedVenueCount = places.filter(
      (place) => place.verificationStatus === "VERIFIED",
    ).length;

    const sports = new Map<string, OrganizationLandingSport>();
    for (const place of places) {
      for (const sport of place.sports) {
        const current = sports.get(sport.id);
        if (current) {
          current.count += 1;
          continue;
        }
        sports.set(sport.id, { ...sport, count: 1 });
      }
    }

    const topSports = Array.from(sports.values())
      .sort(
        (a, b) =>
          b.count - a.count ||
          a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
      )
      .slice(0, 6);

    const profile: OrganizationLandingProfile | null = profileRecord
      ? {
          description: profileRecord.description ?? undefined,
          logoUrl: profileRecord.logoUrl ?? undefined,
          contactEmail: profileRecord.contactEmail ?? undefined,
          contactPhone: profileRecord.contactPhone ?? undefined,
          address: profileRecord.address ?? undefined,
        }
      : null;

    return {
      organization: {
        id: org.id,
        name: org.name,
        slug: org.slug,
      },
      profile,
      places,
      stats: {
        venueCount: places.length,
        totalCourts,
        cityCount: cities.size,
        verifiedVenueCount,
        topSports,
      },
    };
  }

  async getMyOrganizations(userId: string): Promise<OrganizationRecord[]> {
    return this.organizationRepository.findByUserAccess(userId);
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
        const requestedSlug = data.slug.trim().toLowerCase();
        if (isReservedOrgRootSlug(requestedSlug)) {
          throw new OrganizationSlugReservedError(requestedSlug);
        }

        const slugExists = await this.organizationRepository.slugExists(
          requestedSlug,
          org.id,
          ctx,
        );
        if (slugExists) {
          throw new SlugAlreadyExistsError(requestedSlug);
        }
      }

      // Update organization
      const { id: _id, slug: rawSlug, ...rest } = data;
      const updateData = {
        ...rest,
        ...(rawSlug ? { slug: rawSlug.trim().toLowerCase() } : {}),
      };
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

    const publicUrl = result.url;
    if (!publicUrl) {
      throw new Error("Expected public URL for organization asset upload");
    }

    // Update or create profile with logo URL
    let profile =
      await this.organizationProfileRepository.findByOrganizationId(
        organizationId,
      );

    if (!profile) {
      profile = await this.organizationProfileRepository.create({
        organizationId,
        logoUrl: publicUrl,
      });
    } else {
      await this.organizationProfileRepository.update(profile.id, {
        logoUrl: publicUrl,
      });
    }

    logger.info(
      {
        event: "organization.logo_uploaded",
        organizationId,
        url: publicUrl,
        userId,
      },
      "Organization logo uploaded",
    );

    return publicUrl;
  }
}
