import { describe, expect, it } from "vitest";
import {
  isOwnerPaymentMethodStepPending,
  isOwnerSetupIncomplete,
  shouldShowOwnerGetStartedNav,
} from "@/features/owner/helpers";

describe("isOwnerSetupIncomplete", () => {
  const cases: Array<{
    label: string;
    input: {
      isSetupComplete: boolean;
      hasPaymentMethod?: boolean;
      nextStep?: string;
    } | null;
    expected: boolean;
  }> = [
    {
      label: "returns false when setup status is missing",
      input: null,
      expected: false,
    },
    {
      label: "returns true when setup is incomplete",
      input: { isSetupComplete: false },
      expected: true,
    },
    {
      label: "returns false when setup is complete",
      input: { isSetupComplete: true },
      expected: false,
    },
    {
      label:
        "returns true when payment method is missing even if setupComplete is true",
      input: { isSetupComplete: true, hasPaymentMethod: false },
      expected: true,
    },
    {
      label:
        "returns true when next step is not complete even if setupComplete is true",
      input: { isSetupComplete: true, nextStep: "configure_courts" },
      expected: true,
    },
    {
      label: "returns false when next step is complete",
      input: { isSetupComplete: true, nextStep: "complete" },
      expected: false,
    },
  ];

  for (const { label, input, expected } of cases) {
    it(label, () => {
      expect(isOwnerSetupIncomplete(input)).toBe(expected);
    });
  }
});

describe("shouldShowOwnerGetStartedNav", () => {
  const cases: Array<{
    label: string;
    input: Parameters<typeof shouldShowOwnerGetStartedNav>[0];
    expected: boolean;
  }> = [
    {
      label: "returns true in no-org mode",
      input: {
        noOrgMode: true,
        setupStatusLoading: true,
        setupStatus: null,
      },
      expected: true,
    },
    {
      label: "returns true while setup status is loading",
      input: {
        noOrgMode: false,
        setupStatusLoading: true,
        setupStatus: { isSetupComplete: false },
      },
      expected: true,
    },
    {
      label: "returns true when setup is incomplete",
      input: {
        noOrgMode: false,
        setupStatusLoading: false,
        setupStatus: { isSetupComplete: false },
      },
      expected: true,
    },
    {
      label: "returns true when payment method is missing",
      input: {
        noOrgMode: false,
        setupStatusLoading: false,
        setupStatus: { isSetupComplete: true, hasPaymentMethod: false },
      },
      expected: true,
    },
    {
      label: "returns true when setup status is missing after load",
      input: {
        noOrgMode: false,
        setupStatusLoading: false,
        setupStatus: null,
      },
      expected: true,
    },
    {
      label: "returns false only when setup is complete",
      input: {
        noOrgMode: false,
        setupStatusLoading: false,
        setupStatus: { isSetupComplete: true },
      },
      expected: false,
    },
  ];

  for (const { label, input, expected } of cases) {
    it(label, () => {
      expect(shouldShowOwnerGetStartedNav(input)).toBe(expected);
    });
  }
});

describe("isOwnerPaymentMethodStepPending", () => {
  const cases: Array<{
    label: string;
    input: {
      isSetupComplete: boolean;
      hasPaymentMethod?: boolean;
      nextStep?: string;
    } | null;
    expected: boolean;
  }> = [
    {
      label: "returns false when status is missing",
      input: null,
      expected: false,
    },
    {
      label: "returns true when hasPaymentMethod is false",
      input: { isSetupComplete: false, hasPaymentMethod: false },
      expected: true,
    },
    {
      label: "returns true when nextStep is add_payment_method",
      input: { isSetupComplete: false, nextStep: "add_payment_method" },
      expected: true,
    },
    {
      label: "returns false when payment method step is not pending",
      input: {
        isSetupComplete: false,
        hasPaymentMethod: true,
        nextStep: "configure_courts",
      },
      expected: false,
    },
  ];

  for (const { label, input, expected } of cases) {
    it(label, () => {
      expect(isOwnerPaymentMethodStepPending(input)).toBe(expected);
    });
  }
});
