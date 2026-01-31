import { makeCourtRepository } from "@/lib/modules/court/factories/court.factory";
import { makeCourtBlockRepository } from "@/lib/modules/court-block/factories/court-block.factory";
import { makeCourtHoursRepository } from "@/lib/modules/court-hours/factories/court-hours.factory";
import { makeCourtPriceOverrideRepository } from "@/lib/modules/court-price-override/factories/court-price-override.factory";
import { makeCourtRateRuleRepository } from "@/lib/modules/court-rate-rule/factories/court-rate-rule.factory";
import { makeGuestProfileRepository } from "@/lib/modules/guest-profile/factories/guest-profile.factory";
import { makeOrganizationRepository } from "@/lib/modules/organization/factories/organization.factory";
import { makePlaceRepository } from "@/lib/modules/place/factories/place.factory";
import {
  makeReservationEventRepository,
  makeReservationRepository,
} from "@/lib/modules/reservation/factories/reservation.factory";
import { makeObjectStorageService } from "@/lib/modules/storage/factories/storage.factory";
import { getContainer } from "@/lib/shared/infra/container";
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
      makeGuestProfileRepository(),
      makeReservationEventRepository(),
      makeCourtHoursRepository(),
      makeCourtRateRuleRepository(),
      makeCourtPriceOverrideRepository(),
    );
  }
  return bookingsImportService;
}
