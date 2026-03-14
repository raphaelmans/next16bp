import Link from "next/link";
import { appRoutes } from "@/common/app-routes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CoachAddonEditor } from "@/features/coach/components/coach-addon-editor";
import { CoachPricingEditor } from "@/features/coach/components/coach-pricing-editor";
import { StepPlaceholder } from "./step-placeholder";

export function PricingStep({
  isComplete,
  coachId,
}: {
  isComplete: boolean;
  coachId: string | null;
}) {
  if (!coachId) {
    return (
      <StepPlaceholder
        eyebrow="Step 5"
        title="Define your pricing"
        description="Pricing tools are ready, but they need an existing coach profile first. Finish the earlier setup steps, then return here to publish rate rules and add-ons."
        bullets={[
          "Current readiness rule: at least one coach rate rule",
          "Available once a coach record exists",
          "Add-ons layer on top of your rate rules and stay separate from payment setup",
        ]}
        isComplete={isComplete}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/80 shadow-sm">
        <CardHeader className="border-b">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Step 5
              </p>
              <CardTitle className="font-heading text-2xl">
                Define your pricing
              </CardTitle>
            </div>
            <Badge variant={isComplete ? "success" : "outline"}>
              {isComplete ? "Complete" : "In progress"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <p className="text-sm leading-6 text-muted-foreground">
            Rate rules set your core pricing windows. Add-ons cover optional or
            automatic fees that stack on top of the base session price.
          </p>
          <Button asChild variant="outline">
            <Link href={appRoutes.coach.pricing}>Open full pricing page</Link>
          </Button>
        </CardContent>
      </Card>

      <CoachPricingEditor coachId={coachId} />
      <CoachAddonEditor coachId={coachId} />
    </div>
  );
}
