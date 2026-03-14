import { makeAvailabilityChangeEventService } from "@/lib/modules/availability/factories/availability-change-event.factory";
import { makeCoachRepository } from "@/lib/modules/coach/factories/coach.factory";
import { makeCoachAddonRepository } from "@/lib/modules/coach-addon/factories/coach-addon.factory";
import { makeCoachBlockRepository } from "@/lib/modules/coach-block/factories/coach-block.factory";
import { makeCoachHoursRepository } from "@/lib/modules/coach-hours/factories/coach-hours.factory";
import { makeCoachRateRuleRepository } from "@/lib/modules/coach-rate-rule/factories/coach-rate-rule.factory";
import { makeCourtRepository } from "@/lib/modules/court/factories/court.factory";
import { makeCourtAddonRepository } from "@/lib/modules/court-addon/factories/court-addon.factory";
import { makeCourtBlockRepository } from "@/lib/modules/court-block/factories/court-block.factory";
import { makeCourtHoursRepository } from "@/lib/modules/court-hours/factories/court-hours.factory";
import { makeCourtPriceOverrideRepository } from "@/lib/modules/court-price-override/factories/court-price-override.factory";
import { makeCourtRateRuleRepository } from "@/lib/modules/court-rate-rule/factories/court-rate-rule.factory";
import { makeGuestProfileRepository } from "@/lib/modules/guest-profile/factories/guest-profile.factory";
import { makeNotificationDeliveryService } from "@/lib/modules/notification-delivery/factories/notification-delivery.factory";
import {
  makeOrganizationProfileRepository,
  makeOrganizationRepository,
} from "@/lib/modules/organization/factories/organization.factory";
import { makeOrganizationMemberService } from "@/lib/modules/organization-member/factories/organization-member.factory";
import {
  makeOrganizationPaymentMethodRepository,
  makeOrganizationReservationPolicyRepository,
} from "@/lib/modules/organization-payment/factories/organization-payment.factory";
import { makePaymentProofRepository } from "@/lib/modules/payment-proof/factories/payment-proof.factory";
import {
  makePlacePhotoRepository,
  makePlaceRepository,
} from "@/lib/modules/place/factories/place.factory";
import { makePlaceAddonRepository } from "@/lib/modules/place-addon/factories/place-addon.factory";
import { makePlaceVerificationRepository } from "@/lib/modules/place-verification/factories/place-verification.factory";
import { makeProfileRepository } from "@/lib/modules/profile/factories/profile.factory";
import { makeObjectStorageService } from "@/lib/modules/storage/factories/storage.factory";
import { getContainer } from "@/lib/shared/infra/container";
import { ReservationRepository } from "../repositories/reservation.repository";
import { ReservationEventRepository } from "../repositories/reservation-event.repository";
import { ReservationService } from "../services/reservation.service";
import { CoachReservationService } from "../services/reservation-coach.service";
import { ReservationOwnerService } from "../services/reservation-owner.service";
import { ExpireStaleReservationsUseCase } from "../use-cases/expire-stale-reservations.use-case";

let reservationRepository: ReservationRepository | null = null;
let reservationEventRepository: ReservationEventRepository | null = null;
let reservationService: ReservationService | null = null;
let reservationOwnerService: ReservationOwnerService | null = null;
let coachReservationService: CoachReservationService | null = null;
let expireStaleReservationsUseCase: ExpireStaleReservationsUseCase | null =
  null;

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

export function makeExpireStaleReservationsUseCase(): ExpireStaleReservationsUseCase {
  if (!expireStaleReservationsUseCase) {
    expireStaleReservationsUseCase = new ExpireStaleReservationsUseCase(
      makeReservationRepository(),
      makeReservationEventRepository(),
      makeCourtRepository(),
      makePlaceRepository(),
      makeAvailabilityChangeEventService(),
      getContainer().transactionManager,
    );
  }
  return expireStaleReservationsUseCase;
}

export function makeReservationService(): ReservationService {
  if (!reservationService) {
    reservationService = new ReservationService(
      makeReservationRepository(),
      makeReservationEventRepository(),
      makeProfileRepository(),
      makeCoachRepository(),
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
      makeCourtAddonRepository(),
      makePlaceAddonRepository(),
      makeCourtBlockRepository(),
      makeCourtPriceOverrideRepository(),
      getContainer().transactionManager,
      makeNotificationDeliveryService(),
      makeAvailabilityChangeEventService(),
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
      makeProfileRepository(),
      makeOrganizationReservationPolicyRepository(),
      makeOrganizationRepository(),
      getContainer().transactionManager,
      makeExpireStaleReservationsUseCase(),
      makeNotificationDeliveryService(),
      makeAvailabilityChangeEventService(),
      makePaymentProofRepository(),
      makeGuestProfileRepository(),
      makeCourtHoursRepository(),
      makeCourtRateRuleRepository(),
      makeCourtPriceOverrideRepository(),
      makeCourtBlockRepository(),
      makeOrganizationPaymentMethodRepository(),
      makeObjectStorageService(),
      makeOrganizationMemberService(),
    );
  }
  return reservationOwnerService;
}

export function makeCoachReservationService(): CoachReservationService {
  if (!coachReservationService) {
    coachReservationService = new CoachReservationService(
      makeReservationRepository(),
      makeReservationEventRepository(),
      makeProfileRepository(),
      makeCoachRepository(),
      makeCoachHoursRepository(),
      makeCoachRateRuleRepository(),
      makeCoachAddonRepository(),
      makeCoachBlockRepository(),
      getContainer().transactionManager,
    );
  }
  return coachReservationService;
}
