"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useRouter } from "next/navigation";
import * as React from "react";
import { appRoutes } from "@/common/app-routes";
import { toast } from "@/common/toast";
import { getClientErrorMessage } from "@/common/toast/errors";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useQueryAuthSession } from "@/features/auth";
import {
  useMutAcceptOrganizationInvitation,
  useMutDeclineOrganizationInvitation,
} from "@/features/owner/hooks";

type InvitationState = "idle" | "accepted" | "declined";

const normalizeCodeInput = (value: string) =>
  value
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "")
    .slice(0, 16);

export default function AccountOrganizationInvitationAcceptPage({
  initialCode,
  invitationId,
  legacyToken,
}: {
  initialCode: string | null;
  invitationId: string | null;
  legacyToken: string | null;
}) {
  const router = useRouter();
  const { data: sessionUser } = useQueryAuthSession();
  const acceptInvitation = useMutAcceptOrganizationInvitation();
  const declineInvitation = useMutDeclineOrganizationInvitation();
  const [state, setState] = React.useState<InvitationState>("idle");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [code, setCode] = React.useState(() =>
    initialCode ? normalizeCodeInput(initialCode) : "",
  );

  const isPending = acceptInvitation.isPending || declineInvitation.isPending;
  const hasLegacyToken = Boolean(legacyToken && !initialCode);

  const buildPayload = () => ({
    code: normalizeCodeInput(code),
    invitationId: invitationId ?? undefined,
  });

  const validateCode = () => {
    const normalizedCode = normalizeCodeInput(code);
    if (normalizedCode.length < 6) {
      setErrorMessage("Enter a valid invitation code from your email.");
      return false;
    }
    return true;
  };

  const handleAccept = async () => {
    setErrorMessage(null);
    if (!validateCode()) return;

    try {
      await acceptInvitation.mutateAsync(buildPayload());
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
    if (!validateCode()) return;

    try {
      await declineInvitation.mutateAsync(buildPayload());
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

          {hasLegacyToken && (
            <div className="rounded-md border border-warning/30 bg-warning-light p-3 text-sm text-warning-foreground">
              This invitation link format is no longer supported. Enter the
              invitation code from your email to continue.
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="invitation-code">
              Invitation code
            </label>
            <Input
              id="invitation-code"
              type="text"
              placeholder="A7K9-P2Q4"
              value={code}
              onChange={(event) => {
                setCode(normalizeCodeInput(event.target.value));
              }}
              disabled={isPending || state !== "idle"}
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          {state === "accepted" && (
            <div className="rounded-md border border-success/30 bg-success-light p-3 text-sm text-success">
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
            <div className="rounded-md border border-warning/30 bg-warning-light p-3 text-sm text-warning-foreground">
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
                <Spinner className="mr-2 h-4 w-4" />
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
                <Spinner className="mr-2 h-4 w-4" />
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
