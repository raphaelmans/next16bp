"use client";

import * as React from "react";
import type { UseFormReturn } from "react-hook-form";
import {
  StandardFormInput,
  StandardFormProvider,
  StandardFormSelect,
  StandardFormTextarea,
} from "@/components/form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useBookingStudio } from "./booking-studio-provider";
import type { CustomBlockFormValues } from "./types";
import { blockTypeOptions } from "./types";

export const CustomBlockDialog = React.memo(function CustomBlockDialog({
  customForm,
  handleCustomSubmit,
  isCreatingBlock,
  placeTimeZone,
}: {
  customForm: UseFormReturn<CustomBlockFormValues>;
  handleCustomSubmit: (values: CustomBlockFormValues) => Promise<void>;
  isCreatingBlock: boolean;
  placeTimeZone: string;
}) {
  const customDialogOpen = useBookingStudio((s) => s.customDialogOpen);
  const setCustomDialogOpen = useBookingStudio((s) => s.setCustomDialogOpen);

  return (
    <Dialog open={customDialogOpen} onOpenChange={setCustomDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create custom block</DialogTitle>
          <DialogDescription>
            Times are shown in {placeTimeZone}. Blocks must align to full hours.
          </DialogDescription>
        </DialogHeader>
        <StandardFormProvider form={customForm} onSubmit={handleCustomSubmit}>
          <StandardFormSelect<CustomBlockFormValues>
            name="blockType"
            label="Block type"
            options={blockTypeOptions.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
            required
          />
          <StandardFormInput<CustomBlockFormValues>
            name="startTime"
            label="Start time"
            type="datetime-local"
            required
          />
          <StandardFormInput<CustomBlockFormValues>
            name="endTime"
            label="End time"
            type="datetime-local"
            required
          />
          <StandardFormTextarea<CustomBlockFormValues>
            name="reason"
            label="Reason (optional)"
            placeholder="Net replacement"
          />
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setCustomDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreatingBlock}>
              {isCreatingBlock ? "Creating..." : "Create block"}
            </Button>
          </DialogFooter>
        </StandardFormProvider>
      </DialogContent>
    </Dialog>
  );
});
