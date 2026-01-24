import { makeCourtRepository } from "@/modules/court/factories/court.factory";
import { makeCourtHoursRepository } from "@/modules/court-hours/factories/court-hours.factory";
import { makeCourtPriceOverrideRepository } from "@/modules/court-price-override/factories/court-price-override.factory";
import { makeCourtRateRuleRepository } from "@/modules/court-rate-rule/factories/court-rate-rule.factory";
import { makeOrganizationRepository } from "@/modules/organization/factories/organization.factory";
import { makePlaceRepository } from "@/modules/place/factories/place.factory";
import { ReservationRepository } from "@/modules/reservation/repositories/reservation.repository";
import { getContainer } from "@/shared/infra/container";
import { CourtBlockRepository } from "../repositories/court-block.repository";
import { CourtBlockService } from "../services/court-block.service";

let courtBlockRepository: CourtBlockRepository | null = null;
let courtBlockService: CourtBlockService | null = null;
let reservationRepository: ReservationRepository | null = null;

export function makeCourtBlockRepository(): CourtBlockRepository {
  if (!courtBlockRepository) {
    courtBlockRepository = new CourtBlockRepository(getContainer().db);
  }
  return courtBlockRepository;
}

function makeReservationRepository(): ReservationRepository {
  if (!reservationRepository) {
    reservationRepository = new ReservationRepository(getContainer().db);
  }
  return reservationRepository;
}

export function makeCourtBlockService(): CourtBlockService {
  if (!courtBlockService) {
    courtBlockService = new CourtBlockService(
      makeCourtBlockRepository(),
      makeReservationRepository(),
      makeCourtRepository(),
      makePlaceRepository(),
      makeOrganizationRepository(),
      makeCourtHoursRepository(),
      makeCourtRateRuleRepository(),
      makeCourtPriceOverrideRepository(),
      getContainer().transactionManager,
    );
  }
  return courtBlockService;
}
