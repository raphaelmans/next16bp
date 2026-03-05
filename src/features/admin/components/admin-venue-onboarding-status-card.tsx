"use client";

import { Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQueryAdminCourtOnboardingStatus } from "@/features/admin/hooks";

type AdminVenueOnboardingStatusCardProps = {
  placeId: string;
  placeIsActive: boolean;
  courtLabels: Array<{ courtId: string; label: string }>;
};

const verificationBadge = (
  status: string,
): {
  variant: "default" | "secondary" | "destructive" | "outline";
  label: string;
} => {
  switch (status) {
    case "VERIFIED":
      return { variant: "default", label: "Verified" };
    case "PENDING":
      return { variant: "outline", label: "Pending" };
    case "REJECTED":
      return { variant: "destructive", label: "Rejected" };
    default:
      return { variant: "secondary", label: "Unverified" };
  }
};

function StatusIcon({ ok }: { ok: boolean }) {
  return ok ? (
    <Check className="h-4 w-4 text-primary" />
  ) : (
    <X className="h-4 w-4 text-muted-foreground" />
  );
}

export function AdminVenueOnboardingStatusCard({
  placeId,
  placeIsActive,
  courtLabels,
}: AdminVenueOnboardingStatusCardProps) {
  const { data: status, isLoading } =
    useQueryAdminCourtOnboardingStatus(placeId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Onboarding Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <Spinner className="size-5" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!status) return null;

  const vBadge = verificationBadge(status.verificationStatus);
  const courtLabelMap = new Map(courtLabels.map((c) => [c.courtId, c.label]));

  const missingItems: string[] = [];
  if (!status.isVerified) missingItems.push("verification");
  if (!status.hasActiveCourt) missingItems.push("active courts");
  if (!status.hasAnyCourtSchedule) missingItems.push("court schedule");
  if (!status.hasAnyCourtPricing) missingItems.push("court pricing");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Onboarding Status</CardTitle>
        <CardDescription>
          Owner setup progress and per-court configuration readiness.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant={placeIsActive ? "default" : "secondary"}>
            {placeIsActive ? "Active" : "Inactive"}
          </Badge>
          <Badge variant={vBadge.variant}>{vBadge.label}</Badge>
          {status.isVenueConfigured ? (
            <Badge variant="default">Venue Configured</Badge>
          ) : (
            <Badge variant="secondary">Not Configured</Badge>
          )}
        </div>

        {missingItems.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Missing: {missingItems.join(", ")}
          </p>
        )}

        {status.courts.length > 0 && (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Court</TableHead>
                  <TableHead className="w-20 text-center">Active</TableHead>
                  <TableHead className="w-20 text-center">Schedule</TableHead>
                  <TableHead className="w-20 text-center">Pricing</TableHead>
                  <TableHead className="w-20 text-center">Ready</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {status.courts.map((court) => (
                  <TableRow key={court.courtId}>
                    <TableCell className="font-medium">
                      {courtLabelMap.get(court.courtId) ??
                        court.courtId.slice(0, 8)}
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusIcon ok={court.isActive} />
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusIcon ok={court.hasSchedule} />
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusIcon ok={court.hasPricing} />
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusIcon ok={court.isReady} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {status.courts.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No court units configured for this venue.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
