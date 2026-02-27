import type { SetupStatus } from "../get-started-types";
import {
  STEP_CONFIGS,
  type StepConfig,
  WIZARD_STEPS,
  type WizardStep,
} from "./wizard-types";

export function getStepConfig(step: WizardStep): StepConfig {
  const config = STEP_CONFIGS.find((c) => c.key === step);
  if (!config) throw new Error(`Unknown wizard step: ${step}`);
  return config;
}

export function isStepComplete(step: WizardStep, status: SetupStatus): boolean {
  return getStepConfig(step).isComplete(status);
}

export function deriveFirstIncompleteStep(status: SetupStatus): WizardStep {
  for (const config of STEP_CONFIGS) {
    if (config.key === "complete") return "complete";
    if (!config.isComplete(status)) return config.key;
  }
  return "complete";
}

/** All actionable steps satisfied — gates the "complete" transition. */
export function canCompleteWizard(status: SetupStatus): boolean {
  return STEP_CONFIGS.filter((c) => c.key !== "complete").every((c) =>
    c.isComplete(status),
  );
}

export function getStepIndex(step: WizardStep): number {
  return WIZARD_STEPS.indexOf(step);
}

export function getNextStep(step: WizardStep): WizardStep | null {
  const index = getStepIndex(step);
  return index < WIZARD_STEPS.length - 1 ? WIZARD_STEPS[index + 1] : null;
}

export function getPreviousStep(step: WizardStep): WizardStep | null {
  const index = getStepIndex(step);
  return index > 0 ? WIZARD_STEPS[index - 1] : null;
}
