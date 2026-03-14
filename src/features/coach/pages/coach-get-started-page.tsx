import { Suspense } from "react";
import { Spinner } from "@/components/ui/spinner";
import { CoachSetupWizard } from "../components/get-started/wizard/coach-setup-wizard";

function WizardFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner className="h-8 w-8 text-muted-foreground" />
    </div>
  );
}

export default function CoachGetStartedPage() {
  return (
    <Suspense fallback={<WizardFallback />}>
      <CoachSetupWizard />
    </Suspense>
  );
}
