"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CourtScheduleAndAddonsEditor } from "@/features/owner/components/court-schedule-and-addons-editor";
import { useQueryOwnerCourtsByPlace } from "@/features/owner/hooks";

interface EditSchedulePricingSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courtId?: string;
  placeId?: string;
  organizationId?: string;
  onSuccess: () => void;
}

export function EditSchedulePricingSheet({
  open,
  onOpenChange,
  courtId,
  placeId,
  organizationId,
  onSuccess,
}: EditSchedulePricingSheetProps) {
  const [selectedCourtId, setSelectedCourtId] = useState(courtId);

  // Sync when prop changes (e.g. sheet reopened with a different court)
  useEffect(() => {
    if (courtId) setSelectedCourtId(courtId);
  }, [courtId]);

  const { data: courts = [] } = useQueryOwnerCourtsByPlace(placeId ?? "");
  const showCourtSelector = courts.length > 1;

  if (!selectedCourtId) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto sm:max-w-2xl"
      >
        <SheetHeader>
          <SheetTitle>Schedule & Pricing</SheetTitle>
          <SheetDescription>
            Configure court hours, pricing rules, and add-ons.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          {showCourtSelector && (
            <Select value={selectedCourtId} onValueChange={setSelectedCourtId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a court" />
              </SelectTrigger>
              <SelectContent>
                {courts.map((court) => (
                  <SelectItem key={court.id} value={court.id}>
                    {court.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <CourtScheduleAndAddonsEditor
            courtId={selectedCourtId}
            placeId={placeId}
            organizationId={organizationId}
            onSaved={onSuccess}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
