"use client";

import * as React from "react";
import { toast } from "sonner";
import { appRoutes } from "@/common/app-routes";
import { getClientErrorMessage } from "@/common/hooks/toast-errors";
import { AppShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { Textarea } from "@/components/ui/textarea";
import { AdminNavbar, AdminSidebar } from "@/features/admin";
import { useAdminSidebarStats } from "@/features/admin/hooks";
import { useLogout, useSession } from "@/features/auth";
import { WebPushSettingsCard } from "@/features/notifications/components/web-push-settings";
import { trpc } from "@/trpc/client";

type ReviewedKind = "place_verification" | "claim_request";
type ReviewedStatus = "APPROVED" | "REJECTED";

export default function AdminNotificationTestPage() {
  const { data: user } = useSession();
  const logoutMutation = useLogout();
  const { data: stats } = useAdminSidebarStats();

  const dispatchMutation =
    trpc.admin.notificationDelivery.dispatchNow.useMutation();
  const reservationMutation =
    trpc.admin.notificationDelivery.enqueueReservationCreatedTest.useMutation();
  const verificationReviewedMutation =
    trpc.admin.notificationDelivery.enqueuePlaceVerificationReviewedTest.useMutation();
  const claimReviewedMutation =
    trpc.admin.notificationDelivery.enqueueClaimReviewedTest.useMutation();
  const webPushSubscriptionsQuery =
    trpc.admin.notificationDelivery.listMyWebPushSubscriptions.useQuery();
  const webPushTestMutation =
    trpc.admin.notificationDelivery.enqueueWebPushTest.useMutation();

  const [dispatchConfirm, setDispatchConfirm] = React.useState(false);

  const [targetEmail, setTargetEmail] = React.useState("");
  const [targetPhone, setTargetPhone] = React.useState("");

  const [reservationPlaceName, setReservationPlaceName] =
    React.useState("Test Venue");
  const [reservationCourtLabel, setReservationCourtLabel] =
    React.useState("Court 1");
  const [reservationStartTimeIso, setReservationStartTimeIso] = React.useState(
    new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  );
  const [reservationEndTimeIso, setReservationEndTimeIso] = React.useState(
    new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
  );
  const [reservationTotalPriceCents, setReservationTotalPriceCents] =
    React.useState("50000");
  const [reservationCurrency, setReservationCurrency] = React.useState("PHP");
  const [reservationPlayerName, setReservationPlayerName] =
    React.useState("Test Player");
  const [reservationPlayerEmail, setReservationPlayerEmail] =
    React.useState("");
  const [reservationPlayerPhone, setReservationPlayerPhone] =
    React.useState("");
  const [reservationExpiresAtIso, setReservationExpiresAtIso] =
    React.useState("");

  const [reviewedKind, setReviewedKind] =
    React.useState<ReviewedKind>("place_verification");
  const [reviewedStatus, setReviewedStatus] =
    React.useState<ReviewedStatus>("APPROVED");
  const [reviewedPlaceName, setReviewedPlaceName] =
    React.useState("Test Venue");
  const [reviewedNotes, setReviewedNotes] = React.useState("");

  const [webPushSubscriptionId, setWebPushSubscriptionId] = React.useState("");
  const [webPushTitle, setWebPushTitle] = React.useState("Test notification");
  const [webPushBody, setWebPushBody] = React.useState(
    "This is a Web Push test",
  );
  const [webPushUrl, setWebPushUrl] = React.useState(appRoutes.admin.base);
  const [webPushTag, setWebPushTag] = React.useState("test.web_push");

  const webPushSubscriptions =
    webPushSubscriptionsQuery.data?.subscriptions ?? [];

  React.useEffect(() => {
    if (!webPushSubscriptionId && webPushSubscriptions.length > 0) {
      setWebPushSubscriptionId(webPushSubscriptions[0].id);
    }
  }, [webPushSubscriptionId, webPushSubscriptions]);

  const goBack = () => {
    window.location.assign(appRoutes.admin.base);
  };

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = appRoutes.login.from(appRoutes.admin.base);
  };

  const handleDispatch = async () => {
    try {
      const result = await dispatchMutation.mutateAsync({ confirm: true });
      if (!result.ok) {
        toast.error("Dispatch failed", {
          description: `status: ${result.status}`,
        });
        return;
      }
      toast.success("Dispatch complete", {
        description: `status: ${result.status}`,
      });
    } catch (error) {
      toast.error("Dispatch failed", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    }
  };

  const handleEnqueueReservation = async () => {
    try {
      const result = await reservationMutation.mutateAsync({
        email: targetEmail,
        phoneNumber: targetPhone,
        placeName: reservationPlaceName,
        courtLabel: reservationCourtLabel,
        startTimeIso: reservationStartTimeIso,
        endTimeIso: reservationEndTimeIso,
        totalPriceCents: reservationTotalPriceCents,
        currency: reservationCurrency,
        playerName: reservationPlayerName,
        playerEmail: reservationPlayerEmail,
        playerPhone: reservationPlayerPhone,
        expiresAtIso: reservationExpiresAtIso,
      });
      toast.success("Enqueued test jobs", {
        description: `jobCount: ${result.jobCount}`,
      });
    } catch (error) {
      toast.error("Failed to enqueue", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    }
  };

  const handleEnqueueReviewed = async () => {
    try {
      const mutation =
        reviewedKind === "place_verification"
          ? verificationReviewedMutation
          : claimReviewedMutation;
      const result = await mutation.mutateAsync({
        email: targetEmail,
        phoneNumber: targetPhone,
        status: reviewedStatus,
        placeName: reviewedPlaceName,
        reviewNotes: reviewedNotes,
      });
      toast.success("Enqueued test jobs", {
        description: `jobCount: ${result.jobCount}`,
      });
    } catch (error) {
      toast.error("Failed to enqueue", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    }
  };

  const handleEnqueueWebPush = async () => {
    if (!webPushSubscriptionId) {
      toast.error("Select a Web Push subscription first");
      return;
    }

    try {
      const result = await webPushTestMutation.mutateAsync({
        subscriptionId: webPushSubscriptionId,
        title: webPushTitle,
        body: webPushBody,
        url: webPushUrl,
        tag: webPushTag,
      });
      toast.success("Enqueued Web Push test", {
        description: `jobCount: ${result.jobCount}`,
      });
    } catch (error) {
      toast.error("Failed to enqueue Web Push test", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    }
  };

  return (
    <AppShell
      sidebar={
        <AdminSidebar
          user={{
            name: user?.email?.split("@")[0],
            email: user?.email,
          }}
          pendingClaimsCount={stats?.pendingClaims || 0}
          pendingVerificationsCount={stats?.pendingVerifications || 0}
        />
      }
      navbar={
        <AdminNavbar
          user={{
            name: user?.email?.split("@")[0],
            email: user?.email,
          }}
          onLogout={handleLogout}
        />
      }
    >
      <div className="space-y-6">
        <PageHeader
          title="Notification Test"
          description="Enqueue and dispatch notification jobs for connectivity testing"
          breadcrumbs={[
            { label: "Admin", href: appRoutes.admin.base },
            { label: "Tools" },
            { label: "Notification Test" },
          ]}
          backHref={appRoutes.admin.base}
        />

        <Card>
          <CardHeader>
            <CardTitle>Targets</CardTitle>
            <CardDescription>
              These targets are used for all enqueue actions below.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="targetEmail">Target email (optional)</Label>
              <Input
                id="targetEmail"
                value={targetEmail}
                onChange={(e) => setTargetEmail(e.target.value)}
                placeholder="you@example.com"
                type="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetPhone">Target phone (optional)</Label>
              <Input
                id="targetPhone"
                value={targetPhone}
                onChange={(e) => setTargetPhone(e.target.value)}
                placeholder="0917 123 4567"
                type="tel"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dispatch</CardTitle>
            <CardDescription>
              Dispatch sends real email/SMS. Use carefully.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={dispatchConfirm}
                onCheckedChange={(checked) =>
                  setDispatchConfirm(Boolean(checked))
                }
              />
              <div className="text-sm">
                I understand this will send real messages
              </div>
            </div>

            <Button
              onClick={handleDispatch}
              disabled={dispatchMutation.isPending || !dispatchConfirm}
            >
              {dispatchMutation.isPending ? "Dispatching..." : "Dispatch now"}
            </Button>

            {dispatchMutation.data ? (
              <pre className="rounded-md border bg-muted/20 p-3 text-xs overflow-auto">
                {JSON.stringify(dispatchMutation.data, null, 2)}
              </pre>
            ) : null}
          </CardContent>
        </Card>

        <WebPushSettingsCard />

        <Card>
          <CardHeader>
            <CardTitle>Web Push: send test notification</CardTitle>
            <CardDescription>
              Enqueues a WEB_PUSH job for your active subscriptions. Use
              Dispatch to send.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="webPushSubscription">Subscription</Label>
              {webPushSubscriptionsQuery.isLoading ? (
                <div className="text-sm text-muted-foreground">
                  Loading subscriptions...
                </div>
              ) : webPushSubscriptions.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No active subscriptions found. Register this browser above.
                </div>
              ) : (
                <select
                  id="webPushSubscription"
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={webPushSubscriptionId}
                  onChange={(event) =>
                    setWebPushSubscriptionId(event.target.value)
                  }
                >
                  {webPushSubscriptions.map((subscription) => (
                    <option key={subscription.id} value={subscription.id}>
                      {subscription.userAgent
                        ? `${subscription.userAgent.slice(0, 40)} (${subscription.id.slice(0, 8)})`
                        : `Subscription ${subscription.id.slice(0, 8)}`}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="webPushTitle">Title</Label>
                <Input
                  id="webPushTitle"
                  value={webPushTitle}
                  onChange={(event) => setWebPushTitle(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="webPushTag">Tag</Label>
                <Input
                  id="webPushTag"
                  value={webPushTag}
                  onChange={(event) => setWebPushTag(event.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="webPushBody">Body</Label>
              <Textarea
                id="webPushBody"
                value={webPushBody}
                onChange={(event) => setWebPushBody(event.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="webPushUrl">URL (optional)</Label>
              <Input
                id="webPushUrl"
                value={webPushUrl}
                onChange={(event) => setWebPushUrl(event.target.value)}
                placeholder="/admin"
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => webPushSubscriptionsQuery.refetch()}
              >
                Refresh subscriptions
              </Button>
              <Button
                onClick={handleEnqueueWebPush}
                disabled={
                  webPushTestMutation.isPending ||
                  webPushSubscriptions.length === 0
                }
              >
                {webPushTestMutation.isPending
                  ? "Enqueuing..."
                  : "Enqueue Web Push"}
              </Button>
            </div>

            {webPushTestMutation.data ? (
              <pre className="rounded-md border bg-muted/20 p-3 text-xs overflow-auto">
                {JSON.stringify(webPushTestMutation.data, null, 2)}
              </pre>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Enqueue: reservation.created</CardTitle>
            <CardDescription>
              Creates test outbox jobs for owners.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="rPlace">Place name</Label>
                <Input
                  id="rPlace"
                  value={reservationPlaceName}
                  onChange={(e) => setReservationPlaceName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rCourt">Court label</Label>
                <Input
                  id="rCourt"
                  value={reservationCourtLabel}
                  onChange={(e) => setReservationCourtLabel(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="rStart">Start time (ISO)</Label>
                <Input
                  id="rStart"
                  value={reservationStartTimeIso}
                  onChange={(e) => setReservationStartTimeIso(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rEnd">End time (ISO)</Label>
                <Input
                  id="rEnd"
                  value={reservationEndTimeIso}
                  onChange={(e) => setReservationEndTimeIso(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="rTotal">Total (cents)</Label>
                <Input
                  id="rTotal"
                  value={reservationTotalPriceCents}
                  onChange={(e) =>
                    setReservationTotalPriceCents(e.target.value)
                  }
                  type="number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rCurrency">Currency</Label>
                <Input
                  id="rCurrency"
                  value={reservationCurrency}
                  onChange={(e) => setReservationCurrency(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rPlayer">Player name</Label>
                <Input
                  id="rPlayer"
                  value={reservationPlayerName}
                  onChange={(e) => setReservationPlayerName(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="rPlayerEmail">Player email (optional)</Label>
                <Input
                  id="rPlayerEmail"
                  value={reservationPlayerEmail}
                  onChange={(e) => setReservationPlayerEmail(e.target.value)}
                  type="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rPlayerPhone">Player phone (optional)</Label>
                <Input
                  id="rPlayerPhone"
                  value={reservationPlayerPhone}
                  onChange={(e) => setReservationPlayerPhone(e.target.value)}
                  type="tel"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rExpires">
                Owner response due (ISO) (optional)
              </Label>
              <Input
                id="rExpires"
                value={reservationExpiresAtIso}
                onChange={(e) => setReservationExpiresAtIso(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <Button type="button" variant="outline" onClick={goBack}>
                Back
              </Button>
              <Button
                onClick={handleEnqueueReservation}
                disabled={reservationMutation.isPending}
              >
                {reservationMutation.isPending
                  ? "Enqueuing..."
                  : "Enqueue jobs"}
              </Button>
            </div>

            {reservationMutation.data ? (
              <pre className="rounded-md border bg-muted/20 p-3 text-xs overflow-auto">
                {JSON.stringify(reservationMutation.data, null, 2)}
              </pre>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Enqueue: reviewed events</CardTitle>
            <CardDescription>
              Creates test outbox jobs for verification/claim approve/reject.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="reviewedKind">Type</Label>
                <select
                  id="reviewedKind"
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={reviewedKind}
                  onChange={(e) =>
                    setReviewedKind(
                      e.target.value === "claim_request"
                        ? "claim_request"
                        : "place_verification",
                    )
                  }
                >
                  <option value="place_verification">Place verification</option>
                  <option value="claim_request">Claim request</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reviewedStatus">Status</Label>
                <select
                  id="reviewedStatus"
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={reviewedStatus}
                  onChange={(e) =>
                    setReviewedStatus(
                      e.target.value === "REJECTED" ? "REJECTED" : "APPROVED",
                    )
                  }
                >
                  <option value="APPROVED">APPROVED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reviewedPlace">Place name</Label>
                <Input
                  id="reviewedPlace"
                  value={reviewedPlaceName}
                  onChange={(e) => setReviewedPlaceName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reviewedNotes">Review notes (optional)</Label>
              <Textarea
                id="reviewedNotes"
                value={reviewedNotes}
                onChange={(e) => setReviewedNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <Button type="button" variant="outline" onClick={goBack}>
                Back
              </Button>
              <Button
                onClick={handleEnqueueReviewed}
                disabled={
                  verificationReviewedMutation.isPending ||
                  claimReviewedMutation.isPending
                }
              >
                {verificationReviewedMutation.isPending ||
                claimReviewedMutation.isPending
                  ? "Enqueuing..."
                  : "Enqueue jobs"}
              </Button>
            </div>

            {verificationReviewedMutation.data || claimReviewedMutation.data ? (
              <pre className="rounded-md border bg-muted/20 p-3 text-xs overflow-auto">
                {JSON.stringify(
                  verificationReviewedMutation.data ||
                    claimReviewedMutation.data,
                  null,
                  2,
                )}
              </pre>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
