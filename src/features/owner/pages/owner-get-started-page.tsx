"use client";

import { Spinner } from "@/components/ui/spinner";
import { Suspense } from "react";
import { SetupWizard } from "@/features/owner/components/get-started/wizard/setup-wizard";

function WizardFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner className="h-8 w-8 text-muted-foreground" />
    </div>
  );
}

export default function OwnerGetStartedPage() {
  return (
    <Suspense fallback={<WizardFallback />}>
      <SetupWizard />
    </Suspense>
  );
}
