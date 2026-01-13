import { makeCourtRepository } from "@/modules/court/factories/court.factory";
import { makeOrganizationRepository } from "@/modules/organization/factories/organization.factory";
import {
  makeOrganizationPaymentMethodRepository,
  makeOrganizationReservationPolicyRepository,
} from "@/modules/organization-payment/factories/organization-payment.factory";
import { makePlaceRepository } from "@/modules/place/factories/place.factory";
import { makeProfileRepository } from "@/modules/profile/factories/profile.factory";
import { makeTimeSlotRepository } from "@/modules/time-slot/factories/time-slot.factory";
import { getContainer } from "@/shared/infra/container";
import { ReservationRepository } from "../repositories/reservation.repository";
import { ReservationEventRepository } from "../repositories/reservation-event.repository";
import { ReservationService } from "../services/reservation.service";
import { ReservationOwnerService } from "../services/reservation-owner.service";
import { CreateFreeReservationUseCase } from "../use-cases/create-free-reservation.use-case";
import { CreatePaidReservationUseCase } from "../use-cases/create-paid-reservation.use-case";

let reservationRepository: ReservationRepository | null = null;
let reservationEventRepository: ReservationEventRepository | null = null;
let createFreeReservationUseCase: CreateFreeReservationUseCase | null = null;
let createPaidReservationUseCase: CreatePaidReservationUseCase | null = null;
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

export function makeCreateFreeReservationUseCase(): CreateFreeReservationUseCase {
  if (!createFreeReservationUseCase) {
    createFreeReservationUseCase = new CreateFreeReservationUseCase(
      makeReservationRepository(),
      makeReservationEventRepository(),
      makeTimeSlotRepository(),
      makeProfileRepository(),
      getContainer().transactionManager,
    );
  }
  return createFreeReservationUseCase;
}

export function makeCreatePaidReservationUseCase(): CreatePaidReservationUseCase {
  if (!createPaidReservationUseCase) {
    createPaidReservationUseCase = new CreatePaidReservationUseCase(
      makeReservationRepository(),
      makeReservationEventRepository(),
      makeTimeSlotRepository(),
      makeProfileRepository(),
      getContainer().transactionManager,
    );
  }
  return createPaidReservationUseCase;
}

export function makeReservationService(): ReservationService {
  if (!reservationService) {
    reservationService = new ReservationService(
      makeReservationRepository(),
      makeReservationEventRepository(),
      makeTimeSlotRepository(),
      makeProfileRepository(),
      makeCourtRepository(),
      makePlaceRepository(),
      makeOrganizationReservationPolicyRepository(),
      makeOrganizationPaymentMethodRepository(),
      makeCreateFreeReservationUseCase(),
      makeCreatePaidReservationUseCase(),
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
      makeTimeSlotRepository(),
      makeCourtRepository(),
      makePlaceRepository(),
      makeOrganizationReservationPolicyRepository(),
      makeOrganizationRepository(),
      getContainer().transactionManager,
    );
  }
  return reservationOwnerService;
}
