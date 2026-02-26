"use client";

import { CheckCircle2, Clock } from "lucide-react";
import { toast } from "@/common/toast";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CourtForm } from "@/features/owner/components";
import {
  useModCourtForm,
  useQueryOwnerPlaces,
  useQueryOwnerSports,
} from "@/features/owner/hooks";
import type { SetupStatus } from "../../get-started-types";

interface CourtsStepProps {
  status: SetupStatus;
  onStepComplete: () => void;
}

export function CourtsStep({ status, onStepComplete }: CourtsStepProps) {
  const { data: places = [], isLoading: placesLoading } = useQueryOwnerPlaces(
    status.organizationId ?? null,
  );
  const { data: sports = [], isLoading: sportsLoading } = useQueryOwnerSports();

  const { submitAsync, isSubmitting } = useModCourtForm({
    onSuccess: () => {
      toast.success("Court created successfully!");
      onStepComplete();
    },
  });

  if (status.hasPendingClaim && !status.hasVenue) {
    return (
      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
            <Clock className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="font-medium">Waiting for claim approval</p>
            <p className="text-sm text-muted-foreground">
              Courts can be added after your venue claim is approved. You can
              skip ahead and come back later.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status.hasActiveCourt) {
    return (
      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="font-medium">Court added</p>
            <p className="text-sm text-muted-foreground">
              You can manage additional courts from your settings page after
              setup.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isDataLoading = placesLoading || sportsLoading;

  if (isDataLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  const placeOptions = places.map((p) => ({
    id: p.id,
    name: p.name,
    city: p.city,
  }));
  const sportOptions = sports.map((s) => ({ id: s.id, name: s.name }));

  return (
    <CourtForm
      placeOptions={placeOptions}
      sportOptions={sportOptions}
      onSubmit={submitAsync}
      onCancel={() => {}}
      isSubmitting={isSubmitting}
      disablePlaceSelect={!!status.primaryPlaceId}
      defaultValues={
        status.primaryPlaceId ? { placeId: status.primaryPlaceId } : undefined
      }
      showCancel={false}
      primaryActionLabel="Create Court"
    />
  );
}
