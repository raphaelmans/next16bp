import { makeCourtRepository } from "@/lib/modules/court/factories/court.factory";
import { makeCourtBlockRepository } from "@/lib/modules/court-block/factories/court-block.factory";
import { makeCourtHoursRepository } from "@/lib/modules/court-hours/factories/court-hours.factory";
import { makeCourtPriceOverrideRepository } from "@/lib/modules/court-price-override/factories/court-price-override.factory";
import { makeCourtRateRuleRepository } from "@/lib/modules/court-rate-rule/factories/court-rate-rule.factory";
import { makeGuestProfileRepository } from "@/lib/modules/guest-profile/factories/guest-profile.factory";
import {
  makeOrganizationProfileRepository,
  makeOrganizationRepository,
} from "@/lib/modules/organization/factories/organization.factory";
import {
  makeOrganizationPaymentMethodRepository,
  makeOrganizationReservationPolicyRepository,
} from "@/lib/modules/organization-payment/factories/organization-payment.factory";
import { makePaymentProofRepository } from "@/lib/modules/payment-proof/factories/payment-proof.factory";
import {
  makePlacePhotoRepository,
  makePlaceRepository,
} from "@/lib/modules/place/factories/place.factory";
import { makePlaceVerificationRepository } from "@/lib/modules/place-verification/factories/place-verification.factory";
import { makeProfileRepository } from "@/lib/modules/profile/factories/profile.factory";
import { getContainer } from "@/lib/shared/infra/container";
import { ReservationRepository } from "../repositories/reservation.repository";
import { ReservationEventRepository } from "../repositories/reservation-event.repository";
import { ReservationService } from "../services/reservation.service";
import { ReservationOwnerService } from "../services/reservation-owner.service";

let reservationRepository: ReservationRepository | null = null;
let reservationEventRepository: ReservationEventRepository | null = null;
let reservationService: ReservationService | null = null;
let reservationOwnerService: ReservationOwnerService | null = null;

export function makeReservationRepository(): ReservationRepository {
  if (!reservationRepository) {
    reservationRepository = new ReservationRepository(getContainer().db);
  }
  return reservationRepository;
}

export function makeReservationEventRepository(): ReservationEventRepository {
  if (!reservationEventRepository) {
    reservationEventRepository = new ReservationEventRepository(
      getContainer().db,
    );
  }
  return reservationEventRepository;
}

export function makeReservationService(): ReservationService {
  if (!reservationService) {
    reservationService = new ReservationService(
      makeReservationRepository(),
      makeReservationEventRepository(),
      makeProfileRepository(),
      makeCourtRepository(),
      makePlaceRepository(),
      makePlacePhotoRepository(),
      makePlaceVerificationRepository(),
      makeOrganizationReservationPolicyRepository(),
      makeOrganizationPaymentMethodRepository(),
      makeOrganizationRepository(),
      makeOrganizationProfileRepository(),
      makeCourtHoursRepository(),
      makeCourtRateRuleRepository(),
      makeCourtBlockRepository(),
      makeCourtPriceOverrideRepository(),
      getContainer().transactionManager,
    );
  }
  return reservationService;
}

export function makeReservationOwnerService(): ReservationOwnerService {
  if (!reservationOwnerService) {
    reservationOwnerService = new ReservationOwnerService(
      makeReservationRepository(),
      makeReservationEventRepository(),
      makeCourtRepository(),
      makePlaceRepository(),
      makeOrganizationReservationPolicyRepository(),
      makeOrganizationRepository(),
      getContainer().transactionManager,
      makePaymentProofRepository(),
      makeGuestProfileRepository(),
      makeCourtHoursRepository(),
      makeCourtRateRuleRepository(),
      makeCourtPriceOverrideRepository(),
      makeCourtBlockRepository(),
      makeOrganizationPaymentMethodRepository(),
    );
  }
  return reservationOwnerService;
}
