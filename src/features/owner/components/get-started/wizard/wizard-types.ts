import type { SetupStatus } from "../get-started-types";

export const WIZARD_STEPS = [
  "org",
  "venue",
  "courts",
  "config",
  "payment",
  "verify",
  "complete",
] as const;

export type WizardStep = (typeof WIZARD_STEPS)[number];

export interface StepConfig {
  key: WizardStep;
  label: string;
  description: string;
  skippable: boolean;
  isComplete: (status: SetupStatus) => boolean;
}

export const STEP_CONFIGS: StepConfig[] = [
  {
    key: "org",
    label: "Organization",
    description: "Create your organization to manage venues and courts.",
    skippable: false,
    isComplete: (s) => s.hasOrganization,
  },
  {
    key: "venue",
    label: "Venue",
    description: "Add a new venue or claim an existing listing.",
    skippable: false,
    isComplete: (s) => s.hasVenue || s.hasPendingClaim,
  },
  {
    key: "courts",
    label: "Courts",
    description: "Set up your first court — you can add more anytime.",
    skippable: false,
    isComplete: (s) => s.hasActiveCourt,
  },
  {
    key: "config",
    label: "Schedule & Pricing",
    description: "Set operating hours and pricing for your courts.",
    skippable: true,
    isComplete: (s) => s.hasCourtSchedule && s.hasCourtPricing,
  },
  {
    key: "payment",
    label: "Payment",
    description: "Add a payment method for booking payments.",
    skippable: true,
    isComplete: (s) => s.hasPaymentMethod,
  },
  {
    key: "verify",
    label: "Verification",
    description: "Submit proof of ownership to improve your venue status.",
    skippable: true,
    isComplete: (s) => s.isVenueVerified,
  },
  {
    key: "complete",
    label: "Complete",
    description: "You're all set!",
    skippable: false,
    isComplete: () => false,
  },
];
