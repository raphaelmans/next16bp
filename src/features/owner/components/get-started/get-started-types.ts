export type OverlayStep =
  | "org"
  | "venue"
  | "claim"
  | "courts"
  | "verify"
  | "import"
  | "payment"
  | "manageCourts"
  | "schedule"
  | "availability"
  | null;

export interface SetupStatus {
  organization: { id: string; name: string } | null;
  organizationId: string | undefined;
  primaryPlaceId: string | undefined;
  primaryPlaceName: string;
  verificationStatus: string | null;
  isVenueVerified: boolean;
  hasOrganization: boolean;
  hasPendingClaim: boolean;
  hasVenue: boolean;
  hasVerification: boolean;
  hasActiveCourt: boolean;
  hasReadyCourt: boolean;
  hasCourtSchedule: boolean;
  hasCourtPricing: boolean;
  hasPaymentMethod: boolean;
  primaryCourtId: string | undefined;
  readyCourtId: string | undefined;
  isSetupComplete: boolean;
}
