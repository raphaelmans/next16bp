export type OwnerSetupNextStep =
  | "create_organization"
  | "add_or_claim_venue"
  | "claim_pending"
  | "verify_venue"
  | "configure_courts"
  | "complete";

export type OwnerSetupVerificationStatus =
  | "UNVERIFIED"
  | "PENDING"
  | "VERIFIED"
  | "REJECTED";

export type OwnerSetupStatus = {
  hasOrganization: boolean;
  organization: { id: string; name: string } | null;
  hasPendingClaim: boolean;
  hasVenue: boolean;
  primaryPlace: { id: string; name: string } | null;
  verificationStatus: OwnerSetupVerificationStatus | null;
  hasVerification: boolean;
  hasActiveCourt: boolean;
  isSetupComplete: boolean;
  nextStep: OwnerSetupNextStep;
};
