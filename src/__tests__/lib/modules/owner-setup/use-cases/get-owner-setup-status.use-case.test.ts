import { describe, expect, it, vi } from "vitest";
import { GetOwnerSetupStatusUseCase } from "@/lib/modules/owner-setup/use-cases/get-owner-setup-status.use-case";

type UseCaseDeps = ConstructorParameters<typeof GetOwnerSetupStatusUseCase>;

type HarnessOptions = {
  organizations?: Array<{ id: string; name: string }>;
  claimRequests?: Array<{ status: string; requestType: string }>;
  places?: Array<{
    id: string;
    name: string;
    createdAt: Date;
    verification?: { status: string | null } | null;
  }>;
  courtsByPlace?: Record<string, Array<{ id: string; isActive: boolean }>>;
  courtHoursCourtIds?: string[];
  courtRateRuleCourtIds?: string[];
  paymentMethods?: Array<{ isActive: boolean }>;
};

const createHarness = (options: HarnessOptions = {}) => {
  const organizationRepositoryFns = {
    findByOwnerId: vi.fn(async () => options.organizations ?? []),
  };
  const placeRepositoryFns = {
    findByOrganizationIdWithVerification: vi.fn(
      async () => options.places ?? [],
    ),
  };
  const claimRequestRepositoryFns = {
    findByRequestedByUserId: vi.fn(async () => options.claimRequests ?? []),
  };
  const courtRepositoryFns = {
    findByPlaceId: vi.fn(
      async (placeId: string) => options.courtsByPlace?.[placeId] ?? [],
    ),
  };
  const courtHoursRepositoryFns = {
    findByCourtIds: vi.fn(async (courtIds: string[]) =>
      (options.courtHoursCourtIds ?? [])
        .filter((courtId) => courtIds.includes(courtId))
        .map((courtId) => ({ courtId })),
    ),
  };
  const courtRateRuleRepositoryFns = {
    findByCourtIds: vi.fn(async (courtIds: string[]) =>
      (options.courtRateRuleCourtIds ?? [])
        .filter((courtId) => courtIds.includes(courtId))
        .map((courtId) => ({ courtId })),
    ),
  };
  const organizationPaymentMethodRepositoryFns = {
    findByOrganizationId: vi.fn(async () => options.paymentMethods ?? []),
  };

  const useCase = new GetOwnerSetupStatusUseCase(
    organizationRepositoryFns as unknown as UseCaseDeps[0],
    placeRepositoryFns as unknown as UseCaseDeps[1],
    claimRequestRepositoryFns as unknown as UseCaseDeps[2],
    courtRepositoryFns as unknown as UseCaseDeps[3],
    courtHoursRepositoryFns as unknown as UseCaseDeps[4],
    courtRateRuleRepositoryFns as unknown as UseCaseDeps[5],
    organizationPaymentMethodRepositoryFns as unknown as UseCaseDeps[6],
  );

  return {
    useCase,
    organizationRepositoryFns,
    placeRepositoryFns,
    claimRequestRepositoryFns,
    courtRepositoryFns,
  };
};

describe("GetOwnerSetupStatusUseCase", () => {
  it("no organization -> returns create_organization state", async () => {
    // Arrange
    const harness = createHarness({
      organizations: [],
      claimRequests: [{ status: "PENDING", requestType: "CLAIM" }],
    });

    // Act
    const result = await harness.useCase.execute("owner-1");

    // Assert
    expect(result).toMatchObject({
      hasOrganization: false,
      hasPendingClaim: true,
      hasVenue: false,
      isSetupComplete: false,
      nextStep: "create_organization",
    });
    expect(
      harness.organizationRepositoryFns.findByOwnerId,
    ).toHaveBeenCalledWith("owner-1");
    expect(
      harness.claimRequestRepositoryFns.findByRequestedByUserId,
    ).toHaveBeenCalledWith("owner-1");
  });

  it("next-step branch coverage -> derives add_or_claim_venue and claim_pending without venues", async () => {
    // Arrange
    const noClaimHarness = createHarness({
      organizations: [{ id: "org-1", name: "Org 1" }],
      claimRequests: [],
      places: [],
    });
    const pendingClaimHarness = createHarness({
      organizations: [{ id: "org-1", name: "Org 1" }],
      claimRequests: [{ status: "PENDING", requestType: "CLAIM" }],
      places: [],
    });

    // Act
    const noClaimResult = await noClaimHarness.useCase.execute("owner-1");
    const pendingClaimResult =
      await pendingClaimHarness.useCase.execute("owner-1");

    // Assert
    expect(noClaimResult.nextStep).toBe("add_or_claim_venue");
    expect(pendingClaimResult.nextStep).toBe("claim_pending");
  });

  it("next-step branch coverage -> derives verify_venue, configure_courts, and add_payment_method", async () => {
    // Arrange
    const verifyVenueHarness = createHarness({
      organizations: [{ id: "org-1", name: "Org 1" }],
      places: [
        {
          id: "place-1",
          name: "Place 1",
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
          verification: { status: null },
        },
      ],
      courtsByPlace: {
        "place-1": [{ id: "court-1", isActive: true }],
      },
    });
    const configureCourtsHarness = createHarness({
      organizations: [{ id: "org-1", name: "Org 1" }],
      places: [
        {
          id: "place-1",
          name: "Place 1",
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
          verification: { status: "VERIFIED" },
        },
      ],
      courtsByPlace: {
        "place-1": [{ id: "court-1", isActive: true }],
      },
      courtHoursCourtIds: [],
      courtRateRuleCourtIds: [],
    });
    const paymentHarness = createHarness({
      organizations: [{ id: "org-1", name: "Org 1" }],
      places: [
        {
          id: "place-1",
          name: "Place 1",
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
          verification: { status: "VERIFIED" },
        },
      ],
      courtsByPlace: {
        "place-1": [{ id: "court-1", isActive: true }],
      },
      courtHoursCourtIds: ["court-1"],
      courtRateRuleCourtIds: ["court-1"],
      paymentMethods: [{ isActive: false }],
    });

    // Act
    const verifyVenueResult =
      await verifyVenueHarness.useCase.execute("owner-1");
    const configureCourtsResult =
      await configureCourtsHarness.useCase.execute("owner-1");
    const paymentResult = await paymentHarness.useCase.execute("owner-1");

    // Assert
    expect(verifyVenueResult.nextStep).toBe("verify_venue");
    expect(configureCourtsResult.nextStep).toBe("configure_courts");
    expect(paymentResult.nextStep).toBe("add_payment_method");
  });

  it("selects latest place as primary and resolves primary/ready court ids", async () => {
    // Arrange
    const harness = createHarness({
      organizations: [{ id: "org-1", name: "Org 1" }],
      places: [
        {
          id: "place-old",
          name: "Old Place",
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
          verification: { status: "VERIFIED" },
        },
        {
          id: "place-new",
          name: "New Place",
          createdAt: new Date("2026-02-01T00:00:00.000Z"),
          verification: { status: "VERIFIED" },
        },
      ],
      courtsByPlace: {
        "place-old": [{ id: "old-court", isActive: true }],
        "place-new": [
          { id: "new-court-ready", isActive: true },
          { id: "new-court-inactive", isActive: false },
        ],
      },
      courtHoursCourtIds: ["new-court-ready"],
      courtRateRuleCourtIds: ["new-court-ready"],
    });

    // Act
    const result = await harness.useCase.execute("owner-1");

    // Assert
    expect(result.primaryPlace).toEqual({ id: "place-new", name: "New Place" });
    expect(result.primaryCourtId).toBe("new-court-ready");
    expect(result.readyCourtId).toBe("new-court-ready");
    expect(result.hasAnyConfiguredVenue).toBe(true);
    expect(result.hasReadyCourt).toBe(true);
  });

  it("verified venue + ready court + active payment -> setup complete", async () => {
    // Arrange
    const harness = createHarness({
      organizations: [{ id: "org-1", name: "Org 1" }],
      places: [
        {
          id: "place-1",
          name: "Main Place",
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
          verification: { status: "VERIFIED" },
        },
      ],
      courtsByPlace: {
        "place-1": [{ id: "court-1", isActive: true }],
      },
      courtHoursCourtIds: ["court-1"],
      courtRateRuleCourtIds: ["court-1"],
      paymentMethods: [{ isActive: true }],
    });

    // Act
    const result = await harness.useCase.execute("owner-1");

    // Assert
    expect(result.isSetupComplete).toBe(true);
    expect(result.nextStep).toBe("complete");
    expect(result.hasPaymentMethod).toBe(true);
  });
});
