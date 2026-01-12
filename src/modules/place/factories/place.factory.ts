import { makeCourtRepository } from "@/modules/court/factories/court.factory";
import { makeOrganizationRepository } from "@/modules/organization/factories/organization.factory";
import { getContainer } from "@/shared/infra/container";
import { PlaceRepository } from "../repositories/place.repository";
import { PlacePolicyRepository } from "../repositories/place-policy.repository";
import { PlaceDiscoveryService } from "../services/place-discovery.service";
import { PlaceManagementService } from "../services/place-management.service";

let placeRepository: PlaceRepository | null = null;
let placePolicyRepository: PlacePolicyRepository | null = null;
let placeDiscoveryService: PlaceDiscoveryService | null = null;
let placeManagementService: PlaceManagementService | null = null;

export function makePlaceRepository(): PlaceRepository {
  if (!placeRepository) {
    placeRepository = new PlaceRepository(getContainer().db);
  }
  return placeRepository;
}

export function makePlacePolicyRepository(): PlacePolicyRepository {
  if (!placePolicyRepository) {
    placePolicyRepository = new PlacePolicyRepository(getContainer().db);
  }
  return placePolicyRepository;
}

export function makePlaceDiscoveryService(): PlaceDiscoveryService {
  if (!placeDiscoveryService) {
    placeDiscoveryService = new PlaceDiscoveryService(
      makePlaceRepository(),
      makeCourtRepository(),
    );
  }
  return placeDiscoveryService;
}

export function makePlaceManagementService(): PlaceManagementService {
  if (!placeManagementService) {
    placeManagementService = new PlaceManagementService(
      makePlaceRepository(),
      makePlacePolicyRepository(),
      makeOrganizationRepository(),
      getContainer().transactionManager,
    );
  }
  return placeManagementService;
}
