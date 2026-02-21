import { describe, expect, it } from "vitest";
import {
  computeCourtConfigs,
  computeNextStep,
  computePlaceOnboardingStatus,
  normalizeVerificationStatus,
} from "@/lib/modules/owner-setup/shared/domain";
import type {
  CourtConfigInput,
  VerificationStatus,
} from "@/lib/modules/owner-setup/shared/types";

describe("normalizeVerificationStatus", () => {
  const cases: Array<{
    label: string;
    input: VerificationStatus | null | undefined;
    expected: VerificationStatus;
  }> = [
    {
      label: "returns UNVERIFIED for null",
      input: null,
      expected: "UNVERIFIED",
    },
    {
      label: "returns UNVERIFIED for undefined",
      input: undefined,
      expected: "UNVERIFIED",
    },
    {
      label: "passes through VERIFIED",
      input: "VERIFIED",
      expected: "VERIFIED",
    },
    { label: "passes through PENDING", input: "PENDING", expected: "PENDING" },
    {
      label: "passes through REJECTED",
      input: "REJECTED",
      expected: "REJECTED",
    },
    {
      label: "passes through UNVERIFIED",
      input: "UNVERIFIED",
      expected: "UNVERIFIED",
    },
  ];

  for (const { label, input, expected } of cases) {
    it(label, () => {
      expect(normalizeVerificationStatus(input)).toBe(expected);
    });
  }
});

describe("computeCourtConfigs", () => {
  it("returns empty array for no courts", () => {
    expect(computeCourtConfigs([], new Set(), new Set())).toEqual([]);
  });

  it("marks active court with hours and pricing as ready", () => {
    const courts: CourtConfigInput[] = [{ courtId: "c1", isActive: true }];
    const result = computeCourtConfigs(
      courts,
      new Set(["c1"]),
      new Set(["c1"]),
    );
    expect(result).toEqual([
      {
        courtId: "c1",
        isActive: true,
        hasSchedule: true,
        hasPricing: true,
        isReady: true,
      },
    ]);
  });

  it("marks inactive court with hours and pricing as not ready", () => {
    const courts: CourtConfigInput[] = [{ courtId: "c1", isActive: false }];
    const result = computeCourtConfigs(
      courts,
      new Set(["c1"]),
      new Set(["c1"]),
    );
    expect(result).toEqual([
      {
        courtId: "c1",
        isActive: false,
        hasSchedule: true,
        hasPricing: true,
        isReady: false,
      },
    ]);
  });

  it("marks active court missing pricing as not ready", () => {
    const courts: CourtConfigInput[] = [{ courtId: "c1", isActive: true }];
    const result = computeCourtConfigs(courts, new Set(["c1"]), new Set());
    expect(result).toEqual([
      {
        courtId: "c1",
        isActive: true,
        hasSchedule: true,
        hasPricing: false,
        isReady: false,
      },
    ]);
  });

  it("marks active court missing schedule as not ready", () => {
    const courts: CourtConfigInput[] = [{ courtId: "c1", isActive: true }];
    const result = computeCourtConfigs(courts, new Set(), new Set(["c1"]));
    expect(result).toEqual([
      {
        courtId: "c1",
        isActive: true,
        hasSchedule: false,
        hasPricing: true,
        isReady: false,
      },
    ]);
  });

  it("handles multiple courts with mixed states", () => {
    const courts: CourtConfigInput[] = [
      { courtId: "c1", isActive: true },
      { courtId: "c2", isActive: true },
      { courtId: "c3", isActive: false },
    ];
    const result = computeCourtConfigs(
      courts,
      new Set(["c1", "c3"]),
      new Set(["c1"]),
    );
    expect(result).toEqual([
      {
        courtId: "c1",
        isActive: true,
        hasSchedule: true,
        hasPricing: true,
        isReady: true,
      },
      {
        courtId: "c2",
        isActive: true,
        hasSchedule: false,
        hasPricing: false,
        isReady: false,
      },
      {
        courtId: "c3",
        isActive: false,
        hasSchedule: true,
        hasPricing: false,
        isReady: false,
      },
    ]);
  });
});

describe("computePlaceOnboardingStatus", () => {
  it("returns not configured for unverified venue with no courts", () => {
    const result = computePlaceOnboardingStatus({
      verificationStatus: "UNVERIFIED",
      courts: [],
      courtsWithHours: new Set(),
      courtsWithPricing: new Set(),
    });
    expect(result.isVerified).toBe(false);
    expect(result.hasVerification).toBe(false);
    expect(result.hasActiveCourt).toBe(false);
    expect(result.hasReadyCourt).toBe(false);
    expect(result.isVenueConfigured).toBe(false);
    expect(result.courts).toEqual([]);
  });

  it("returns configured for verified venue with a ready court", () => {
    const result = computePlaceOnboardingStatus({
      verificationStatus: "VERIFIED",
      courts: [{ courtId: "c1", isActive: true }],
      courtsWithHours: new Set(["c1"]),
      courtsWithPricing: new Set(["c1"]),
    });
    expect(result.isVerified).toBe(true);
    expect(result.hasVerification).toBe(true);
    expect(result.hasActiveCourt).toBe(true);
    expect(result.hasReadyCourt).toBe(true);
    expect(result.hasAnyCourtSchedule).toBe(true);
    expect(result.hasAnyCourtPricing).toBe(true);
    expect(result.isVenueConfigured).toBe(true);
  });

  it("returns not configured when verified but no ready courts", () => {
    const result = computePlaceOnboardingStatus({
      verificationStatus: "VERIFIED",
      courts: [{ courtId: "c1", isActive: true }],
      courtsWithHours: new Set(["c1"]),
      courtsWithPricing: new Set(),
    });
    expect(result.isVerified).toBe(true);
    expect(result.hasReadyCourt).toBe(false);
    expect(result.isVenueConfigured).toBe(false);
  });

  it("returns pending verification state", () => {
    const result = computePlaceOnboardingStatus({
      verificationStatus: "PENDING",
      courts: [{ courtId: "c1", isActive: true }],
      courtsWithHours: new Set(["c1"]),
      courtsWithPricing: new Set(["c1"]),
    });
    expect(result.isVerified).toBe(false);
    expect(result.hasVerification).toBe(true);
    expect(result.isVenueConfigured).toBe(false);
  });

  it("ignores inactive courts for readiness checks", () => {
    const result = computePlaceOnboardingStatus({
      verificationStatus: "VERIFIED",
      courts: [{ courtId: "c1", isActive: false }],
      courtsWithHours: new Set(["c1"]),
      courtsWithPricing: new Set(["c1"]),
    });
    expect(result.hasActiveCourt).toBe(false);
    expect(result.hasReadyCourt).toBe(false);
    expect(result.isVenueConfigured).toBe(false);
  });
});

describe("computeNextStep", () => {
  const cases: Array<{
    label: string;
    input: Parameters<typeof computeNextStep>[0];
    expected: string;
  }> = [
    {
      label: "returns create_organization when no org",
      input: {
        hasOrganization: false,
        hasPendingClaim: false,
        hasVenue: false,
        hasVerification: false,
        isVerificationConfirmed: false,
        hasReadyCourt: false,
      },
      expected: "create_organization",
    },
    {
      label: "returns add_or_claim_venue when org exists but no venue or claim",
      input: {
        hasOrganization: true,
        hasPendingClaim: false,
        hasVenue: false,
        hasVerification: false,
        isVerificationConfirmed: false,
        hasReadyCourt: false,
      },
      expected: "add_or_claim_venue",
    },
    {
      label:
        "returns claim_pending when org exists with pending claim but no venue",
      input: {
        hasOrganization: true,
        hasPendingClaim: true,
        hasVenue: false,
        hasVerification: false,
        isVerificationConfirmed: false,
        hasReadyCourt: false,
      },
      expected: "claim_pending",
    },
    {
      label: "returns verify_venue when venue exists but not verified",
      input: {
        hasOrganization: true,
        hasPendingClaim: false,
        hasVenue: true,
        hasVerification: false,
        isVerificationConfirmed: false,
        hasReadyCourt: false,
      },
      expected: "verify_venue",
    },
    {
      label: "returns configure_courts when verified but no ready court",
      input: {
        hasOrganization: true,
        hasPendingClaim: false,
        hasVenue: true,
        hasVerification: true,
        isVerificationConfirmed: true,
        hasReadyCourt: false,
      },
      expected: "configure_courts",
    },
    {
      label:
        "returns verify_venue when has ready court but verification not confirmed",
      input: {
        hasOrganization: true,
        hasPendingClaim: false,
        hasVenue: true,
        hasVerification: true,
        isVerificationConfirmed: false,
        hasReadyCourt: true,
      },
      expected: "verify_venue",
    },
    {
      label: "returns complete when all conditions met",
      input: {
        hasOrganization: true,
        hasPendingClaim: false,
        hasVenue: true,
        hasVerification: true,
        isVerificationConfirmed: true,
        hasReadyCourt: true,
      },
      expected: "complete",
    },
  ];

  for (const { label, input, expected } of cases) {
    it(label, () => {
      expect(computeNextStep(input)).toBe(expected);
    });
  }
});
