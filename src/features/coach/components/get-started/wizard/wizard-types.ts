import type {
  CoachSetupNextStep,
  CoachSetupStatus,
} from "@/lib/modules/coach-setup/shared";

export type CoachWizardStep = CoachSetupNextStep;

export type CoachWizardStepConfig = {
  label: string;
  description: string;
};

export const COACH_WIZARD_STEPS: CoachWizardStep[] = [
  "profile",
  "sports",
  "location",
  "schedule",
  "pricing",
  "payment",
  "verify",
  "complete",
];

export const COACH_STEP_CONFIGS: Record<
  CoachWizardStep,
  CoachWizardStepConfig
> = {
  profile: {
    label: "Profile",
    description: "Your public-facing name, bio, and story.",
  },
  sports: {
    label: "Sports",
    description: "Pick sports and coaching coverage.",
  },
  location: {
    label: "Location",
    description: "Tell players where you coach.",
  },
  schedule: {
    label: "Schedule",
    description: "Add weekly availability windows.",
  },
  pricing: {
    label: "Pricing",
    description: "Define session rates before taking bookings.",
  },
  payment: {
    label: "Payment",
    description: "Set the payment methods players will use.",
  },
  verify: {
    label: "Verify",
    description: "Verification placeholder for the first release.",
  },
  complete: {
    label: "Complete",
    description: "You are ready to launch your coach listing.",
  },
};

export type CoachWizardStatus = Pick<
  CoachSetupStatus,
  | "hasCoachProfile"
  | "hasCoachSports"
  | "hasCoachLocation"
  | "hasCoachSchedule"
  | "hasCoachPricing"
  | "hasPaymentMethod"
  | "hasVerification"
  | "isSetupComplete"
>;
