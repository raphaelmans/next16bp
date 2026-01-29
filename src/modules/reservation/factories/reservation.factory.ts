import { makeCourtRepository } from "@/modules/court/factories/court.factory";
import { makeCourtBlockRepository } from "@/modules/court-block/factories/court-block.factory";
import { makeCourtHoursRepository } from "@/modules/court-hours/factories/court-hours.factory";
import { makeCourtPriceOverrideRepository } from "@/modules/court-price-override/factories/court-price-override.factory";
import { makeCourtRateRuleRepository } from "@/modules/court-rate-rule/factories/court-rate-rule.factory";
import { makeGuestProfileRepository } from "@/modules/guest-profile/factories/guest-profile.factory";
import {
  makeOrganizationProfileRepository,
  makeOrganizationRepository,
} from "@/modules/organization/factories/organization.factory";
import {
  makeOrganizationPaymentMethodRepository,
  makeOrganizationReservationPolicyRepository,
} from "@/modules/organization-payment/factories/organization-payment.factory";
import { makePaymentProofRepository } from "@/modules/payment-proof/factories/payment-proof.factory";
import {
  makePlacePhotoRepository,
  makePlaceRepository,
} from "@/modules/place/factories/place.factory";
import { makePlaceVerificationRepository } from "@/modules/place-verification/factories/place-verification.factory";
import { makeProfileRepository } from "@/modules/profile/factories/profile.factory";
import { getContainer } from "@/shared/infra/container";
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
