"use client";

import { Building2, CheckCircle2, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { OrganizationForm } from "@/features/organization/components/organization-form";
import type { SetupStatus } from "../../get-started-types";

interface OrgStepProps {
  status: SetupStatus;
  isTransitioning?: boolean;
  onStepComplete: () => void;
}

export function OrgStep({
  status,
  isTransitioning,
  onStepComplete,
}: OrgStepProps) {
  if (status.hasOrganization && status.organization) {
    return (
      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="font-medium">{status.organization.name}</p>
            <p className="text-sm text-muted-foreground">
              Organization created
            </p>
          </div>
          <CheckCircle2 className="h-5 w-5 text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (isTransitioning) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Setting up...</span>
      </div>
    );
  }

  return <OrganizationForm onSuccess={() => onStepComplete()} />;
}
