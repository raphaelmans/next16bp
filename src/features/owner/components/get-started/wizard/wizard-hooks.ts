"use client";

import { useEffect, useRef, useState } from "react";
import type { SetupStatus } from "../get-started-types";
import { deriveFirstIncompleteStep } from "./wizard-helpers";
import type { WizardStep } from "./wizard-types";

export function useWizardStep() {
  return useState<WizardStep>("org");
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
