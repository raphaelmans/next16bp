"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, UserRound } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "@/common/toast";
import { getClientErrorMessage } from "@/common/toast/errors";
import {
  StandardFormInput,
  StandardFormProvider,
  StandardFormTextarea,
} from "@/components/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useMutCoachUpdateProfile,
  useQueryCoachMyProfile,
} from "@/features/coach/hooks";
import {
  type CoachProfileBasicsFormData,
  coachProfileBasicsSchema,
} from "@/features/coach/schemas";

const DEFAULT_VALUES: CoachProfileBasicsFormData = {
  name: "",
  tagline: "",
  bio: "",
};

export function ProfileStep({ isComplete }: { isComplete: boolean }) {
  const profileQuery = useQueryCoachMyProfile();
  const updateProfile = useMutCoachUpdateProfile();

  const form = useForm<CoachProfileBasicsFormData>({
    resolver: zodResolver(coachProfileBasicsSchema),
    mode: "onChange",
    defaultValues: DEFAULT_VALUES,
  });

  const {
    reset,
    formState: { isDirty, isSubmitting, isValid },
  } = form;

  useEffect(() => {
    reset({
      name: profileQuery.data?.coach.name ?? "",
      tagline: profileQuery.data?.coach.tagline ?? "",
      bio: profileQuery.data?.coach.bio ?? "",
    });
  }, [profileQuery.data, reset]);

  const handleSubmit = async (values: CoachProfileBasicsFormData) => {
    try {
      await updateProfile.mutateAsync({
        name: values.name.trim(),
        tagline: values.tagline.trim(),
        bio: values.bio.trim(),
      });
      toast.success(
        profileQuery.data?.coach
          ? "Coach profile updated"
          : "Coach profile created",
      );
    } catch (error) {
      toast.error("Failed to save coach profile", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    }
  };

  if (profileQuery.isLoading) {
    return <ProfileStepSkeleton />;
  }

  if (profileQuery.error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Could not load your coach profile</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>{profileQuery.error.message}</p>
          <Button variant="outline" onClick={() => void profileQuery.refetch()}>
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="border-b">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <Badge variant={isComplete ? "success" : "outline"}>Step 1</Badge>
            <CardTitle className="font-heading text-2xl">
              Build your coach profile
            </CardTitle>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Save the basics players need before they can book you: your coach
              name, a clear tagline, and a short bio that explains what kind of
              sessions you run.
            </p>
          </div>
          <div className="rounded-xl border bg-muted/40 px-4 py-3 text-sm">
            <p className="font-medium text-foreground">
              Completion rule: name, tagline, and bio
            </p>
            <p className="text-muted-foreground">
              Saving here updates onboarding progress immediately.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 pt-6">
        {isComplete ? (
          <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div className="space-y-1">
              <p className="font-medium text-foreground">
                Profile basics saved
              </p>
              <p className="text-muted-foreground">
                You can refine this anytime. The wizard will move to sports as
                soon as the setup status refresh completes.
              </p>
            </div>
          </div>
        ) : null}

        <StandardFormProvider form={form} onSubmit={handleSubmit}>
          <StandardFormInput<CoachProfileBasicsFormData>
            name="name"
            label="Coach name"
            placeholder="Coach Alex Cruz"
            required
          />
          <StandardFormInput<CoachProfileBasicsFormData>
            name="tagline"
            label="Tagline"
            placeholder="Private badminton sessions for competitive adults"
            required
          />
          <StandardFormTextarea<CoachProfileBasicsFormData>
            name="bio"
            label="Bio"
            placeholder="Describe your coaching background, who you help, and what players can expect in a session."
            required
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="submit"
              loading={isSubmitting || updateProfile.isPending}
              disabled={!isDirty || !isValid || isSubmitting}
            >
              {profileQuery.data?.coach
                ? "Save profile"
                : "Create coach profile"}
            </Button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <UserRound className="h-4 w-4" />
              <span>
                This creates your coach profile if you have not saved one yet.
              </span>
            </div>
          </div>
        </StandardFormProvider>
      </CardContent>
    </Card>
  );
}

function ProfileStepSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}
