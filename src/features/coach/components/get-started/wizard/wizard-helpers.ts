import type { CoachSetupStatus } from "@/lib/modules/coach-setup/shared";
import {
  COACH_STEP_CONFIGS,
  COACH_WIZARD_STEPS,
  type CoachWizardStep,
} from "./wizard-types";

export function getCoachStepConfig(step: CoachWizardStep) {
  return COACH_STEP_CONFIGS[step];
}

export function isCoachStepComplete(
  status: CoachSetupStatus,
  step: CoachWizardStep,
): boolean {
  switch (step) {
    case "profile":
      return status.hasCoachProfile;
    case "sports":
      return status.hasCoachSports;
    case "location":
      return status.hasCoachLocation;
    case "schedule":
      return status.hasCoachSchedule;
    case "pricing":
      return status.hasCoachPricing;
    case "payment":
      return status.hasPaymentMethod;
    case "verify":
      return status.hasVerification;
    case "complete":
      return status.isSetupComplete;
  }
}

export function deriveFirstIncompleteCoachStep(
  status: CoachSetupStatus,
): CoachWizardStep {
  return (
    COACH_WIZARD_STEPS.find(
      (step) => step !== "complete" && !isCoachStepComplete(status, step),
    ) ?? "complete"
  );
}

export function countCompletedCoachSteps(status: CoachSetupStatus): number {
  return COACH_WIZARD_STEPS.filter(
    (step) => step !== "complete" && isCoachStepComplete(status, step),
  ).length;
}
