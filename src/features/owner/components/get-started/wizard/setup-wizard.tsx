"use client";

import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { trackEvent } from "@/common/clients/telemetry-client";
import { useModOwnerInvalidation } from "@/features/owner/hooks";
import { useModGetStartedSetup } from "../get-started-hooks";
import { SetupErrorBanner } from "../sections/setup-error-banner";
import { CompleteStep } from "./steps/complete-step";
import { ConfigStep } from "./steps/config-step";
import { CourtsStep } from "./steps/courts-step";
import { OrgStep } from "./steps/org-step";
import { PaymentStep } from "./steps/payment-step";
import { VenueStep } from "./steps/venue-step";
import { VerifyStep } from "./steps/verify-step";
import {
  canCompleteWizard,
  deriveFirstIncompleteStep,
  getNextStep,
  getPreviousStep,
  getStepConfig,
} from "./wizard-helpers";
import { useWizardAutoSkip, useWizardStep } from "./wizard-hooks";
import { WizardNavigation } from "./wizard-navigation";
import { WizardProgress } from "./wizard-progress";
import { WizardStepLayout } from "./wizard-step-layout";
import type { WizardStep } from "./wizard-types";

export function SetupWizard() {
  const { status, isLoading, error, refetch, raw } = useModGetStartedSetup();
  const [step, setStep] = useWizardStep();
  const { invalidateOwnerSetupStatus } = useModOwnerInvalidation();
  const [isTransitioning, setIsTransitioning] = useState(false);

  useWizardAutoSkip(status, isLoading, step, setStep);

  const prevStepRef = useRef(step);
  useEffect(() => {
    if (prevStepRef.current !== step) {
      prevStepRef.current = step;
      setIsTransitioning(false);
      trackEvent({
        event: "funnel.owner_wizard_step_viewed",
        properties: { step },
      });
    }
  }, [step]);

  // Guard direct URL access to "complete" when not all steps are done
  useEffect(() => {
    if (step === "complete" && status && !canCompleteWizard(status)) {
      setStep(deriveFirstIncompleteStep(status));
    }
  }, [step, status, setStep]);

  const navigateNext = useCallback(
    (nextStep: WizardStep | null) => {
      if (!nextStep) return;
      if (nextStep === "complete" && status && !canCompleteWizard(status)) {
        setStep(deriveFirstIncompleteStep(status));
        return;
      }
      setStep(nextStep);
    },
    [status, setStep],
  );

  const handleStepComplete = useCallback(async () => {
    setIsTransitioning(true);
    await invalidateOwnerSetupStatus();
    const next = getNextStep(step);
    navigateNext(next);
  }, [invalidateOwnerSetupStatus, step, navigateNext]);

  const handleBack = useCallback(() => {
    const prev = getPreviousStep(step);
    if (prev) setStep(prev);
  }, [step, setStep]);

  const handleSkip = useCallback(() => {
    navigateNext(getNextStep(step));
  }, [step, navigateNext]);

  const handleContinue = useCallback(() => {
    navigateNext(getNextStep(step));
  }, [step, navigateNext]);

  const handleProgressClick = useCallback(
    (targetStep: WizardStep) => {
      setStep(targetStep);
    },
    [setStep],
  );

  if (error && !raw) {
    return (
      <SetupErrorBanner
        error={error}
        isFetching={isLoading}
        onRetry={() => void refetch()}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const config = getStepConfig(step);

  return (
    <div className="flex h-[calc(100svh-4rem-3.5rem-max(0px,env(safe-area-inset-bottom)))] md:h-[calc(100svh-4rem)] flex-col -my-6 -mx-4 sm:-mx-6 lg:-mx-8">
      <WizardProgress
        currentStep={step}
        status={status}
        onStepClick={handleProgressClick}
      />

      <WizardNavigation
        className="md:order-last"
        currentStep={step}
        status={status}
        isTransitioning={isTransitioning}
        onBack={handleBack}
        onSkip={handleSkip}
        onContinue={handleContinue}
      />

      <div className="flex-1 min-h-0 overflow-y-auto">
        <WizardStepLayout title={config.label} description={config.description}>
          <ActiveStep
            step={step}
            status={status}
            isTransitioning={isTransitioning}
            onStepComplete={handleStepComplete}
          />
        </WizardStepLayout>
      </div>
    </div>
  );
}

function ActiveStep({
  step,
  status,
  isTransitioning,
  onStepComplete,
}: {
  step: WizardStep;
  status: ReturnType<typeof useModGetStartedSetup>["status"];
  isTransitioning: boolean;
  onStepComplete: () => void;
}) {
  switch (step) {
    case "org":
      return (
        <OrgStep
          status={status}
          isTransitioning={isTransitioning}
          onStepComplete={onStepComplete}
        />
      );
    case "venue":
      return (
        <VenueStep
          status={status}
          isTransitioning={isTransitioning}
          onStepComplete={onStepComplete}
        />
      );
    case "courts":
      return (
        <CourtsStep
          status={status}
          isTransitioning={isTransitioning}
          onStepComplete={onStepComplete}
        />
      );
    case "config":
      return (
        <ConfigStep
          status={status}
          isTransitioning={isTransitioning}
          onStepComplete={onStepComplete}
        />
      );
    case "payment":
      return (
        <PaymentStep
          status={status}
          isTransitioning={isTransitioning}
          onStepComplete={onStepComplete}
        />
      );
    case "verify":
      return (
        <VerifyStep
          status={status}
          isTransitioning={isTransitioning}
          onStepComplete={onStepComplete}
        />
      );
    case "complete":
      return <CompleteStep status={status} />;
  }
}
