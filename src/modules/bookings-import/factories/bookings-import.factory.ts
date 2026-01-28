import { makeCourtRepository } from "@/modules/court/factories/court.factory";
import { makeCourtBlockRepository } from "@/modules/court-block/factories/court-block.factory";
import { makeOrganizationRepository } from "@/modules/organization/factories/organization.factory";
import { makePlaceRepository } from "@/modules/place/factories/place.factory";
import { makeReservationRepository } from "@/modules/reservation/factories/reservation.factory";
import { makeObjectStorageService } from "@/modules/storage/factories/storage.factory";
import { getContainer } from "@/shared/infra/container";
import { BookingsImportJobRepository } from "../repositories/bookings-import-job.repository";
import { BookingsImportRowRepository } from "../repositories/bookings-import-row.repository";
import { BookingsImportSourceRepository } from "../repositories/bookings-import-source.repository";
import { BookingsImportService } from "../services/bookings-import.service";

let bookingsImportJobRepository: BookingsImportJobRepository | null = null;
let bookingsImportRowRepository: BookingsImportRowRepository | null = null;
let bookingsImportSourceRepository: BookingsImportSourceRepository | null =
  null;
let bookingsImportService: BookingsImportService | null = null;

export function makeBookingsImportJobRepository(): BookingsImportJobRepository {
  if (!bookingsImportJobRepository) {
    bookingsImportJobRepository = new BookingsImportJobRepository(
      getContainer().db,
    );
  }
  return bookingsImportJobRepository;
}

export function makeBookingsImportRowRepository(): BookingsImportRowRepository {
  if (!bookingsImportRowRepository) {
    bookingsImportRowRepository = new BookingsImportRowRepository(
      getContainer().db,
    );
  }
  return bookingsImportRowRepository;
}

export function makeBookingsImportSourceRepository(): BookingsImportSourceRepository {
  if (!bookingsImportSourceRepository) {
    bookingsImportSourceRepository = new BookingsImportSourceRepository(
      getContainer().db,
    );
  }
  return bookingsImportSourceRepository;
}

export function makeBookingsImportService(): BookingsImportService {
  if (!bookingsImportService) {
    bookingsImportService = new BookingsImportService(
      makePlaceRepository(),
      makeOrganizationRepository(),
      makeObjectStorageService(),
      makeBookingsImportJobRepository(),
      makeBookingsImportRowRepository(),
      makeBookingsImportSourceRepository(),
      makeCourtRepository(),
      makeCourtBlockRepository(),
      makeReservationRepository(),
      getContainer().transactionManager,
    );
  }
  return bookingsImportService;
}
