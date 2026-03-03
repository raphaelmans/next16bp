"use client";

import { ArrowLeft, ArrowRight, Plus, SkipForward } from "lucide-react";
import Link from "next/link";
import { appRoutes } from "@/common/app-routes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SetupStatus } from "../get-started-types";
import {
  canCompleteWizard,
  getNextStep,
  getStepConfig,
  isStepComplete,
} from "./wizard-helpers";
import type { WizardStep } from "./wizard-types";

interface WizardNavigationProps {
  currentStep: WizardStep;
  status: SetupStatus;
  onBack: () => void;
  onSkip: () => void;
  onContinue: () => void;
  className?: string;
}

export function WizardNavigation({
  currentStep,
  status,
  onBack,
  onSkip,
  onContinue,
  className,
}: WizardNavigationProps) {
  if (currentStep === "complete") return null;

  const config = getStepConfig(currentStep);
  const complete = isStepComplete(currentStep, status);
  const nextStep = getNextStep(currentStep);
  const nextIsComplete = nextStep === "complete";
  const showBack = currentStep !== "org";
  const showSkip =
    config.skippable &&
    !complete &&
    !(nextIsComplete && !canCompleteWizard(status));
  const showContinue = complete;
  const showPendingCta =
    currentStep === "verify" &&
    status.verificationStatus === "PENDING" &&
    status.primaryPlaceId;

  return (
    <div
      className={cn(
        "shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:border-b-0 md:border-t",
        className,
      )}
    >
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-4 py-3 sm:gap-3">
        <div>
          {showBack && (
            <Button
              variant="ghost"
              className="min-h-[44px] cursor-pointer px-4 text-muted-foreground hover:bg-muted/80 hover:text-foreground sm:min-h-9 sm:px-3"
              onClick={onBack}
            >
              <ArrowLeft className="mr-2 h-5 w-5 sm:h-4 sm:w-4" />
              <span className="font-medium">Back</span>
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2 sm:gap-2">
          {showSkip && (
            <Button
              variant="ghost"
              className="min-h-[44px] cursor-pointer px-4 text-muted-foreground hover:text-foreground sm:min-h-9 sm:px-3"
              onClick={onSkip}
            >
              Skip
              <SkipForward className="ml-2 h-4 w-4" />
            </Button>
          )}
          {showContinue && (
            <Button
              className="min-h-[44px] cursor-pointer px-6 text-base font-semibold sm:min-h-9 sm:px-5 sm:text-sm"
              onClick={onContinue}
            >
              Continue
              <ArrowRight className="ml-2 h-5 w-5 sm:h-4 sm:w-4" />
            </Button>
          )}
          {showPendingCta && !showContinue && (
            <Button
              asChild
              className="min-h-[44px] cursor-pointer px-6 text-base font-semibold sm:min-h-9 sm:px-5 sm:text-sm"
            >
              <Link
                href={`${appRoutes.organization.places.courts.base(status.primaryPlaceId!)}?from=setup`}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add more courts
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
