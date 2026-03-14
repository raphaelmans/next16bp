"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  BadgeCheck,
  CheckCircle2,
  Clock3,
  FileBadge2,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { type ReactNode, useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "@/common/toast";
import { getClientErrorMessage } from "@/common/toast/errors";
import { StandardFormInput, StandardFormProvider } from "@/components/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useMutCoachSubmitVerification,
  useMutCoachUpdateProfile,
  useQueryCoachMyProfile,
} from "@/features/coach/hooks";
import {
  type CoachVerificationFormData,
  coachVerificationFormSchema,
} from "@/features/coach/schemas";
import type { CoachSetupStatus } from "@/lib/modules/coach-setup/shared";

type VerifyStepProps = {
  status: CoachSetupStatus;
};

const createBlankCertification = () => ({
  name: "",
  issuingBody: "",
  level: "",
});

export function VerifyStep({ status }: VerifyStepProps) {
  const profileQuery = useQueryCoachMyProfile({ enabled: !!status.coachId });
  const updateProfile = useMutCoachUpdateProfile();
  const submitVerification = useMutCoachSubmitVerification();

  const form = useForm<CoachVerificationFormData>({
    resolver: zodResolver(coachVerificationFormSchema),
    mode: "onChange",
    defaultValues: {
      certifications: [createBlankCertification()],
    },
  });

  const { control, reset, formState, getValues } = form;
  const { isDirty, isSubmitting, isValid } = formState;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "certifications",
  });

  useEffect(() => {
    const certifications =
      profileQuery.data?.certifications.map((certification) => ({
        name: certification.name ?? "",
        issuingBody: certification.issuingBody ?? "",
        level: certification.level ?? "",
      })) ?? [];

    reset({
      certifications:
        certifications.length > 0
          ? certifications
          : [createBlankCertification()],
    });
  }, [profileQuery.data, reset]);

  const prerequisitesMet =
    status.hasCoachProfile &&
    status.hasCoachSports &&
    status.hasCoachLocation &&
    status.hasCoachSchedule &&
    status.hasCoachPricing &&
    status.hasPaymentMethod;

  const savedCertifications = profileQuery.data?.certifications ?? [];
  const hasSavedCertifications = savedCertifications.some(
    (certification) =>
      certification.name.trim().length > 0 &&
      (certification.issuingBody?.trim().length ?? 0) > 0,
  );

  const handleSaveCertifications = async (
    values: CoachVerificationFormData,
  ) => {
    try {
      await updateProfile.mutateAsync({
        certifications: values.certifications.map((certification) => ({
          name: certification.name.trim(),
          issuingBody: certification.issuingBody.trim(),
          level: certification.level.trim() || undefined,
        })),
      });
      toast.success("Certifications saved");
    } catch (error) {
      toast.error("Failed to save certifications", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    }
  };

  const handleSubmitVerification = async () => {
    try {
      await submitVerification.mutateAsync();
      toast.success("Verification submitted", {
        description: "Your coach listing is now pending review.",
      });
    } catch (error) {
      toast.error("Failed to submit verification", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    }
  };

  if (!status.coachId) {
    return (
      <BlockedVerificationCard
        title="Create your coach profile first"
        description="The verification request attaches to a real coach profile. Finish Step 1 before returning here."
      />
    );
  }

  if (profileQuery.isLoading) {
    return <VerifyStepSkeleton />;
  }

  if (profileQuery.error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Could not load your verification setup</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>{profileQuery.error.message}</p>
          <Button variant="outline" onClick={() => void profileQuery.refetch()}>
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (status.verificationStatus === "VERIFIED") {
    return (
      <VerificationStatusCard
        badgeVariant="success"
        badgeLabel="Step 7"
        icon={<ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />}
        title="Coach verified"
        description="Your listing passed verification and the final setup step is now unlocked."
        body={`Approved certifications on file: ${savedCertifications.length}.`}
      />
    );
  }

  if (status.verificationStatus === "PENDING") {
    return (
      <VerificationStatusCard
        badgeVariant="outline"
        badgeLabel="Step 7"
        icon={<Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />}
        title="Verification pending review"
        description="Your request is submitted. Setup stays blocked on this step until the listing is approved."
        body="You can keep coaching prep work up to date, but the launch gate will not clear until verification becomes approved."
      />
    );
  }

  const verificationBanner =
    status.verificationStatus === "REJECTED" ? (
      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Verification needs updates</AlertTitle>
        <AlertDescription>
          Save updated certification details, then resubmit your verification
          request.
        </AlertDescription>
      </Alert>
    ) : null;

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="border-b">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <Badge variant={status.hasVerification ? "success" : "outline"}>
              Step 7
            </Badge>
            <CardTitle className="font-heading text-2xl">
              Submit for verification
            </CardTitle>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Add at least one real coaching credential, then submit your
              listing for review. This step does not complete until the review
              status becomes approved.
            </p>
          </div>
          <div className="rounded-xl border bg-muted/40 px-4 py-3 text-sm">
            <p className="font-medium text-foreground">
              Completion rule: approved verification
            </p>
            <p className="text-muted-foreground">
              Submission requires the previous onboarding steps plus one saved
              certification.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 pt-6">
        {verificationBanner}

        {!prerequisitesMet ? (
          <BlockedVerificationCard
            title="Finish the earlier setup steps first"
            description="Verification only opens after profile, sports, location, schedule, pricing, and payment are all saved."
          />
        ) : null}

        <StandardFormProvider form={form} onSubmit={handleSaveCertifications}>
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="space-y-4 rounded-xl border border-border/80 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <FileBadge2 className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">
                      Certification {index + 1}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={fields.length === 1}
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </Button>
                </div>
                <StandardFormInput<CoachVerificationFormData>
                  name={`certifications.${index}.name`}
                  label="Certification name"
                  placeholder="National Coaching Certificate"
                  required
                />
                <StandardFormInput<CoachVerificationFormData>
                  name={`certifications.${index}.issuingBody`}
                  label="Issuing body"
                  placeholder="Philippine Sports Commission"
                  required
                />
                <StandardFormInput<CoachVerificationFormData>
                  name={`certifications.${index}.level`}
                  label="Level"
                  placeholder="Level 1"
                />
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => append(createBlankCertification())}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add certification
            </Button>
            <Button
              type="submit"
              loading={isSubmitting || updateProfile.isPending}
              disabled={!isDirty || !isValid || isSubmitting}
            >
              Save certifications
            </Button>
            <Button
              type="button"
              loading={submitVerification.isPending}
              disabled={
                !prerequisitesMet ||
                !hasSavedCertifications ||
                isDirty ||
                submitVerification.isPending ||
                updateProfile.isPending ||
                getValues("certifications").length === 0
              }
              onClick={() => void handleSubmitVerification()}
            >
              Submit for verification
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            Save the certification list first, then submit it for review.
            Unsaved changes keep the submit action disabled so the request
            matches what is stored on your profile.
          </p>
        </StandardFormProvider>

        {hasSavedCertifications ? (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div className="space-y-1">
                <p className="font-medium text-foreground">
                  Saved certifications ready for review
                </p>
                <p className="text-muted-foreground">
                  {savedCertifications.length} certification
                  {savedCertifications.length === 1 ? "" : "s"} currently saved
                  on your coach profile.
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function BlockedVerificationCard(props: {
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-6">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
        <div className="space-y-1">
          <p className="font-medium text-foreground">{props.title}</p>
          <p className="text-sm text-muted-foreground">{props.description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function VerificationStatusCard(props: {
  badgeVariant: "success" | "outline";
  badgeLabel: string;
  icon: ReactNode;
  title: string;
  description: string;
  body: string;
}) {
  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="border-b">
        <div className="space-y-2">
          <Badge variant={props.badgeVariant}>{props.badgeLabel}</Badge>
          <CardTitle className="font-heading text-2xl">{props.title}</CardTitle>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            {props.description}
          </p>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex items-start gap-3 rounded-xl border border-border/80 bg-muted/30 p-4 text-sm">
          {props.icon}
          <div className="space-y-1">
            <p className="font-medium text-foreground">{props.title}</p>
            <p className="text-muted-foreground">{props.body}</p>
          </div>
          {props.badgeVariant === "success" ? (
            <BadgeCheck className="ml-auto h-5 w-5 shrink-0 text-primary" />
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function VerifyStepSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-10 w-56" />
    </div>
  );
}
