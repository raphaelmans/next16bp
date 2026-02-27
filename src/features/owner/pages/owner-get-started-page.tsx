"use client";

import { Loader2 } from "lucide-react";
import { Suspense } from "react";
import { SetupWizard } from "@/features/owner/components/get-started/wizard/setup-wizard";
import { PermissionGate } from "@/features/owner/components/permission-gate";

function WizardFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function OwnerGetStartedPage() {
  return (
    <PermissionGate accessRule={{ type: "owner-only" }}>
      <Suspense fallback={<WizardFallback />}>
        <SetupWizard />
      </Suspense>
    </PermissionGate>
  );
}
