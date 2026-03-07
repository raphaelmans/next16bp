import type {
  PlayerReservationStep,
  ReservationLinkStatus,
} from "@/common/reservation-links";

type ReservationPageStepInput = {
  requestedStep?: PlayerReservationStep | null;
  status?: ReservationLinkStatus | string | null;
  isGroupReservation: boolean;
  hasPayableAwaitingItems: boolean;
};

export function canShowReservationPaymentStep(
  input: Omit<ReservationPageStepInput, "requestedStep">,
): boolean {
  if (!input.status) {
    return false;
  }

  if (input.isGroupReservation) {
    return input.hasPayableAwaitingItems;
  }

  return input.status === "AWAITING_PAYMENT";
}

export function getReservationPageDisplayStep(
  input: ReservationPageStepInput,
): "overview" | PlayerReservationStep {
  return input.requestedStep === "payment" &&
    canShowReservationPaymentStep(input)
    ? "payment"
    : "overview";
}
