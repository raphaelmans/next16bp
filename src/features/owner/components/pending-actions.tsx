"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { appRoutes } from "@/common/app-routes";
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
    <Alert className="border-warning bg-warning/10">
      <AlertTriangle className="h-4 w-4 text-warning-foreground" />
      <AlertTitle className="text-warning-foreground">
        Action Required
      </AlertTitle>
      <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-warning-foreground">
          {pendingCount} booking{pendingCount !== 1 ? "s" : ""} awaiting
          confirmation
        </span>
        <Button
          asChild
          size="sm"
          className="bg-warning hover:bg-warning/90 text-white w-fit"
        >
          <Link href={`${appRoutes.organization.reservations}?status=pending`}>
            Review Now
          </Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
