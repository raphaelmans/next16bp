import { getContainer } from "@/shared/infra/container";
import { OrganizationRepository } from "../repositories/organization.repository";
import { OrganizationProfileRepository } from "../repositories/organization-profile.repository";
import { OrganizationService } from "../services/organization.service";

let organizationRepository: OrganizationRepository | null = null;
let organizationProfileRepository: OrganizationProfileRepository | null = null;
let organizationService: OrganizationService | null = null;

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

export function makeOrganizationService(): OrganizationService {
  if (!organizationService) {
    organizationService = new OrganizationService(
      makeOrganizationRepository(),
      makeOrganizationProfileRepository(),
      getContainer().transactionManager,
    );
  }
  return organizationService;
}
