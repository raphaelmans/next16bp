"use client";

import { CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CourtAddonEditor } from "@/features/owner/components/court-addon-editor";
import { CourtScheduleEditor } from "@/features/owner/components/court-schedule-editor";
import type { SetupStatus } from "../../get-started-types";

interface ConfigStepProps {
  status: SetupStatus;
  isTransitioning?: boolean;
  onStepComplete: () => void;
}

export function ConfigStep({ status, onStepComplete }: ConfigStepProps) {
  const courtId = status.readyCourtId ?? status.primaryCourtId;

  if (status.hasCourtSchedule && status.hasCourtPricing) {
    return (
      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="font-medium">Schedule & pricing configured</p>
            <p className="text-sm text-muted-foreground">
              You can edit schedules and pricing from the settings page anytime.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!courtId) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">
            Add a court first to configure schedule and pricing.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <CourtScheduleEditor
        courtId={courtId}
        organizationId={status.organizationId}
        primaryActionLabel="Save Schedule"
        onSaved={onStepComplete}
      />
      <CourtAddonEditor
        courtId={courtId}
        placeId={status.primaryPlaceId}
        organizationId={status.organizationId}
      />
    </div>
  );
}
