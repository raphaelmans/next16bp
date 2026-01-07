import { getContainer } from "@/shared/infra/container";
import { CourtRepository } from "../repositories/court.repository";
import { AdminCourtRepository } from "../repositories/admin-court.repository";
import { CourtPhotoRepository } from "../repositories/court-photo.repository";
import { CourtAmenityRepository } from "../repositories/court-amenity.repository";
import { ReservableCourtDetailRepository } from "../repositories/reservable-court-detail.repository";
import { CourtDiscoveryService } from "../services/court-discovery.service";
import { AdminCourtService } from "../services/admin-court.service";
import { CourtManagementService } from "../services/court-management.service";
import { CreateReservableCourtUseCase } from "../use-cases/create-reservable-court.use-case";
import { CreateSimpleCourtUseCase } from "../use-cases/create-simple-court.use-case";
import { makeOrganizationRepository } from "@/modules/organization/factories/organization.factory";

let courtRepository: CourtRepository | null = null;
let adminCourtRepository: AdminCourtRepository | null = null;
let courtPhotoRepository: CourtPhotoRepository | null = null;
let courtAmenityRepository: CourtAmenityRepository | null = null;
let reservableCourtDetailRepository: ReservableCourtDetailRepository | null =
  null;
let courtDiscoveryService: CourtDiscoveryService | null = null;
let adminCourtService: AdminCourtService | null = null;
let courtManagementService: CourtManagementService | null = null;
let createReservableCourtUseCase: CreateReservableCourtUseCase | null = null;
let createSimpleCourtUseCase: CreateSimpleCourtUseCase | null = null;

export function makeCourtRepository() {
  if (!courtRepository) {
    courtRepository = new CourtRepository(getContainer().db);
  }
  return courtRepository;
}

export function makeAdminCourtRepository() {
  if (!adminCourtRepository) {
    adminCourtRepository = new AdminCourtRepository(getContainer().db);
  }
  return adminCourtRepository;
}

export function makeCourtPhotoRepository() {
  if (!courtPhotoRepository) {
    courtPhotoRepository = new CourtPhotoRepository(getContainer().db);
  }
  return courtPhotoRepository;
}

export function makeCourtAmenityRepository() {
  if (!courtAmenityRepository) {
    courtAmenityRepository = new CourtAmenityRepository(getContainer().db);
  }
  return courtAmenityRepository;
}

export function makeReservableCourtDetailRepository() {
  if (!reservableCourtDetailRepository) {
    reservableCourtDetailRepository = new ReservableCourtDetailRepository(
      getContainer().db,
    );
  }
  return reservableCourtDetailRepository;
}

export function makeCourtDiscoveryService() {
  if (!courtDiscoveryService) {
    courtDiscoveryService = new CourtDiscoveryService(makeCourtRepository());
  }
  return courtDiscoveryService;
}

export function makeAdminCourtService() {
  if (!adminCourtService) {
    adminCourtService = new AdminCourtService(
      makeAdminCourtRepository(),
      getContainer().transactionManager,
    );
  }
  return adminCourtService;
}

export function makeCourtManagementService() {
  if (!courtManagementService) {
    courtManagementService = new CourtManagementService(
      makeCourtRepository(),
      makeReservableCourtDetailRepository(),
      makeCourtPhotoRepository(),
      makeCourtAmenityRepository(),
      makeOrganizationRepository(),
      getContainer().transactionManager,
    );
  }
  return courtManagementService;
}

export function makeCreateReservableCourtUseCase() {
  if (!createReservableCourtUseCase) {
    createReservableCourtUseCase = new CreateReservableCourtUseCase(
      makeCourtRepository(),
      makeReservableCourtDetailRepository(),
      makeCourtPhotoRepository(),
      makeCourtAmenityRepository(),
      makeOrganizationRepository(),
      getContainer().transactionManager,
    );
  }
  return createReservableCourtUseCase;
}

export function makeCreateSimpleCourtUseCase() {
  if (!createSimpleCourtUseCase) {
    createSimpleCourtUseCase = new CreateSimpleCourtUseCase(
      makeCourtRepository(),
      makeReservableCourtDetailRepository(),
      makeOrganizationRepository(),
      getContainer().transactionManager,
    );
  }
  return createSimpleCourtUseCase;
}
