import { ArrowRight, CheckCircle, ClipboardList } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ConfigureCourtsCardProps {
  hasVenue: boolean;
  hasActiveCourt: boolean;
  hasReadyCourt: boolean;
  hasCourtSchedule: boolean;
  hasCourtPricing: boolean;
  placeId?: string;
  courtId?: string;
  onConfigureClick: () => void;
  onManageCourtsClick?: () => void;
  onEditScheduleClick?: () => void;
  onManageAvailabilityClick?: () => void;
}

export function ConfigureCourtsCard({
  hasVenue,
  hasActiveCourt,
  hasReadyCourt,
  hasCourtSchedule,
  hasCourtPricing,
  placeId,
  courtId,
  onConfigureClick,
  onManageCourtsClick,
  onEditScheduleClick,
  onManageAvailabilityClick,
}: ConfigureCourtsCardProps) {
  if (hasReadyCourt) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <p className="font-heading font-semibold">Courts configured</p>
                <Badge variant="outline" className="text-xs">
                  Complete
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Your venue is ready for schedules and pricing updates.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {placeId ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={onManageCourtsClick}
                      disabled={!onManageCourtsClick}
                    >
                      Manage courts
                    </Button>
                    {courtId && (
                      <Button
                        variant="outline"
                        onClick={onManageAvailabilityClick}
                        disabled={!onManageAvailabilityClick}
                      >
                        Manage availability
                      </Button>
                    )}
                  </>
                ) : (
                  <Button variant="outline" disabled>
                    Manage courts
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (hasActiveCourt) {
    const missingItems = [
      !hasCourtSchedule ? "schedule hours" : null,
      !hasCourtPricing ? "pricing rules" : null,
    ].filter(Boolean);

    return (
      <Card className="border-warning/20 bg-warning/10">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-warning/15 text-warning">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <p className="font-heading font-semibold">
                  Courts need updates
                </p>
                <Badge variant="outline" className="text-xs text-warning">
                  Action needed
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Add {missingItems.join(" and ")} to at least one active court to
                enable bookings.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {placeId ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={onManageCourtsClick}
                      disabled={!onManageCourtsClick}
                    >
                      Manage courts
                    </Button>
                    {courtId && (
                      <Button
                        variant="outline"
                        onClick={onEditScheduleClick}
                        disabled={!onEditScheduleClick}
                      >
                        Edit schedule & pricing
                      </Button>
                    )}
                  </>
                ) : (
                  <Button variant="outline" disabled>
                    Manage courts
                  </Button>
                )}
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
            <ClipboardList className="h-6 w-6" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-heading font-semibold">
                  Configure venue courts
                </p>
                <Badge>Required</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Add courts and set up schedules so players can book.
              </p>
            </div>
            <Button onClick={onConfigureClick} disabled={!hasVenue}>
              Set up courts
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
