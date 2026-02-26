"use client";

import { Building2, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { OrganizationForm } from "@/features/organization/components/organization-form";
import type { SetupStatus } from "../../get-started-types";

interface OrgStepProps {
  status: SetupStatus;
  onStepComplete: () => void;
}

export function OrgStep({ status, onStepComplete }: OrgStepProps) {
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

  return <OrganizationForm onSuccess={() => onStepComplete()} />;
}
