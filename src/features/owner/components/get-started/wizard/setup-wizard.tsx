"use client";

import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
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
import { getNextStep, getPreviousStep, getStepConfig } from "./wizard-helpers";
import { useWizardAutoSkip, useWizardStep } from "./wizard-hooks";
import { WizardNavigation } from "./wizard-navigation";
import { WizardProgress } from "./wizard-progress";
import { WizardStepLayout } from "./wizard-step-layout";
import type { WizardStep } from "./wizard-types";

export function SetupWizard() {
  const { status, isLoading, error, refetch, raw } = useModGetStartedSetup();
  const [step, setStep] = useWizardStep();
  const { invalidateOwnerSetupStatus } = useModOwnerInvalidation();

  useWizardAutoSkip(status, isLoading, step, setStep);

  const prevStepRef = useRef(step);
  useEffect(() => {
    if (prevStepRef.current !== step) {
      prevStepRef.current = step;
      trackEvent({
        event: "funnel.owner_wizard_step_viewed",
        properties: { step },
      });
    }
  }, [step]);

  const handleStepComplete = useCallback(async () => {
    await invalidateOwnerSetupStatus();
    const next = getNextStep(step);
    if (next) setStep(next);
  }, [invalidateOwnerSetupStatus, step, setStep]);

  const handleBack = useCallback(() => {
    const prev = getPreviousStep(step);
    if (prev) setStep(prev);
  }, [step, setStep]);

  const handleSkip = useCallback(() => {
    const next = getNextStep(step);
    if (next) setStep(next);
  }, [step, setStep]);

  const handleContinue = useCallback(() => {
    const next = getNextStep(step);
    if (next) setStep(next);
  }, [step, setStep]);

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
    <div className="flex min-h-dvh flex-col">
      <WizardProgress
        currentStep={step}
        status={status}
        onStepClick={handleProgressClick}
      />

      <div className="flex-1">
        <WizardStepLayout title={config.label} description={config.description}>
          <ActiveStep
            step={step}
            status={status}
            onStepComplete={handleStepComplete}
          />
        </WizardStepLayout>
      </div>

      <WizardNavigation
        currentStep={step}
        status={status}
        onBack={handleBack}
        onSkip={handleSkip}
        onContinue={handleContinue}
      />
    </div>
  );
}

function ActiveStep({
  step,
  status,
  onStepComplete,
}: {
  step: WizardStep;
  status: ReturnType<typeof useModGetStartedSetup>["status"];
  onStepComplete: () => void;
}) {
  switch (step) {
    case "org":
      return <OrgStep status={status} onStepComplete={onStepComplete} />;
    case "venue":
      return <VenueStep status={status} onStepComplete={onStepComplete} />;
    case "courts":
      return <CourtsStep status={status} onStepComplete={onStepComplete} />;
    case "config":
      return <ConfigStep status={status} onStepComplete={onStepComplete} />;
    case "payment":
      return <PaymentStep status={status} onStepComplete={onStepComplete} />;
    case "verify":
      return <VerifyStep status={status} onStepComplete={onStepComplete} />;
    case "complete":
      return <CompleteStep status={status} />;
  }
}
