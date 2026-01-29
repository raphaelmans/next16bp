"use client";

import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { useBookingStudio } from "./booking-studio-provider";

export const RemoveBlockDialog = React.memo(function RemoveBlockDialog({
  confirmRemoveBlock,
}: {
  confirmRemoveBlock: () => void;
}) {
  const pendingRemoveBlockId = useBookingStudio((s) => s.pendingRemoveBlockId);
  const setPendingRemoveBlockId = useBookingStudio(
    (s) => s.setPendingRemoveBlockId,
  );

  return (
    <AlertDialog
      open={pendingRemoveBlockId !== null}
      onOpenChange={(open) => {
        if (!open) setPendingRemoveBlockId(null);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove block</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently remove the block from the schedule.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmRemoveBlock}
            className={buttonVariants({ variant: "destructive" })}
          >
            Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
});
