import type { IClaimRequestRepository } from "@/lib/modules/claim-request/repositories/claim-request.repository";
import type { ICourtRepository } from "@/lib/modules/court/repositories/court.repository";
import type { IOrganizationRepository } from "@/lib/modules/organization/repositories/organization.repository";
import type { IPlaceRepository } from "@/lib/modules/place/repositories/place.repository";
import type { OwnerSetupStatus, OwnerSetupVerificationStatus } from "../dtos";

type PlaceWithVerification = Awaited<
  ReturnType<IPlaceRepository["findByOrganizationIdWithVerification"]>
>[number];

const pickPrimaryPlace = (
  places: PlaceWithVerification[],
): PlaceWithVerification | null => {
  if (places.length === 0) return null;

  return places.reduce((latest, place) => {
    const latestTime = latest.createdAt
      ? new Date(latest.createdAt).getTime()
      : 0;
    const placeTime = place.createdAt ? new Date(place.createdAt).getTime() : 0;
    return placeTime > latestTime ? place : latest;
  });
};

const toVerificationStatus = (
  status: OwnerSetupVerificationStatus | null | undefined,
): OwnerSetupVerificationStatus => status ?? "UNVERIFIED";

export class GetOwnerSetupStatusUseCase {
  constructor(
    private organizationRepository: IOrganizationRepository,
    private placeRepository: IPlaceRepository,
    private claimRequestRepository: IClaimRequestRepository,
    private courtRepository: ICourtRepository,
  ) {}

  async execute(userId: string): Promise<OwnerSetupStatus> {
    const [organizations, claimRequests] = await Promise.all([
      this.organizationRepository.findByOwnerId(userId),
      this.claimRequestRepository.findByRequestedByUserId(userId),
    ]);

    const organization = organizations[0] ?? null;
    const hasOrganization = Boolean(organization);
    const hasPendingClaim = claimRequests.some(
      (claim) => claim.status === "PENDING" && claim.requestType === "CLAIM",
    );

    if (!organization) {
      return {
        hasOrganization: false,
        organization: null,
        hasPendingClaim,
        hasVenue: false,
        primaryPlace: null,
        verificationStatus: null,
        hasVerification: false,
        hasActiveCourt: false,
        primaryCourtId: null,
        isSetupComplete: false,
        nextStep: "create_organization",
      };
    }

    const places =
      await this.placeRepository.findByOrganizationIdWithVerification(
        organization.id,
      );
    const hasVenue = places.length > 0;
    const primaryPlace = pickPrimaryPlace(places);
    const verificationStatus = primaryPlace
      ? toVerificationStatus(primaryPlace.verification?.status ?? null)
      : null;
    const hasVerification =
      verificationStatus === "PENDING" || verificationStatus === "VERIFIED";
    const isVerificationConfirmed = verificationStatus === "VERIFIED";

    const courts = primaryPlace
      ? await this.courtRepository.findByPlaceId(primaryPlace.id)
      : [];
    const activeCourt = courts.find((court) => court.isActive);
    const hasActiveCourt = Boolean(activeCourt);

    const isSetupComplete =
      hasOrganization && hasVenue && isVerificationConfirmed && hasActiveCourt;

    const nextStep = !hasOrganization
      ? "create_organization"
      : !hasVenue && !hasPendingClaim
        ? "add_or_claim_venue"
        : !hasVenue && hasPendingClaim
          ? "claim_pending"
          : !hasVerification
            ? "verify_venue"
            : !hasActiveCourt
              ? "configure_courts"
              : !isVerificationConfirmed
                ? "verify_venue"
                : "complete";

    return {
      hasOrganization,
      organization: { id: organization.id, name: organization.name },
      hasPendingClaim,
      hasVenue,
      primaryPlace: primaryPlace
        ? { id: primaryPlace.id, name: primaryPlace.name }
        : null,
      verificationStatus,
      hasVerification,
      hasActiveCourt,
      primaryCourtId: activeCourt?.id ?? null,
      isSetupComplete,
      nextStep,
    };
  }
}
