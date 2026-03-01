"use client";

import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { appRoutes } from "@/common/app-routes";
import { toast } from "@/common/toast";
import { getClientErrorMessage } from "@/common/toast/errors";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQueryAuthSession } from "@/features/auth";
import {
  useMutAcceptOrganizationInvitation,
  useMutDeclineOrganizationInvitation,
} from "@/features/owner/hooks";

type InvitationState = "idle" | "accepted" | "declined";

export default function AccountOrganizationInvitationAcceptPage({
  token,
}: {
  token: string | null;
}) {
  const router = useRouter();
  const { data: sessionUser } = useQueryAuthSession();
  const acceptInvitation = useMutAcceptOrganizationInvitation();
  const declineInvitation = useMutDeclineOrganizationInvitation();
  const [state, setState] = React.useState<InvitationState>("idle");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  if (!token) {
    return (
      <div className="mx-auto w-full max-w-2xl p-4">
        <Card>
          <CardHeader>
            <CardTitle>Invalid invitation link</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              The invitation token is missing. Request a new invitation from
              your organization team.
            </p>
            <Button onClick={() => router.push(appRoutes.home.base)}>
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPending = acceptInvitation.isPending || declineInvitation.isPending;

  const handleAccept = async () => {
    setErrorMessage(null);
    try {
      await acceptInvitation.mutateAsync({ token });
      setState("accepted");
      toast.success("Invitation accepted");
    } catch (error) {
      const message = getClientErrorMessage(
        error,
        "Unable to accept invitation",
      );
      setErrorMessage(message);
      toast.error("Unable to accept invitation", { description: message });
    }
  };

  const handleDecline = async () => {
    setErrorMessage(null);
    try {
      await declineInvitation.mutateAsync({ token });
      setState("declined");
      toast.success("Invitation declined");
    } catch (error) {
      const message = getClientErrorMessage(
        error,
        "Unable to decline invitation",
      );
      setErrorMessage(message);
      toast.error("Unable to decline invitation", { description: message });
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl p-4">
      <Card>
        <CardHeader>
          <CardTitle>Organization Invitation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Signed in as{" "}
            <span className="font-medium">{sessionUser?.email}</span>. Accepting
            will grant organization access based on the invitation permissions.
          </p>

          {state === "accepted" && (
            <div className="rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900">
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="h-4 w-4" />
                Invitation accepted.
              </div>
              <p className="mt-1">
                You can now access owner reservation workflows for this
                organization.
              </p>
            </div>
          )}

          {state === "declined" && (
            <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              <div className="flex items-center gap-2 font-medium">
                <XCircle className="h-4 w-4" />
                Invitation declined.
              </div>
              <p className="mt-1">
                No access changes were made. You can ask for another invite if
                needed.
              </p>
            </div>
          )}

          {errorMessage && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {errorMessage}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={handleAccept}
              disabled={isPending || state !== "idle"}
            >
              {acceptInvitation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Accept invitation
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleDecline}
              disabled={isPending || state !== "idle"}
            >
              {declineInvitation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Decline
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push(appRoutes.organization.base)}
            >
              Go to Organization Portal
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
