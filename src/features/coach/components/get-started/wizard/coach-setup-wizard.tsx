"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { buildEmptyCoachSetupStatus } from "@/lib/modules/coach-setup/shared";
import { cn } from "@/lib/utils";
import { useModCoachGetStartedSetup } from "../get-started-hooks";
import { CompleteStep } from "./steps/complete-step";
import { LocationStep } from "./steps/location-step";
import { PaymentStep } from "./steps/payment-step";
import { PricingStep } from "./steps/pricing-step";
import { ProfileStep } from "./steps/profile-step";
import { ScheduleStep } from "./steps/schedule-step";
import { SportsStep } from "./steps/sports-step";
import { VerifyStep } from "./steps/verify-step";
import {
  countCompletedCoachSteps,
  deriveFirstIncompleteCoachStep,
  getCoachStepConfig,
  isCoachStepComplete,
} from "./wizard-helpers";
import { COACH_WIZARD_STEPS, type CoachWizardStep } from "./wizard-types";

export function CoachSetupWizard() {
  const { status, isLoading, error, refetch } = useModCoachGetStartedSetup();
  const [activeStep, setActiveStep] = useState<CoachWizardStep>(
    deriveFirstIncompleteCoachStep(buildEmptyCoachSetupStatus()),
  );

  useEffect(() => {
    setActiveStep(deriveFirstIncompleteCoachStep(status));
  }, [status]);

  const completedCount = useMemo(
    () => countCompletedCoachSteps(status),
    [status],
  );

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="h-8 w-8 text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Could not load coach setup</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>{error.message}</p>
          <Button variant="outline" onClick={() => void refetch()}>
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <Badge variant="secondary">Coach onboarding</Badge>
            <h2 className="font-heading text-3xl font-semibold text-foreground">
              Coach setup wizard
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Complete the setup contract coaches need before launching:
              profile, booking readiness, payment instructions, and verification
              approval.
            </p>
          </div>
          <div className="rounded-2xl border bg-muted/40 px-4 py-3 text-sm">
            <p className="font-medium text-foreground">
              {completedCount} of 7 required steps complete
            </p>
            <p className="text-muted-foreground">
              Next recommended step: {getCoachStepConfig(status.nextStep).label}
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="rounded-2xl border bg-card p-3 shadow-sm">
          <ol className="space-y-2" aria-label="Coach setup steps">
            {COACH_WIZARD_STEPS.map((step) => {
              const config = getCoachStepConfig(step);
              const isComplete = isCoachStepComplete(status, step);
              const isCurrent = activeStep === step;
              const isRecommended = status.nextStep === step;

              return (
                <li key={step}>
                  <button
                    type="button"
                    onClick={() => setActiveStep(step)}
                    className={cn(
                      "w-full rounded-xl border px-4 py-3 text-left transition-colors",
                      isCurrent
                        ? "border-primary/30 bg-primary/10"
                        : "border-border hover:border-primary/20 hover:bg-accent/40",
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-foreground">
                        {config.label}
                      </span>
                      {isComplete ? (
                        <Badge variant="success">Done</Badge>
                      ) : isRecommended ? (
                        <Badge>Next</Badge>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {config.description}
                    </p>
                  </button>
                </li>
              );
            })}
          </ol>
        </aside>

        <div>{renderActiveStep(activeStep, status)}</div>
      </div>
    </div>
  );
}

function renderActiveStep(
  step: CoachWizardStep,
  status: ReturnType<typeof useModCoachGetStartedSetup>["status"],
) {
  switch (step) {
    case "profile":
      return <ProfileStep isComplete={status.hasCoachProfile} />;
    case "sports":
      return (
        <SportsStep
          isComplete={status.hasCoachSports}
          coachId={status.coachId}
        />
      );
    case "location":
      return <LocationStep isComplete={status.hasCoachLocation} />;
    case "schedule":
      return (
        <ScheduleStep
          isComplete={status.hasCoachSchedule}
          coachId={status.coachId}
        />
      );
    case "pricing":
      return (
        <PricingStep
          isComplete={status.hasCoachPricing}
          coachId={status.coachId}
        />
      );
    case "payment":
      return (
        <PaymentStep
          isComplete={status.hasPaymentMethod}
          coachId={status.coachId}
        />
      );
    case "verify":
      return <VerifyStep status={status} />;
    case "complete":
      return <CompleteStep isReady={status.isSetupComplete} />;
  }
}
