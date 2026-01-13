import { makeCourtRepository } from "@/modules/court/factories/court.factory";
import { makeOrganizationRepository } from "@/modules/organization/factories/organization.factory";
import { makeObjectStorageService } from "@/modules/storage/factories/storage.factory";
import { getContainer } from "@/shared/infra/container";
import { PlaceRepository } from "../repositories/place.repository";
import { PlacePhotoRepository } from "../repositories/place-photo.repository";
import { PlaceDiscoveryService } from "../services/place-discovery.service";
import { PlaceManagementService } from "../services/place-management.service";

let placeRepository: PlaceRepository | null = null;
let placePhotoRepository: PlacePhotoRepository | null = null;
let placeDiscoveryService: PlaceDiscoveryService | null = null;
let placeManagementService: PlaceManagementService | null = null;

export function makePlaceRepository(): PlaceRepository {
  if (!placeRepository) {
    placeRepository = new PlaceRepository(getContainer().db);
  }
  return placeRepository;
}

export function makePlacePhotoRepository(): PlacePhotoRepository {
  if (!placePhotoRepository) {
    placePhotoRepository = new PlacePhotoRepository(getContainer().db);
  }
  return placePhotoRepository;
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
      makePlacePhotoRepository(),
      makeOrganizationRepository(),
      getContainer().transactionManager,
      makeObjectStorageService(),
    );
  }
  return placeManagementService;
}
