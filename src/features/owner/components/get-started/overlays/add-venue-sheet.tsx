"use client";

import { toast } from "@/common/toast";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PlaceForm } from "@/features/owner/components";
import { useModPlaceForm } from "@/features/owner/hooks";

interface AddVenueSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId?: string;
  onSuccess: () => void;
}

export function AddVenueSheet({
  open,
  onOpenChange,
  organizationId,
  onSuccess,
}: AddVenueSheetProps) {
  const { submitAsync, isSubmitting } = useModPlaceForm({
    organizationId,
    onSuccess: () => {
      toast.success("Venue created successfully!");
      onSuccess();
    },
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto sm:max-w-2xl"
      >
        <SheetHeader>
          <SheetTitle>Add new venue</SheetTitle>
          <SheetDescription>
            Create a new venue listing with name, address, and contact info.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          <PlaceForm
            onSubmit={submitAsync}
            onCancel={() => onOpenChange(false)}
            isSubmitting={isSubmitting}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
