import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SetupStatus } from "@/features/owner/components/get-started/get-started-types";

const mockUseQueryState = vi.fn();
const mockParseAsStringLiteral = vi.fn();
const mockWithDefault = vi.fn();
const mockWithOptions = vi.fn();

vi.mock("nuqs", () => ({
  parseAsStringLiteral: (...args: unknown[]) =>
    mockParseAsStringLiteral(...args),
  useQueryState: (...args: unknown[]) => mockUseQueryState(...args),
}));

import {
  useWizardAutoSkip,
  useWizardStep,
} from "@/features/owner/components/get-started/wizard/wizard-hooks";

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

describe("wizard-hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWithOptions.mockReturnValue("parser-with-options");
    mockWithDefault.mockReturnValue({ withOptions: mockWithOptions });
    mockParseAsStringLiteral.mockReturnValue({ withDefault: mockWithDefault });
    mockUseQueryState.mockReturnValue(["org", vi.fn()]);
  });

  it("useWizardStep -> wires step query-state parser with expected defaults", () => {
    // Arrange
    const setStep = vi.fn();
    mockUseQueryState.mockReturnValue(["venue", setStep]);

    // Act
    const { result } = renderHook(() => useWizardStep());

    // Assert
    expect(result.current[0]).toBe("venue");
    expect(result.current[1]).toBe(setStep);
    expect(mockWithDefault).toHaveBeenCalledWith("org");
    expect(mockWithOptions).toHaveBeenCalledWith({ history: "push" });
    expect(mockUseQueryState).toHaveBeenCalledWith(
      "step",
      "parser-with-options",
    );
  });

  it("useWizardAutoSkip -> auto-skips from org to first incomplete step once", async () => {
    // Arrange
    const setStep = vi.fn();
    const status = createStatus({
      hasOrganization: true,
      hasVenue: false,
    });
    const { rerender } = renderHook(
      (props: { status: SetupStatus; isLoading: boolean; step: "org" }) =>
        useWizardAutoSkip(props.status, props.isLoading, props.step, setStep),
      {
        initialProps: {
          status,
          isLoading: false,
          step: "org",
        },
      },
    );

    // Act + Assert
    await waitFor(() => {
      expect(setStep).toHaveBeenCalledWith("venue");
    });

    rerender({
      status,
      isLoading: false,
      step: "org",
    });
    expect(setStep).toHaveBeenCalledTimes(1);
  });

  it("useWizardAutoSkip -> does not run while loading", () => {
    // Arrange
    const setStep = vi.fn();
    const status = createStatus({
      hasOrganization: true,
      hasVenue: false,
    });

    // Act
    renderHook(() => useWizardAutoSkip(status, true, "org", setStep));

    // Assert
    expect(setStep).not.toHaveBeenCalled();
  });

  it("useWizardAutoSkip -> does not skip when current step is not org", () => {
    // Arrange
    const setStep = vi.fn();
    const status = createStatus({
      hasOrganization: true,
      hasVenue: false,
    });

    // Act
    renderHook(() => useWizardAutoSkip(status, false, "venue", setStep));

    // Assert
    expect(setStep).not.toHaveBeenCalled();
  });

  it("useWizardAutoSkip -> does not set step when first incomplete is org", () => {
    // Arrange
    const setStep = vi.fn();
    const status = createStatus();

    // Act
    renderHook(() => useWizardAutoSkip(status, false, "org", setStep));

    // Assert
    expect(setStep).not.toHaveBeenCalled();
  });
});
