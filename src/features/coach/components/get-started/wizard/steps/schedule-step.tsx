import Link from "next/link";
import { appRoutes } from "@/common/app-routes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CoachBlockManager } from "@/features/coach/components/coach-block-manager";
import { CoachScheduleEditor } from "@/features/coach/components/coach-schedule-editor";
import { StepPlaceholder } from "./step-placeholder";

export function ScheduleStep({
  isComplete,
  coachId,
}: {
  isComplete: boolean;
  coachId: string | null;
}) {
  if (!coachId) {
    return (
      <StepPlaceholder
        eyebrow="Step 4"
        title="Add weekly availability"
        description="Schedule tools are ready, but they need an existing coach profile first. Finish the earlier setup steps, then return here to publish recurring availability and one-off blocks."
        bullets={[
          "Current readiness rule: at least one weekly hours window",
          "Available once a coach record exists",
          "Ad-hoc blocks use the same coach profile as weekly hours",
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
                Step 4
              </p>
              <CardTitle className="font-heading text-2xl">
                Add weekly availability
              </CardTitle>
            </div>
            <Badge variant={isComplete ? "success" : "outline"}>
              {isComplete ? "Complete" : "In progress"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <p className="text-sm leading-6 text-muted-foreground">
            Weekly hours unlock setup readiness, while blocks let you override
            specific dates without rewriting the recurring schedule.
          </p>
          <Button asChild variant="outline">
            <Link href={appRoutes.coach.schedule}>Open full schedule page</Link>
          </Button>
        </CardContent>
      </Card>

      <CoachScheduleEditor
        coachId={coachId}
        primaryActionLabel="Save hours and refresh setup"
      />
      <CoachBlockManager coachId={coachId} />
    </div>
  );
}
