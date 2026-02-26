import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SetupProgressBadgesProps {
  hasOrganization: boolean;
  hasVenue: boolean;
  hasPendingClaim: boolean;
  hasVerification: boolean;
  hasReadyCourt: boolean;
  hasPaymentMethod: boolean;
}

export function SetupProgressBadges({
  hasOrganization,
  hasVenue,
  hasPendingClaim,
  hasVerification,
  hasReadyCourt,
  hasPaymentMethod,
}: SetupProgressBadgesProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge variant={hasOrganization ? "default" : "secondary"}>
        {hasOrganization ? (
          <Check className="mr-1 h-3 w-3" />
        ) : (
          <span className="mr-1">1.</span>
        )}
        Organization
      </Badge>
      <Badge variant={hasVenue || hasPendingClaim ? "default" : "secondary"}>
        {hasVenue || hasPendingClaim ? (
          <Check className="mr-1 h-3 w-3" />
        ) : (
          <span className="mr-1">2.</span>
        )}
        Venue
      </Badge>
      <Badge variant={hasVerification ? "default" : "secondary"}>
        {hasVerification ? (
          <Check className="mr-1 h-3 w-3" />
        ) : (
          <span className="mr-1">3.</span>
        )}
        Verify
      </Badge>
      <Badge variant={hasReadyCourt ? "default" : "secondary"}>
        {hasReadyCourt ? (
          <Check className="mr-1 h-3 w-3" />
        ) : (
          <span className="mr-1">4.</span>
        )}
        Go Live
      </Badge>
      <Badge variant={hasPaymentMethod ? "default" : "secondary"}>
        {hasPaymentMethod ? (
          <Check className="mr-1 h-3 w-3" />
        ) : (
          <span className="mr-1">5.</span>
        )}
        Payment method
      </Badge>
    </div>
  );
}
