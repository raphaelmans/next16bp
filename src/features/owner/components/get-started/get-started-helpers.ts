import type { SetupStatus } from "./get-started-types";

type RawSetupResponse = {
  organization?: { id: string; name: string } | null;
  primaryPlace?: { id: string; name: string } | null;
  verificationStatus?: string | null;
  hasOrganization?: boolean;
  hasPendingClaim?: boolean;
  hasVenue?: boolean;
  hasVerification?: boolean;
  hasActiveCourt?: boolean;
  hasReadyCourt?: boolean;
  hasCourtSchedule?: boolean;
  hasCourtPricing?: boolean;
  hasPaymentMethod?: boolean;
  primaryCourtId?: string | null;
  readyCourtId?: string | null;
  isSetupComplete?: boolean;
};

export function deriveSetupStatus(
  raw: RawSetupResponse | undefined,
): SetupStatus {
  const organization = raw?.organization ?? null;
  const verificationStatus = raw?.verificationStatus ?? null;

  return {
    organization,
    organizationId: organization?.id,
    primaryPlaceId: raw?.primaryPlace?.id,
    primaryPlaceName: raw?.primaryPlace?.name ?? "your venue",
    verificationStatus,
    isVenueVerified: verificationStatus === "VERIFIED",
    hasOrganization: raw?.hasOrganization ?? false,
    hasPendingClaim: raw?.hasPendingClaim ?? false,
    hasVenue: raw?.hasVenue ?? false,
    hasVerification: raw?.hasVerification ?? false,
    hasActiveCourt: raw?.hasActiveCourt ?? false,
    hasReadyCourt: raw?.hasReadyCourt ?? false,
    hasCourtSchedule: raw?.hasCourtSchedule ?? false,
    hasCourtPricing: raw?.hasCourtPricing ?? false,
    hasPaymentMethod: raw?.hasPaymentMethod ?? false,
    primaryCourtId: raw?.primaryCourtId ?? undefined,
    readyCourtId: raw?.readyCourtId ?? undefined,
    isSetupComplete: raw?.isSetupComplete ?? false,
  };
}
