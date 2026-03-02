"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "@/common/toast";
import { getClientErrorMessage } from "@/common/toast/errors";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { deriveOwnerReservationNotificationRoutingState } from "@/features/owner/domain";
import {
  useMutSetMyReservationNotificationPreference,
  useQueryMyReservationNotificationPreference,
  useQueryReservationNotificationRoutingStatus,
} from "@/features/owner/hooks";

export function ReservationNotificationRoutingSettings({
  organizationId,
  sectionId,
  teamAccessHref,
}: {
  organizationId: string;
  sectionId?: string;
  teamAccessHref?: string;
}) {
  const preferenceQuery =
    useQueryMyReservationNotificationPreference(organizationId);
  const routingStatusQuery =
    useQueryReservationNotificationRoutingStatus(organizationId);
  const setPreference =
    useMutSetMyReservationNotificationPreference(organizationId);

  const routingState = deriveOwnerReservationNotificationRoutingState({
    enabled: preferenceQuery.data?.enabled,
    canReceive: preferenceQuery.data?.canReceive,
    enabledRecipientCount: routingStatusQuery.data?.enabledRecipientCount,
    isPreferenceLoading: preferenceQuery.isLoading,
    isRoutingStatusLoading: routingStatusQuery.isLoading,
    isSavingPreference: setPreference.isPending,
  });

  const onCheckedChange = async (checked: boolean) => {
    try {
      await setPreference.mutateAsync({
        organizationId,
        enabled: checked,
      });
      toast.success(
        checked
          ? "Reservation notifications enabled"
          : "Reservation notifications disabled",
      );
    } catch (error) {
      toast.error("Failed to update notification preference", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    }
  };

  return (
    <Card id={sectionId}>
      <CardHeader>
        <CardTitle>Reservation Notification Routing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <Label htmlFor="reservation-notification-toggle">
              Receive venue reservation lifecycle notifications
            </Label>
            <p className="text-xs text-muted-foreground">
              Applies to inbox, web push, mobile push, email, and SMS.
            </p>
          </div>
          <Switch
            id="reservation-notification-toggle"
            checked={routingState.enabled}
            disabled={routingState.busy || !routingState.canReceive}
            onCheckedChange={onCheckedChange}
            aria-label="Toggle reservation notification routing"
          />
        </div>

        <div className="text-sm text-muted-foreground">
          Enabled recipients:{" "}
          <span className="text-foreground">
            {routingState.enabledRecipientCount}
          </span>
        </div>

        {routingState.showPermissionHint ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              You need <code>reservation.notification.receive</code> permission
              to enable routing for your account.
            </p>
            {teamAccessHref ? (
              <Button asChild size="sm" variant="outline">
                <Link href={teamAccessHref}>Open Team &amp; Access</Link>
              </Button>
            ) : null}
          </div>
        ) : null}

        {routingState.showMutedWarning ? (
          <p className="text-xs text-warning">
            No recipients are currently enabled. Venue reservation notifications
            are muted until at least one eligible member opts in.
          </p>
        ) : null}

        {routingState.busy ? (
          <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3 animate-spin" />
            Syncing notification routing status...
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
