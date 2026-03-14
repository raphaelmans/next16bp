import type {
  CoachSetupNextStep,
  CoachSetupSnapshot,
  CoachSetupStatus,
} from "./types";

const hasText = (value: string | null | undefined) =>
  (value?.trim().length ?? 0) > 0;

export function computeCoachProfileReady(
  snapshot: CoachSetupSnapshot | null,
): boolean {
  if (!snapshot) return false;

  return (
    hasText(snapshot.name) && hasText(snapshot.tagline) && hasText(snapshot.bio)
  );
}

export function computeCoachSportsReady(
  snapshot: CoachSetupSnapshot | null,
): boolean {
  return (snapshot?.sportsCount ?? 0) > 0;
}

export function computeCoachLocationReady(
  snapshot: CoachSetupSnapshot | null,
): boolean {
  if (!snapshot) return false;

  return hasText(snapshot.city) && hasText(snapshot.province);
}

export function computeCoachScheduleReady(
  snapshot: CoachSetupSnapshot | null,
): boolean {
  return (snapshot?.hoursCount ?? 0) > 0;
}

export function computeCoachPricingReady(
  snapshot: CoachSetupSnapshot | null,
): boolean {
  return (snapshot?.rateRuleCount ?? 0) > 0;
}

export function computeCoachPaymentReady(
  snapshot: CoachSetupSnapshot | null,
): boolean {
  return (snapshot?.paymentMethodCount ?? 0) > 0;
}

export function computeCoachVerificationReady(): boolean {
  // Step 3 keeps verification as a placeholder until the real flow lands.
  return true;
}

export function computeCoachNextStep(input: {
  hasCoachProfile: boolean;
  hasCoachSports: boolean;
  hasCoachLocation: boolean;
  hasCoachSchedule: boolean;
  hasCoachPricing: boolean;
  hasPaymentMethod: boolean;
  hasVerification: boolean;
}): CoachSetupNextStep {
  if (!input.hasCoachProfile) return "profile";
  if (!input.hasCoachSports) return "sports";
  if (!input.hasCoachLocation) return "location";
  if (!input.hasCoachSchedule) return "schedule";
  if (!input.hasCoachPricing) return "pricing";
  if (!input.hasPaymentMethod) return "payment";
  if (!input.hasVerification) return "verify";
  return "complete";
}

export function buildEmptyCoachSetupStatus(): CoachSetupStatus {
  const hasVerification = computeCoachVerificationReady();

  return {
    coachId: null,
    hasCoachProfile: false,
    hasCoachSports: false,
    hasCoachLocation: false,
    hasCoachSchedule: false,
    hasCoachPricing: false,
    hasPaymentMethod: false,
    hasVerification,
    isSetupComplete: false,
    nextStep: "profile",
  };
}
