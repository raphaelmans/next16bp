import { ArrowRight, CheckCircle, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface VerifyVenueCardProps {
  hasVenue: boolean;
  placeName: string;
  verificationStatus?: string | null;
  onVerifyClick: () => void;
}

export function VerifyVenueCard({
  hasVenue,
  placeName,
  verificationStatus,
  onVerifyClick,
}: VerifyVenueCardProps) {
  const isPending = verificationStatus === "PENDING";
  const isVerified = verificationStatus === "VERIFIED";
  const isRejected = verificationStatus === "REJECTED";

  if (isVerified) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <p className="font-heading font-semibold">Venue verified</p>
                <Badge variant="outline" className="text-xs">
                  Complete
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {placeName} is verified and confirmed for reservations.
              </p>
              <div className="pt-2">
                <Button variant="outline" onClick={onVerifyClick}>
                  View verification
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isPending) {
    return (
      <Card className="border-yellow-500/20 bg-yellow-50/50 dark:bg-yellow-950/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-yellow-500/10 text-yellow-600">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <p className="font-heading font-semibold">
                  Verification pending
                </p>
                <Badge variant="outline" className="text-xs text-yellow-600">
                  Under review
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                We are reviewing your documents for {placeName}.
              </p>
              <div className="pt-2">
                <Button variant="outline" onClick={onVerifyClick}>
                  View submission
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isRejected) {
    return (
      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <p className="font-heading font-semibold">
                  Verification needs updates
                </p>
                <Badge variant="outline" className="text-xs text-destructive">
                  Action needed
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Update your documents to verify {placeName}.
              </p>
              <div className="pt-2">
                <Button onClick={onVerifyClick}>Resubmit docs</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={!hasVenue ? "opacity-60" : ""}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-heading font-semibold">
                  Get your venue verified
                </p>
                <Badge>Required</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Upload proof of ownership to unlock online reservations.
              </p>
            </div>
            <Button onClick={onVerifyClick} disabled={!hasVenue}>
              Submit verification
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
