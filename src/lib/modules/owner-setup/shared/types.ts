/**
 * Shared types for owner-setup domain logic.
 * Importable by both server and client — no side effects.
 */

export type VerificationStatus =
  | "UNVERIFIED"
  | "PENDING"
  | "VERIFIED"
  | "REJECTED";

export type OwnerSetupNextStep =
  | "create_organization"
  | "add_or_claim_venue"
  | "claim_pending"
  | "verify_venue"
  | "configure_courts"
  | "complete";

export type CourtConfigInput = {
  courtId: string;
  isActive: boolean;
};

export type CourtConfigResult = {
  courtId: string;
  isActive: boolean;
  hasSchedule: boolean;
  hasPricing: boolean;
  isReady: boolean;
};

export type PlaceOnboardingInput = {
  verificationStatus: VerificationStatus;
  courts: CourtConfigInput[];
  courtsWithHours: Set<string>;
  courtsWithPricing: Set<string>;
};

export type PlaceOnboardingStatus = {
  verificationStatus: VerificationStatus;
  isVerified: boolean;
  hasVerification: boolean;
  hasActiveCourt: boolean;
  hasReadyCourt: boolean;
  hasAnyCourtSchedule: boolean;
  hasAnyCourtPricing: boolean;
  isVenueConfigured: boolean;
  courts: CourtConfigResult[];
};

export type NextStepInput = {
  hasOrganization: boolean;
  hasPendingClaim: boolean;
  hasVenue: boolean;
  hasVerification: boolean;
  isVerificationConfirmed: boolean;
  hasReadyCourt: boolean;
};
