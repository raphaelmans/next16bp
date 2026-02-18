import { RefreshCw } from "lucide-react";
import { Container } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type OpenPlayDetailErrorStateProps = {
  message: string;
};

export function OpenPlayDetailLoadingState() {
  return (
    <Container className="py-8">
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </Container>
  );
}

export function OpenPlayDetailErrorState({
  message,
}: OpenPlayDetailErrorStateProps) {
  return (
    <Container className="py-8">
      <Card>
        <CardContent className="p-6 text-sm text-destructive">
          {message}
        </CardContent>
      </Card>
    </Container>
  );
}

export function OpenPlayDetailNotFoundState() {
  return (
    <Container className="py-8">
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Open Play not found.
        </CardContent>
      </Card>
    </Container>
  );
}

type OpenPlayParticipant = {
  participantId: string;
  displayName: string;
  message?: string | null;
};

type OpenPlayRequestsCardProps = {
  title: string;
  participants: OpenPlayParticipant[];
  emptyMessage: string;
  onRefresh: () => void;
  isRefreshing: boolean;
  onConfirm: (participantId: string) => void;
  onDecline: (participantId: string) => void;
  onWaitlist?: (participantId: string) => void;
  decisionsDisabled: boolean;
  isMutating: boolean;
  helperText?: string;
};

export function OpenPlayRequestsCard({
  title,
  participants,
  emptyMessage,
  onRefresh,
  isRefreshing,
  onConfirm,
  onDecline,
  onWaitlist,
  decisionsDisabled,
  isMutating,
  helperText,
}: OpenPlayRequestsCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>{title}</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {helperText ? (
          <p className="text-xs text-muted-foreground">{helperText}</p>
        ) : null}

        {participants.length ? (
          <div className="space-y-3">
            {participants.map((participant) => (
              <div
                key={participant.participantId}
                className="flex items-center justify-between gap-3 rounded-md border p-3"
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">
                    {participant.displayName}
                  </div>
                  {participant.message ? (
                    <div className="text-xs text-muted-foreground truncate">
                      {participant.message}
                    </div>
                  ) : null}
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => onConfirm(participant.participantId)}
                    disabled={isMutating || decisionsDisabled}
                  >
                    Confirm
                  </Button>

                  {onWaitlist ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onWaitlist(participant.participantId)}
                      disabled={isMutating || decisionsDisabled}
                    >
                      Waitlist
                    </Button>
                  ) : null}

                  <Button
                    size="sm"
                    variant={onWaitlist ? "ghost" : "outline"}
                    onClick={() => onDecline(participant.participantId)}
                    disabled={isMutating || decisionsDisabled}
                  >
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">{emptyMessage}</div>
        )}
      </CardContent>
    </Card>
  );
}

type OpenPlayCostSharingCardProps = {
  reservationTotalLabel: string;
  requiresPayment: boolean;
  suggestedSplitLabel: string;
  splitBasisPlayers: number;
  paymentInstructions?: string | null;
  paymentLinkUrl?: string | null;
};

export function OpenPlayCostSharingCard({
  reservationTotalLabel,
  requiresPayment,
  suggestedSplitLabel,
  splitBasisPlayers,
  paymentInstructions,
  paymentLinkUrl,
}: OpenPlayCostSharingCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cost sharing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">Reservation total</span>
          <span className="font-medium">{reservationTotalLabel}</span>
        </div>

        {requiresPayment ? (
          <>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Suggested split</span>
              <span className="font-medium">
                Est. {suggestedSplitLabel}/player
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Based on {splitBasisPlayers} players (includes host).
            </p>

            {paymentInstructions ? (
              <div className="rounded-md border bg-muted/20 p-3 text-xs text-muted-foreground whitespace-pre-wrap">
                {paymentInstructions}
              </div>
            ) : null}

            {paymentLinkUrl ? (
              <Button variant="outline" className="w-full" asChild>
                <a
                  href={paymentLinkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open payment link
                </a>
              </Button>
            ) : null}

            <p className="text-xs text-muted-foreground">
              KudosCourts does not process payments. Pay the host directly using
              the instructions above.
            </p>
          </>
        ) : (
          <p className="text-muted-foreground">No payment required.</p>
        )}
      </CardContent>
    </Card>
  );
}

type OpenPlayParticipantsCardProps = {
  confirmedCount: number;
  maxPlayers: number;
};

export function OpenPlayParticipantsCard({
  confirmedCount,
  maxPlayers,
}: OpenPlayParticipantsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Participants</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span>Confirmed</span>
          <span className="font-medium">{confirmedCount}</span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Capacity</span>
          <span>{maxPlayers} total</span>
        </div>
      </CardContent>
    </Card>
  );
}

type OpenPlayShareCardProps = {
  onCopyLink: () => Promise<void>;
};

export function OpenPlayShareCard({ onCopyLink }: OpenPlayShareCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Share</CardTitle>
      </CardHeader>
      <CardContent>
        <Button variant="outline" className="w-full" onClick={onCopyLink}>
          Copy link
        </Button>
        <p className="mt-2 text-xs text-muted-foreground">
          Share this link to invite friends to join.
        </p>
      </CardContent>
    </Card>
  );
}

type OpenPlayStatusBadgesProps = {
  statusLabel: string;
  statusVariant: "secondary" | "outline" | "destructive";
  availableSpots: number;
  joinPolicy: "AUTO" | "REQUEST";
};

export function OpenPlayStatusBadges({
  statusLabel,
  statusVariant,
  availableSpots,
  joinPolicy,
}: OpenPlayStatusBadgesProps) {
  return (
    <div className="flex flex-col items-end gap-2">
      <Badge variant={statusVariant}>{statusLabel}</Badge>
      <Badge variant={availableSpots === 0 ? "destructive" : "default"}>
        {availableSpots === 0
          ? "Full"
          : `${availableSpots} spot${availableSpots === 1 ? "" : "s"} left`}
      </Badge>
      <Badge variant="outline">
        {joinPolicy === "AUTO" ? "Auto-join" : "Request"}
      </Badge>
    </div>
  );
}
