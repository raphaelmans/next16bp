import type { IClaimRequestRepository } from "@/lib/modules/claim-request/repositories/claim-request.repository";
import type { ICourtRepository } from "@/lib/modules/court/repositories/court.repository";
import type { ICourtHoursRepository } from "@/lib/modules/court-hours/repositories/court-hours.repository";
import type { ICourtRateRuleRepository } from "@/lib/modules/court-rate-rule/repositories/court-rate-rule.repository";
import type { IOrganizationRepository } from "@/lib/modules/organization/repositories/organization.repository";
import type { IPlaceRepository } from "@/lib/modules/place/repositories/place.repository";
import type { OwnerSetupStatus } from "../dtos";
import {
  computeNextStep,
  computePlaceOnboardingStatus,
  normalizeVerificationStatus,
} from "../shared";

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

export class GetOwnerSetupStatusUseCase {
  constructor(
    private organizationRepository: IOrganizationRepository,
    private placeRepository: IPlaceRepository,
    private claimRequestRepository: IClaimRequestRepository,
    private courtRepository: ICourtRepository,
    private courtHoursRepository: ICourtHoursRepository,
    private courtRateRuleRepository: ICourtRateRuleRepository,
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
        hasAnyConfiguredVenue: false,
        primaryPlace: null,
        verificationStatus: null,
        hasVerification: false,
        hasActiveCourt: false,
        hasReadyCourt: false,
        hasCourtSchedule: false,
        hasCourtPricing: false,
        primaryCourtId: null,
        readyCourtId: null,
        isSetupComplete: false,
        nextStep: "create_organization",
      };
    }

    const places =
      await this.placeRepository.findByOrganizationIdWithVerification(
        organization.id,
      );
    const hasVenue = places.length > 0;

    const placeCourtEntries: Array<
      [string, Awaited<ReturnType<ICourtRepository["findByPlaceId"]>>]
    > = await Promise.all(
      places.map(async (place) => {
        const placeCourts = await this.courtRepository.findByPlaceId(place.id);
        return [place.id, placeCourts] as [
          string,
          Awaited<ReturnType<ICourtRepository["findByPlaceId"]>>,
        ];
      }),
    );

    const courtsByPlace = new Map(placeCourtEntries);

    const activeCourtIdsByPlace = new Map<string, string[]>();
    const allActiveCourtIds: string[] = [];

    for (const place of places) {
      const activeCourtIds = (courtsByPlace.get(place.id) ?? [])
        .filter((court) => court.isActive)
        .map((court) => court.id);

      activeCourtIdsByPlace.set(place.id, activeCourtIds);
      allActiveCourtIds.push(...activeCourtIds);
    }

    const [courtHoursWindows, courtRateRules] = await Promise.all([
      this.courtHoursRepository.findByCourtIds(allActiveCourtIds),
      this.courtRateRuleRepository.findByCourtIds(allActiveCourtIds),
    ]);

    const courtsWithHours = new Set(
      courtHoursWindows.map((window) => window.courtId),
    );
    const courtsWithPricing = new Set(
      courtRateRules.map((rule) => rule.courtId),
    );

    const hasAnyConfiguredVenue = places.some((place) => {
      const placeVerificationStatus = normalizeVerificationStatus(
        place.verification?.status ?? null,
      );

      if (placeVerificationStatus !== "VERIFIED") {
        return false;
      }

      const activeCourtIds = activeCourtIdsByPlace.get(place.id) ?? [];
      return activeCourtIds.some(
        (courtId) =>
          courtsWithHours.has(courtId) && courtsWithPricing.has(courtId),
      );
    });

    const primaryPlace = pickPrimaryPlace(places);
    const verificationStatus = primaryPlace
      ? normalizeVerificationStatus(primaryPlace.verification?.status ?? null)
      : null;

    const primaryCourts = primaryPlace
      ? (courtsByPlace.get(primaryPlace.id) ?? [])
      : [];

    const primaryOnboarding = computePlaceOnboardingStatus({
      verificationStatus: verificationStatus ?? "UNVERIFIED",
      courts: primaryCourts.map((c) => ({
        courtId: c.id,
        isActive: c.isActive,
      })),
      courtsWithHours,
      courtsWithPricing,
    });

    const activeCourts = primaryCourts.filter((court) => court.isActive);
    const activeCourt = activeCourts[0] ?? null;
    const readyCourt = activeCourts.find(
      (court) =>
        courtsWithHours.has(court.id) && courtsWithPricing.has(court.id),
    );

    const isSetupComplete =
      hasOrganization &&
      hasVenue &&
      primaryOnboarding.isVerified &&
      primaryOnboarding.hasReadyCourt;

    const nextStep = computeNextStep({
      hasOrganization,
      hasPendingClaim,
      hasVenue,
      hasVerification: primaryOnboarding.hasVerification,
      isVerificationConfirmed: primaryOnboarding.isVerified,
      hasReadyCourt: primaryOnboarding.hasReadyCourt,
    });

    return {
      hasOrganization,
      organization: { id: organization.id, name: organization.name },
      hasPendingClaim,
      hasVenue,
      hasAnyConfiguredVenue,
      primaryPlace: primaryPlace
        ? { id: primaryPlace.id, name: primaryPlace.name }
        : null,
      verificationStatus,
      hasVerification: primaryOnboarding.hasVerification,
      hasActiveCourt: primaryOnboarding.hasActiveCourt,
      hasReadyCourt: primaryOnboarding.hasReadyCourt,
      hasCourtSchedule: primaryOnboarding.hasAnyCourtSchedule,
      hasCourtPricing: primaryOnboarding.hasAnyCourtPricing,
      primaryCourtId: activeCourt?.id ?? null,
      readyCourtId: readyCourt?.id ?? null,
      isSetupComplete,
      nextStep,
    };
  }
}
