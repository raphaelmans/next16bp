import { makeObjectStorageService } from "@/lib/modules/storage/factories/storage.factory";
import { getContainer } from "@/lib/shared/infra/container";
import {
  PaymentProofRepository,
  ProfileRepository,
  ReservationRepository,
} from "../repositories/payment-proof.repository";
import { PaymentProofService } from "../services/payment-proof.service";

let paymentProofRepository: PaymentProofRepository | null = null;
let reservationRepository: ReservationRepository | null = null;
let profileRepository: ProfileRepository | null = null;
let paymentProofService: PaymentProofService | null = null;

export function makePaymentProofRepository() {
  if (!paymentProofRepository) {
    paymentProofRepository = new PaymentProofRepository(getContainer().db);
  }
  return paymentProofRepository;
}

export function makeReservationRepository() {
  if (!reservationRepository) {
    reservationRepository = new ReservationRepository(getContainer().db);
  }
  return reservationRepository;
}

export function makeProfileRepository() {
  if (!profileRepository) {
    profileRepository = new ProfileRepository(getContainer().db);
  }
  return profileRepository;
}

export function makePaymentProofService() {
  if (!paymentProofService) {
    paymentProofService = new PaymentProofService(
      makePaymentProofRepository(),
      makeReservationRepository(),
      makeProfileRepository(),
      makeObjectStorageService(),
    );
  }
  return paymentProofService;
}
