"use client";

import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useEffect, useRef } from "react";
import type { SetupStatus } from "../get-started-types";
import { deriveFirstIncompleteStep } from "./wizard-helpers";
import { WIZARD_STEPS, type WizardStep } from "./wizard-types";

export function useWizardStep() {
  return useQueryState(
    "step",
    parseAsStringLiteral(WIZARD_STEPS)
      .withDefault("org")
      .withOptions({ history: "push" }),
  );
}

export function useWizardAutoSkip(
  status: SetupStatus,
  isLoading: boolean,
  step: WizardStep,
  setStep: (step: WizardStep) => void,
) {
  const hasFired = useRef(false);

  useEffect(() => {
    if (hasFired.current) return;
    if (isLoading) return;
    if (step !== "org") return;

    hasFired.current = true;
    const target = deriveFirstIncompleteStep(status);
    if (target !== "org") {
      setStep(target);
    }
  }, [status, isLoading, step, setStep]);
}
