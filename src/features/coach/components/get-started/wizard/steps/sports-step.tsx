"use client";

import { CheckCircle2, Volleyball } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "@/common/toast";
import { getClientErrorMessage } from "@/common/toast/errors";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useMutCoachUpdateProfile,
  useQueryCoachMyProfile,
  useQueryCoachSports,
} from "@/features/coach/hooks";

interface SportsStepProps {
  isComplete: boolean;
  coachId: string | null;
}

export function SportsStep({ isComplete, coachId }: SportsStepProps) {
  const profileQuery = useQueryCoachMyProfile({ enabled: !!coachId });
  const sportsQuery = useQueryCoachSports({ enabled: !!coachId });
  const updateProfile = useMutCoachUpdateProfile();
  const [selectedSportIds, setSelectedSportIds] = useState<string[]>([]);
  const [showValidationError, setShowValidationError] = useState(false);

  const savedSportIds = useMemo(
    () => profileQuery.data?.sports.map((sport) => sport.sportId) ?? [],
    [profileQuery.data],
  );

  useEffect(() => {
    setSelectedSportIds(savedSportIds);
    setShowValidationError(false);
  }, [savedSportIds]);

  if (!coachId) {
    return (
      <Card>
        <CardContent className="flex items-start gap-3 p-6">
          <Volleyball className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
          <div className="space-y-1">
            <p className="font-medium text-foreground">
              Save your profile before choosing sports
            </p>
            <p className="text-sm text-muted-foreground">
              The sports step attaches selections to a real coach profile. Once
              Step 1 is saved, return here to choose what you coach.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (profileQuery.isLoading || sportsQuery.isLoading) {
    return <SportsStepSkeleton />;
  }

  const combinedError = profileQuery.error ?? sportsQuery.error;

  if (combinedError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Could not load your sports setup</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>{combinedError.message}</p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => void profileQuery.refetch()}
            >
              Retry profile
            </Button>
            <Button
              variant="outline"
              onClick={() => void sportsQuery.refetch()}
            >
              Retry sports
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  const sportOptions = sportsQuery.data ?? [];

  if (sportOptions.length === 0) {
    return (
      <Card>
        <CardContent className="space-y-3 p-6">
          <div className="space-y-1">
            <p className="font-medium text-foreground">No sports available</p>
            <p className="text-sm text-muted-foreground">
              The sports catalog did not return any choices, so onboarding
              cannot finish this step yet.
            </p>
          </div>
          <Button variant="outline" onClick={() => void sportsQuery.refetch()}>
            Refresh sports list
          </Button>
        </CardContent>
      </Card>
    );
  }

  const hasChanges = !haveSameValues(savedSportIds, selectedSportIds);

  const handleToggleSport = (sportId: string, checked: boolean) => {
    const nextSelection = checked
      ? [...selectedSportIds, sportId]
      : selectedSportIds.filter((value) => value !== sportId);

    setSelectedSportIds(nextSelection);
    if (nextSelection.length > 0) {
      setShowValidationError(false);
    }
  };

  const handleSave = async () => {
    if (selectedSportIds.length === 0) {
      setShowValidationError(true);
      return;
    }

    try {
      await updateProfile.mutateAsync({
        sportIds: selectedSportIds,
      });
      toast.success("Sports updated");
    } catch (error) {
      toast.error("Failed to save sports", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    }
  };

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="border-b">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <Badge variant={isComplete ? "success" : "outline"}>Step 2</Badge>
            <CardTitle className="font-heading text-2xl">
              Choose your sports
            </CardTitle>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Pick at least one sport so discovery and booking flows know what
              players can actually book with you.
            </p>
          </div>
          <div className="rounded-xl border bg-muted/40 px-4 py-3 text-sm">
            <p className="font-medium text-foreground">
              {selectedSportIds.length} sport
              {selectedSportIds.length === 1 ? "" : "s"} selected
            </p>
            <p className="text-muted-foreground">
              Completion rule: at least one saved sport.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 pt-6">
        {isComplete ? (
          <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div className="space-y-1">
              <p className="font-medium text-foreground">Sports saved</p>
              <p className="text-muted-foreground">
                You can update this selection anytime. The wizard progress will
                refresh after each save.
              </p>
            </div>
          </div>
        ) : null}

        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">
            Sports you coach
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {sportOptions.map((sport) => {
              const isChecked = selectedSportIds.includes(sport.id);
              const checkboxId = `coach-sport-${sport.id}`;

              return (
                <div
                  key={sport.id}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors hover:border-primary/30 hover:bg-accent/30"
                >
                  <Checkbox
                    id={checkboxId}
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      handleToggleSport(sport.id, checked === true);
                    }}
                  />
                  <div className="space-y-1">
                    <label
                      htmlFor={checkboxId}
                      className="block cursor-pointer font-medium text-foreground"
                    >
                      {sport.name}
                    </label>
                    <p className="text-sm text-muted-foreground">
                      Shows up in your onboarding status and future coach
                      discovery filters.
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          {showValidationError ? (
            <p className="text-sm text-destructive">
              Choose at least one sport
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            loading={updateProfile.isPending}
            disabled={!hasChanges || updateProfile.isPending}
            onClick={() => void handleSave()}
          >
            Save sports
          </Button>
          <p className="text-sm text-muted-foreground">
            Choose every sport you currently coach. You can refine the rest of
            your public detail later.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function SportsStepSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-10 w-40" />
    </div>
  );
}

function haveSameValues(a: string[], b: string[]) {
  if (a.length !== b.length) {
    return false;
  }

  const left = [...a].sort();
  const right = [...b].sort();

  return left.every((value, index) => value === right[index]);
}
