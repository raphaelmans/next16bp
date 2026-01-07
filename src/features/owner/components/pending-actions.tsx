"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface PendingActionsProps {
  pendingCount: number;
}

export function PendingActions({ pendingCount }: PendingActionsProps) {
  if (pendingCount === 0) {
    return null;
  }

  return (
    <Alert className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/50">
      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
      <AlertTitle className="text-amber-800 dark:text-amber-200">
        Action Required
      </AlertTitle>
      <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-amber-700 dark:text-amber-300">
          {pendingCount} booking{pendingCount !== 1 ? "s" : ""} awaiting
          confirmation
        </span>
        <Button
          asChild
          size="sm"
          className="bg-amber-600 hover:bg-amber-700 text-white w-fit"
        >
          <Link href="/owner/reservations?status=pending">Review Now</Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
