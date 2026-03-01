"use client";

import { ArrowRight, FileSpreadsheet, PartyPopper } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { appRoutes } from "@/common/app-routes";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { SetupStatus } from "../../get-started-types";
import { ImportBookingsSheet } from "../../overlays/import-bookings-sheet";

interface CompleteStepProps {
  status: SetupStatus;
}

export function CompleteStep({ status }: CompleteStepProps) {
  const [importOpen, setImportOpen] = useState(false);

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <PartyPopper className="h-8 w-8" />
          </div>
          <h3 className="mt-4 text-xl font-heading font-semibold">
            You&apos;re all set!
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Your venue setup is complete. You can now start accepting bookings
            on KudosCourts.
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        {status.organizationId && (
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Import Bookings
          </Button>
        )}
        <Button asChild>
          <Link href={appRoutes.organization.bookings}>
            Go to Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {status.organizationId && (
        <ImportBookingsSheet
          open={importOpen}
          onOpenChange={setImportOpen}
          organizationId={status.organizationId}
          onSuccess={() => setImportOpen(false)}
        />
      )}
    </div>
  );
}
