import { ArrowRight, CheckCircle, MapPin } from "lucide-react";
import Link from "next/link";
import { appRoutes } from "@/common/app-routes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface AddVenueCardProps {
  hasOrganization: boolean;
  hasVenue: boolean;
  onAddClick: () => void;
}

export function AddVenueCard({
  hasOrganization,
  hasVenue,
  onAddClick,
}: AddVenueCardProps) {
  if (hasVenue) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <p className="font-heading font-semibold">Venue added</p>
                <Badge variant="outline" className="text-xs">
                  Complete
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Next, submit verification to add trust signals for players. You
                can add more venues from your dashboard.
              </p>
              <div className="pt-2">
                <Button variant="outline" asChild>
                  <Link href={appRoutes.organization.places.base}>
                    View venues
                  </Link>
                </Button>
              </div>
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
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <MapPin className="h-6 w-6" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-heading font-semibold">Add new venue</p>
                <Badge>Required</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Create a new venue listing with name, address, and contact info.
              </p>
            </div>
            <Button
              onClick={onAddClick}
              disabled={!hasOrganization}
              variant="outline"
            >
              Add venue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
