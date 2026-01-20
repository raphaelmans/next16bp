import { makeOrganizationRepository } from "@/modules/organization/factories/organization.factory";
import { makePlaceRepository } from "@/modules/place/factories/place.factory";
import {
  PlaceVerificationRepository,
  PlaceVerificationRequestDocumentRepository,
  PlaceVerificationRequestEventRepository,
  PlaceVerificationRequestRepository,
} from "@/modules/place-verification/repositories/place-verification.repository";
import { PlaceVerificationService } from "@/modules/place-verification/services/place-verification.service";
import { PlaceVerificationAdminService } from "@/modules/place-verification/services/place-verification-admin.service";
import { makeObjectStorageService } from "@/modules/storage/factories/storage.factory";
import { getContainer } from "@/shared/infra/container";

let placeVerificationRepository: PlaceVerificationRepository | null = null;
let placeVerificationRequestRepository: PlaceVerificationRequestRepository | null =
  null;
let placeVerificationRequestEventRepository: PlaceVerificationRequestEventRepository | null =
  null;
let placeVerificationRequestDocumentRepository: PlaceVerificationRequestDocumentRepository | null =
  null;
let placeVerificationService: PlaceVerificationService | null = null;
let placeVerificationAdminService: PlaceVerificationAdminService | null = null;

export function makePlaceVerificationRepository() {
  if (!placeVerificationRepository) {
    placeVerificationRepository = new PlaceVerificationRepository(
      getContainer().db,
    );
  }
  return placeVerificationRepository;
}

export function makePlaceVerificationRequestRepository() {
  if (!placeVerificationRequestRepository) {
    placeVerificationRequestRepository = new PlaceVerificationRequestRepository(
      getContainer().db,
    );
  }
  return placeVerificationRequestRepository;
}

export function makePlaceVerificationRequestEventRepository() {
  if (!placeVerificationRequestEventRepository) {
    placeVerificationRequestEventRepository =
      new PlaceVerificationRequestEventRepository(getContainer().db);
  }
  return placeVerificationRequestEventRepository;
}

export function makePlaceVerificationRequestDocumentRepository() {
  if (!placeVerificationRequestDocumentRepository) {
    placeVerificationRequestDocumentRepository =
      new PlaceVerificationRequestDocumentRepository(getContainer().db);
  }
  return placeVerificationRequestDocumentRepository;
}

export function makePlaceVerificationService() {
  if (!placeVerificationService) {
    placeVerificationService = new PlaceVerificationService(
      makePlaceVerificationRepository(),
      makePlaceVerificationRequestRepository(),
      makePlaceVerificationRequestEventRepository(),
      makePlaceVerificationRequestDocumentRepository(),
      makeObjectStorageService(),
      getContainer().transactionManager,
      makePlaceRepository(),
      makeOrganizationRepository(),
    );
  }
  return placeVerificationService;
}

export function makePlaceVerificationAdminService() {
  if (!placeVerificationAdminService) {
    placeVerificationAdminService = new PlaceVerificationAdminService(
      makePlaceVerificationRepository(),
      makePlaceVerificationRequestRepository(),
      makePlaceVerificationRequestEventRepository(),
      makePlaceVerificationRequestDocumentRepository(),
      getContainer().transactionManager,
      makePlaceRepository(),
      makeOrganizationRepository(),
    );
  }
  return placeVerificationAdminService;
}
