import { PlaceRepository } from "@/lib/modules/place/repositories/place.repository";
import { makeObjectStorageService } from "@/lib/modules/storage/factories/storage.factory";
import { makeUserPreferenceService } from "@/lib/modules/user-preference/factories/user-preference.factory";
import { getContainer } from "@/lib/shared/infra/container";
import { OrganizationAdminRepository } from "../admin/repositories/organization-admin.repository";
import { OrganizationAdminService } from "../admin/services/organization-admin.service";
import { OrganizationRepository } from "../repositories/organization.repository";
import { OrganizationProfileRepository } from "../repositories/organization-profile.repository";
import { OrganizationService } from "../services/organization.service";

let organizationRepository: OrganizationRepository | null = null;
let organizationProfileRepository: OrganizationProfileRepository | null = null;
let placeRepository: PlaceRepository | null = null;
let organizationService: OrganizationService | null = null;
let organizationAdminRepository: OrganizationAdminRepository | null = null;
let organizationAdminService: OrganizationAdminService | null = null;

export function makeOrganizationRepository(): OrganizationRepository {
  if (!organizationRepository) {
    organizationRepository = new OrganizationRepository(getContainer().db);
  }
  return organizationRepository;
}

export function makeOrganizationProfileRepository(): OrganizationProfileRepository {
  if (!organizationProfileRepository) {
    organizationProfileRepository = new OrganizationProfileRepository(
      getContainer().db,
    );
  }
  return organizationProfileRepository;
}

function makePlaceRepository(): PlaceRepository {
  if (!placeRepository) {
    placeRepository = new PlaceRepository(getContainer().db);
  }
  return placeRepository;
}

export function makeOrganizationService(): OrganizationService {
  if (!organizationService) {
    organizationService = new OrganizationService(
      makeOrganizationRepository(),
      makeOrganizationProfileRepository(),
      makePlaceRepository(),
      getContainer().transactionManager,
      makeObjectStorageService(),
      makeUserPreferenceService(),
    );
  }
  return organizationService;
}

export function makeOrganizationAdminRepository(): OrganizationAdminRepository {
  if (!organizationAdminRepository) {
    organizationAdminRepository = new OrganizationAdminRepository(
      getContainer().db,
    );
  }
  return organizationAdminRepository;
}

export function makeOrganizationAdminService(): OrganizationAdminService {
  if (!organizationAdminService) {
    organizationAdminService = new OrganizationAdminService(
      makeOrganizationAdminRepository(),
    );
  }
  return organizationAdminService;
}
