import { makeCoachRepository } from "@/lib/modules/coach/factories/coach.factory";
import { getContainer } from "@/lib/shared/infra/container";
import { CoachPaymentMethodRepository } from "../repositories/coach-payment-method.repository";
import { CoachPaymentService } from "../services/coach-payment.service";

let coachPaymentMethodRepository: CoachPaymentMethodRepository | null = null;
let coachPaymentService: CoachPaymentService | null = null;

export function makeCoachPaymentMethodRepository(): CoachPaymentMethodRepository {
  if (!coachPaymentMethodRepository) {
    coachPaymentMethodRepository = new CoachPaymentMethodRepository(
      getContainer().db,
    );
  }
  return coachPaymentMethodRepository;
}

export function makeCoachPaymentService(): CoachPaymentService {
  if (!coachPaymentService) {
    coachPaymentService = new CoachPaymentService(
      makeCoachRepository(),
      makeCoachPaymentMethodRepository(),
      getContainer().transactionManager,
    );
  }
  return coachPaymentService;
}
