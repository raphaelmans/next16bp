export type ReservationEnablementIssueCode =
  | "PLACE_NOT_RESERVABLE"
  | "VERIFICATION_REQUIRED"
  | "VERIFICATION_PENDING"
  | "VERIFICATION_REJECTED"
  | "RESERVATIONS_DISABLED"
  | "NO_PAYMENT_METHOD"
  | "NO_SCHEDULE"
  | "NO_PRICING";

export type ReservationEnablementIssueTone =
  | "muted"
  | "warning"
  | "destructive";

export type ReservationEnablementIssue = {
  code: ReservationEnablementIssueCode;
  tone: ReservationEnablementIssueTone;
};

export type ReservationEnablementInput = {
  placeType?: "CURATED" | "RESERVABLE" | null;
  verificationStatus?:
    | "UNVERIFIED"
    | "PENDING"
    | "VERIFIED"
    | "REJECTED"
    | null;
  reservationsEnabled?: boolean | null;
  hasPaymentMethods?: boolean | null;
  hasHoursWindows?: boolean | null;
  hasRateRules?: boolean | null;
};

export type ReservationEnablementResult = {
  canShowPublicBooking: boolean;
  issues: ReservationEnablementIssue[];
};

export function getReservationEnablement(
  input: ReservationEnablementInput,
): ReservationEnablementResult {
  const placeType = input.placeType ?? null;
  const isReservable = placeType === "RESERVABLE";
  const issues: ReservationEnablementIssue[] = [];

  if (!isReservable) {
    issues.push({ code: "PLACE_NOT_RESERVABLE", tone: "muted" });
    return { canShowPublicBooking: false, issues };
  }

  const verificationStatus = input.verificationStatus ?? "UNVERIFIED";
  const reservationsEnabled = input.reservationsEnabled ?? false;

  if (verificationStatus !== "VERIFIED") {
    if (verificationStatus === "PENDING") {
      issues.push({ code: "VERIFICATION_PENDING", tone: "warning" });
    } else if (verificationStatus === "REJECTED") {
      issues.push({ code: "VERIFICATION_REJECTED", tone: "destructive" });
    } else {
      issues.push({ code: "VERIFICATION_REQUIRED", tone: "muted" });
    }
  } else if (!reservationsEnabled) {
    issues.push({ code: "RESERVATIONS_DISABLED", tone: "warning" });
  }

  if (input.hasHoursWindows === false) {
    issues.push({ code: "NO_SCHEDULE", tone: "warning" });
  }

  if (input.hasPaymentMethods === false) {
    issues.push({ code: "NO_PAYMENT_METHOD", tone: "warning" });
  }

  if (input.hasRateRules === false) {
    issues.push({ code: "NO_PRICING", tone: "warning" });
  }

  return {
    canShowPublicBooking:
      isReservable &&
      verificationStatus === "VERIFIED" &&
      reservationsEnabled &&
      input.hasPaymentMethods !== false,
    issues,
  };
}
