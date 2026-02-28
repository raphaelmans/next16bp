import { describe, expect, it } from "vitest";
import type { SetupStatus } from "@/features/owner/components/get-started/get-started-types";
import {
  canCompleteWizard,
  deriveFirstIncompleteStep,
  getNextStep,
  getPreviousStep,
  getStepIndex,
} from "@/features/owner/components/get-started/wizard/wizard-helpers";

const createStatus = (overrides: Partial<SetupStatus> = {}): SetupStatus => ({
  organization: null,
  organizationId: undefined,
  primaryPlaceId: undefined,
  primaryPlaceName: "your venue",
  verificationStatus: null,
  isVenueVerified: false,
  hasOrganization: false,
  hasPendingClaim: false,
  hasVenue: false,
  hasVerification: false,
  hasActiveCourt: false,
  hasReadyCourt: false,
  hasCourtSchedule: false,
  hasCourtPricing: false,
  hasPaymentMethod: false,
  primaryCourtId: undefined,
  readyCourtId: undefined,
  isSetupComplete: false,
  ...overrides,
});

describe("wizard-helpers", () => {
  it("step-order helpers -> resolve index, next, and previous boundaries", () => {
    expect(getStepIndex("org")).toBe(0);
    expect(getStepIndex("payment")).toBe(4);
    expect(getPreviousStep("org")).toBeNull();
    expect(getNextStep("org")).toBe("venue");
    expect(getNextStep("complete")).toBeNull();
  });

  it("deriveFirstIncompleteStep -> returns org when organization is missing", () => {
    const status = createStatus();
    expect(deriveFirstIncompleteStep(status)).toBe("org");
  });

  it("deriveFirstIncompleteStep -> returns first incomplete actionable step", () => {
    const status = createStatus({
      hasOrganization: true,
      hasVenue: true,
      hasActiveCourt: false,
    });

    expect(deriveFirstIncompleteStep(status)).toBe("courts");
  });

  it("deriveFirstIncompleteStep -> returns complete when all actionable steps are done", () => {
    const status = createStatus({
      hasOrganization: true,
      hasVenue: true,
      hasActiveCourt: true,
      hasCourtSchedule: true,
      hasCourtPricing: true,
      hasPaymentMethod: true,
      hasVerification: true,
    });

    expect(deriveFirstIncompleteStep(status)).toBe("complete");
  });

  it("canCompleteWizard -> only true when all prerequisite steps are complete", () => {
    const completeStatus = createStatus({
      hasOrganization: true,
      hasVenue: true,
      hasActiveCourt: true,
      hasCourtSchedule: true,
      hasCourtPricing: true,
      hasPaymentMethod: true,
      hasVerification: true,
    });
    const incompleteStatus = createStatus({
      hasOrganization: true,
      hasVenue: true,
      hasActiveCourt: true,
      hasCourtSchedule: true,
      hasCourtPricing: false,
      hasPaymentMethod: true,
      hasVerification: true,
    });

    expect(canCompleteWizard(completeStatus)).toBe(true);
    expect(canCompleteWizard(incompleteStatus)).toBe(false);
  });

  it("completion guard -> redirects complete step to first incomplete step", () => {
    const status = createStatus({
      hasOrganization: true,
      hasVenue: false,
    });
    const currentStep = "complete";
    const guardedStep =
      !canCompleteWizard(status) && currentStep === "complete"
        ? deriveFirstIncompleteStep(status)
        : currentStep;

    expect(guardedStep).toBe("venue");
  });
});
