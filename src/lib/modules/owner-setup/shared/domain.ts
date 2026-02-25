/**
 * Pure domain functions for owner-setup status determination.
 * No IO, no side effects — safe for both server and client.
 */

import type {
  CourtConfigInput,
  CourtConfigResult,
  NextStepInput,
  OwnerSetupNextStep,
  PlaceOnboardingInput,
  PlaceOnboardingStatus,
  VerificationStatus,
} from "./types";

export function normalizeVerificationStatus(
  status: VerificationStatus | null | undefined,
): VerificationStatus {
  return status ?? "UNVERIFIED";
}

export function computeCourtConfigs(
  courts: CourtConfigInput[],
  courtsWithHours: Set<string>,
  courtsWithPricing: Set<string>,
): CourtConfigResult[] {
  return courts.map((court) => {
    const hasSchedule = courtsWithHours.has(court.courtId);
    const hasPricing = courtsWithPricing.has(court.courtId);
    return {
      courtId: court.courtId,
      isActive: court.isActive,
      hasSchedule,
      hasPricing,
      isReady: court.isActive && hasSchedule && hasPricing,
    };
  });
}

export function computePlaceOnboardingStatus(
  input: PlaceOnboardingInput,
): PlaceOnboardingStatus {
  const courtConfigs = computeCourtConfigs(
    input.courts,
    input.courtsWithHours,
    input.courtsWithPricing,
  );

  const activeCourts = courtConfigs.filter((c) => c.isActive);
  const isVerified = input.verificationStatus === "VERIFIED";
  const hasVerification =
    input.verificationStatus === "PENDING" ||
    input.verificationStatus === "VERIFIED";
  const hasActiveCourt = activeCourts.length > 0;
  const hasAnyCourtSchedule = activeCourts.some((c) => c.hasSchedule);
  const hasAnyCourtPricing = activeCourts.some((c) => c.hasPricing);
  const hasReadyCourt = activeCourts.some((c) => c.isReady);
  const isVenueConfigured = isVerified && hasReadyCourt;

  return {
    verificationStatus: input.verificationStatus,
    isVerified,
    hasVerification,
    hasActiveCourt,
    hasReadyCourt,
    hasAnyCourtSchedule,
    hasAnyCourtPricing,
    isVenueConfigured,
    courts: courtConfigs,
  };
}

export function computeNextStep(input: NextStepInput): OwnerSetupNextStep {
  if (!input.hasOrganization) return "create_organization";
  if (!input.hasVenue && !input.hasPendingClaim) return "add_or_claim_venue";
  if (!input.hasVenue && input.hasPendingClaim) return "claim_pending";
  if (!input.hasVerification) return "verify_venue";
  if (!input.hasReadyCourt) return "configure_courts";
  if (!input.isVerificationConfirmed) return "verify_venue";
  if (!input.hasPaymentMethod) return "add_payment_method";
  return "complete";
}
