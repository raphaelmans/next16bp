"use client";

import { toast } from "@/common/toast";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { CourtForm } from "@/features/owner/components";
import {
  useModCourtForm,
  useQueryOwnerPlaces,
  useQueryOwnerSports,
} from "@/features/owner/hooks";

interface ConfigureCourtsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId?: string;
  placeId?: string;
  onSuccess: () => void;
}

export function ConfigureCourtsSheet({
  open,
  onOpenChange,
  organizationId,
  placeId,
  onSuccess,
}: ConfigureCourtsSheetProps) {
  const { data: places = [], isLoading: placesLoading } = useQueryOwnerPlaces(
    organizationId ?? null,
  );
  const { data: sports = [], isLoading: sportsLoading } = useQueryOwnerSports(
    undefined,
    { enabled: open },
  );

  const placeOptions = places.map((p) => ({
    id: p.id,
    name: p.name,
    city: p.city,
  }));
  const sportOptions = sports.map((s) => ({ id: s.id, name: s.name }));

  const { submitAsync, isSubmitting } = useModCourtForm({
    onSuccess: () => {
      toast.success("Court created successfully!");
      onSuccess();
    },
  });

  const isDataLoading = placesLoading || sportsLoading;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Configure courts</SheetTitle>
          <SheetDescription>
            Add a court with sport type and schedule details.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          {isDataLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <CourtForm
              placeOptions={placeOptions}
              sportOptions={sportOptions}
              onSubmit={submitAsync}
              onCancel={() => onOpenChange(false)}
              isSubmitting={isSubmitting}
              disablePlaceSelect={!!placeId}
              defaultValues={placeId ? { placeId } : undefined}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
