"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SetupStatus } from "../get-started-types";
import { isStepComplete } from "./wizard-helpers";
import { STEP_CONFIGS, type WizardStep } from "./wizard-types";

interface WizardProgressProps {
  currentStep: WizardStep;
  status: SetupStatus;
  onStepClick: (step: WizardStep) => void;
}

export function WizardProgress({
  currentStep,
  status,
  onStepClick,
}: WizardProgressProps) {
  const displaySteps = STEP_CONFIGS.filter((c) => c.key !== "complete");
  const currentStepIndex = displaySteps.findIndex((c) => c.key === currentStep);

  return (
    <div className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto max-w-2xl px-4 py-3">
        <div className="text-center text-xs font-medium text-muted-foreground">
          Step {currentStepIndex + 1} of {displaySteps.length}
        </div>
        <div className="mt-2 flex items-center justify-center gap-3 sm:gap-4">
          {displaySteps.map((config) => {
            const complete = isStepComplete(config.key, status);
            const isCurrent = config.key === currentStep;
            const isPast = complete && !isCurrent;

            return (
              <button
                key={config.key}
                type="button"
                onClick={() => onStepClick(config.key)}
                className={cn(
                  "flex h-11 w-11 min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-full transition-colors sm:h-10 sm:w-10 sm:min-h-10 sm:min-w-10",
                  isCurrent && "bg-primary/10",
                )}
              >
                <div
                  className={cn(
                    "flex items-center justify-center rounded-full transition-all",
                    (isPast || isCurrent) &&
                      "bg-primary text-primary-foreground",
                    isPast && "h-4 w-4",
                    isCurrent && "h-5 w-5 ring-2 ring-primary ring-offset-2",
                    !isPast && !isCurrent && "h-3 w-3 bg-muted-foreground/30",
                  )}
                >
                  {isPast && <Check className="h-3 w-3" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
