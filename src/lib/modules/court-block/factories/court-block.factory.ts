import { makeAvailabilityChangeEventService } from "@/lib/modules/availability/factories/availability-change-event.factory";
import { makeCourtRepository } from "@/lib/modules/court/factories/court.factory";
import { makeCourtHoursRepository } from "@/lib/modules/court-hours/factories/court-hours.factory";
import { makeCourtPriceOverrideRepository } from "@/lib/modules/court-price-override/factories/court-price-override.factory";
import { makeCourtRateRuleRepository } from "@/lib/modules/court-rate-rule/factories/court-rate-rule.factory";
import { makeOrganizationMemberService } from "@/lib/modules/organization-member/factories/organization-member.factory";
import { makePlaceRepository } from "@/lib/modules/place/factories/place.factory";
import { ReservationRepository } from "@/lib/modules/reservation/repositories/reservation.repository";
import { getContainer } from "@/lib/shared/infra/container";
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
      makeOrganizationMemberService(),
      makeCourtHoursRepository(),
      makeCourtRateRuleRepository(),
      makeCourtPriceOverrideRepository(),
      getContainer().transactionManager,
      makeAvailabilityChangeEventService(),
    );
  }
  return courtBlockService;
}
