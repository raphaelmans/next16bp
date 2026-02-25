"use client";

import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UnifiedChatInterface } from "@/features/chat/components/unified-chat/unified-chat-interface";
import {
  useQueryOwnerClaimRequestById,
  useQueryOwnerClaimRequests,
} from "@/features/owner/hooks";

interface ClaimListingCardProps {
  hasOrganization: boolean;
  hasPendingClaim: boolean;
  onSearchClick: () => void;
}

export function ClaimListingCard({
  hasOrganization,
  hasPendingClaim,
  onSearchClick,
}: ClaimListingCardProps) {
  const { data: myClaims } = useQueryOwnerClaimRequests(undefined, {
    enabled: hasPendingClaim,
  });

  const pendingClaim =
    myClaims?.find(
      (c) => c.status === "PENDING" && c.requestType === "CLAIM",
    ) ?? null;
  const pendingClaimId = pendingClaim?.id ?? null;

  const { data: pendingClaimDetails } = useQueryOwnerClaimRequestById(
    {
      id: pendingClaimId ?? "00000000-0000-0000-0000-000000000000",
    },
    {
      enabled: hasPendingClaim && !!pendingClaimId,
    },
  );

  const pendingClaimPlaceName = pendingClaimDetails?.place.name;

  if (hasPendingClaim) {
    return (
      <Card className="border-yellow-500/20 bg-yellow-50/50 dark:bg-yellow-950/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-yellow-500/10 text-yellow-600">
              <Search className="h-6 w-6" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <p className="font-heading font-semibold">Claim pending</p>
                <Badge variant="outline" className="text-xs text-yellow-600">
                  Under review
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {pendingClaimPlaceName
                  ? `Your claim request for ${pendingClaimPlaceName} is being reviewed. We will notify you once it is approved.`
                  : "Your claim request is being reviewed. We will notify you once it is approved."}
              </p>
              {pendingClaimId ? (
                <div className="pt-2">
                  <UnifiedChatInterface
                    surface="sheet"
                    domain="support"
                    kind="claim"
                    requestId={pendingClaimId}
                    triggerLabel="Message admin"
                    triggerVariant="outline"
                    triggerSize="sm"
                  />
                </div>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={!hasOrganization ? "opacity-60" : ""}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
            <Search className="h-6 w-6" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-heading font-semibold">
                  Claim existing listing
                </p>
                <Badge variant="secondary">Optional</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                If your venue is already on KudosCourts, claim it to manage
                courts and enable bookings.
              </p>
            </div>
            <Button
              onClick={onSearchClick}
              disabled={!hasOrganization}
              variant="outline"
            >
              Find my venue
              <Search className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
