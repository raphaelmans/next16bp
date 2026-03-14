"use client";

import Link from "next/link";
import { appRoutes } from "@/common/app-routes";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { CoachBlockManager } from "../components/coach-block-manager";
import { CoachScheduleEditor } from "../components/coach-schedule-editor";
import { useQueryCoachSetupStatus } from "../hooks";

export default function CoachSchedulePage() {
  const { data, isLoading, error, refetch } = useQueryCoachSetupStatus();

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="size-8 text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Could not load coach schedule</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>{error.message}</p>
          <Button variant="outline" onClick={() => void refetch()}>
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!data?.coachId) {
    return (
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="space-y-3">
          <Badge variant="outline">Setup required</Badge>
          <h2 className="font-heading text-2xl font-semibold text-foreground">
            Create your coach profile first
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Schedule tools are ready, but they need a coach record to attach to.
            Finish the earlier get-started steps, then return here to publish
            recurring availability and one-off blocks.
          </p>
          <Button asChild>
            <Link href={appRoutes.coach.getStarted}>Open get-started</Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <Badge variant="secondary">Coach schedule</Badge>
            <h2 className="font-heading text-3xl font-semibold text-foreground">
              Manage weekly hours and blocked time
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Weekly hours drive recurring availability. Ad-hoc blocks let you
              close specific windows without rewriting your normal schedule.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={appRoutes.coach.getStarted}>Back to get-started</Link>
          </Button>
        </div>
      </section>

      <CoachScheduleEditor coachId={data.coachId} />
      <CoachBlockManager coachId={data.coachId} />
    </div>
  );
}
