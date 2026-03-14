"use client";

import Link from "next/link";
import { appRoutes } from "@/common/app-routes";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ProfileStep } from "../components/get-started/wizard/steps/profile-step";
import { SportsStep } from "../components/get-started/wizard/steps/sports-step";
import { useQueryCoachSetupStatus } from "../hooks";

export default function CoachProfilePage() {
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
        <AlertTitle>Could not load your coach profile</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>{error.message}</p>
          <Button variant="outline" onClick={() => void refetch()}>
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <Badge variant="secondary">Coach profile</Badge>
            <h2 className="font-heading text-3xl font-semibold text-foreground">
              Edit your public coach profile
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Keep your public basics and coached sports current here. Use
              get-started to finish location, payment, schedule, pricing, and
              verification tasks when those steps still need work.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={appRoutes.coach.getStarted}>Open get-started</Link>
          </Button>
        </div>
      </section>

      <ProfileStep isComplete={data?.hasCoachProfile ?? false} />
      <SportsStep
        coachId={data?.coachId ?? null}
        isComplete={data?.hasCoachSports ?? false}
      />
    </div>
  );
}
