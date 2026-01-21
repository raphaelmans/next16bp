"use client";

import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";
import * as React from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { useLogout, useSession } from "@/features/auth";
import { OwnerNavbar, OwnerSidebar } from "@/features/owner";
import {
  CourtForm,
  CourtScheduleEditor,
  ReservationAlertsPanel,
} from "@/features/owner/components";
import {
  useCourtForm,
  useCourtHours,
  useCourtRateRules,
  useOwnerOrganization,
} from "@/features/owner/hooks";
import type { CourtFormData } from "@/features/owner/schemas/court-form.schema";
import { AppShell } from "@/shared/components/layout";
import { appRoutes } from "@/shared/lib/app-routes";
import { formatCurrency } from "@/shared/lib/format";
import { trpc } from "@/trpc/client";

const stepKeys = [
  "details",
  "schedule",
  "publish",
  "hours",
  "pricing",
] as const;

type StepParam = (typeof stepKeys)[number];
type StepKey = "details" | "schedule" | "publish";

const steps = [
  { key: "details", label: "Details" },
  { key: "schedule", label: "Schedule" },
  { key: "publish", label: "Publish" },
] as const;

const DAY_OPTIONS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
] as const;

const normalizeStep = (value?: StepParam | null): StepKey => {
  if (!value) return "details";
  if (value === "hours" || value === "pricing") return "schedule";
  return value;
};

const toTimeString = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};

const formatMinutesRange = (startMinute: number, endMinute: number) =>
  `${toTimeString(startMinute)} - ${toTimeString(endMinute)}`;

const normalizeCourtFormValue = (value?: string | null) =>
  value?.trim() ? value.trim() : "";

const normalizeTierLabel = (value?: string | null) =>
  value?.trim() ? value.trim() : "";

const hasSameCourtValues = (
  a: Partial<CourtFormData>,
  b: Partial<CourtFormData>,
) =>
  normalizeCourtFormValue(a.placeId) === normalizeCourtFormValue(b.placeId) &&
  normalizeCourtFormValue(a.sportId) === normalizeCourtFormValue(b.sportId) &&
  normalizeCourtFormValue(a.label) === normalizeCourtFormValue(b.label) &&
  normalizeTierLabel(a.tierLabel ?? "") ===
    normalizeTierLabel(b.tierLabel ?? "") &&
  (a.isActive ?? true) === (b.isActive ?? true);

export default function CourtSetupWizardPage() {
  const params = useParams();
  const placeId = params.placeId as string;
  const router = useRouter();

  const [courtIdParam, setCourtIdParam] = useQueryState(
    "courtId",
    parseAsString.withOptions({ history: "push" }),
  );
  const [step, setStep] = useQueryState(
    "step",
    parseAsStringLiteral(stepKeys)
      .withDefault("details")
      .withOptions({ history: "push" }),
  );

  const courtId = courtIdParam ?? "";
  const currentStep = courtIdParam ? normalizeStep(step) : "details";
  const stepIndex = Math.max(
    steps.findIndex((current) => current.key === currentStep),
    0,
  );

  const { data: user } = useSession();
  const logoutMutation = useLogout();
  const {
    organization,
    organizations,
    isLoading: orgLoading,
  } = useOwnerOrganization();

  const { data: placeData, isLoading: placeLoading } =
    trpc.placeManagement.getById.useQuery({ placeId }, { enabled: !!placeId });

  const { data: courtData, isLoading: courtLoading } =
    trpc.courtManagement.getById.useQuery(
      { courtId },
      { enabled: !!courtIdParam },
    );

  const { data: sports = [], isLoading: sportsLoading } =
    trpc.sport.list.useQuery({});
  const { data: hours = [], isLoading: hoursLoading } = useCourtHours(courtId);
  const { data: pricingRules = [], isLoading: pricingLoading } =
    useCourtRateRules(courtId);

  const [detailsDraft, setDetailsDraft] = React.useState<
    Partial<CourtFormData>
  >({});

  React.useEffect(() => {
    if (!courtIdParam && step !== "details") {
      setStep("details");
    }
  }, [courtIdParam, setStep, step]);

  React.useEffect(() => {
    if (!courtIdParam) return;
    if (step === "hours" || step === "pricing") {
      setStep("schedule");
    }
  }, [courtIdParam, setStep, step]);

  React.useEffect(() => {
    if (courtData && courtData.court.placeId !== placeId) {
      setCourtIdParam(null);
      setStep("details");
    }
  }, [courtData, placeId, setCourtIdParam, setStep]);

  const { submitAsync, isSubmitting } = useCourtForm({
    courtId: courtIdParam ?? undefined,
    onSuccess: (result) => {
      if (!courtIdParam) {
        toast.success("Court created successfully!");
        setCourtIdParam(result.courtId);
        setStep("schedule");
        return;
      }
      toast.success("Court details saved");
      setStep("schedule");
    },
  });

  const defaultValues = React.useMemo<Partial<CourtFormData>>(() => {
    if (!courtData) return {};
    return {
      placeId: courtData.court.placeId ?? placeId,
      sportId: courtData.sport.id,
      label: courtData.court.label,
      tierLabel: courtData.court.tierLabel ?? "",
      isActive: courtData.court.isActive,
    };
  }, [courtData, placeId]);

  React.useEffect(() => {
    if (!courtData) return;
    setDetailsDraft(defaultValues);
  }, [courtData, defaultValues]);

  const isDetailsDirty =
    detailsDraft && defaultValues
      ? !hasSameCourtValues(detailsDraft, defaultValues)
      : false;

  const placeOptions = placeData
    ? [
        {
          id: placeData.place.id,
          name: placeData.place.name,
          city: placeData.place.city,
        },
      ]
    : [];

  const sportOptions = sports.map((sport) => ({
    id: sport.id,
    name: sport.name,
  }));

  const isPrereqsLoading = hoursLoading || pricingLoading;
  const hasHours = !hoursLoading && hours.length > 0;
  const hasPricingRules = !pricingLoading && pricingRules.length > 0;

  const missingScheduleItems = [
    !hasHours ? "hours" : null,
    !hasPricingRules ? "pricing rules" : null,
  ].filter(Boolean);

  const missingScheduleLabel = missingScheduleItems.join(" and ");

  const scheduleSummary = React.useMemo(() => {
    return DAY_OPTIONS.map((day) => {
      const dayHours = hours
        .filter((window) => window.dayOfWeek === day.value)
        .sort((a, b) => a.startMinute - b.startMinute);
      const dayPricing = pricingRules
        .filter((rule) => rule.dayOfWeek === day.value)
        .sort((a, b) => a.startMinute - b.startMinute);

      const hoursRanges = dayHours.map((window) =>
        formatMinutesRange(window.startMinute, window.endMinute),
      );
      const pricingRanges = dayPricing.map(
        (rule) =>
          `${formatMinutesRange(rule.startMinute, rule.endMinute)} · ${formatCurrency(
            rule.hourlyRateCents,
            rule.currency,
          )}/hr`,
      );

      return {
        ...day,
        hoursRanges,
        pricingRanges,
      };
    });
  }, [hours, pricingRules]);

  const backHref =
    !courtIdParam || currentStep === "details"
      ? appRoutes.owner.places.courts.base(placeId)
      : appRoutes.owner.places.courts.setup(
          placeId,
          courtId,
          steps[Math.max(stepIndex - 1, 0)].key,
        );

  const goToStep = (nextStep: StepKey) => {
    if (!courtIdParam) return;
    setStep(nextStep);
  };

  const handleCreateSubmit = async (data: CourtFormData) => {
    await submitAsync(data);
  };

  const handleDetailsSubmit = async (data: CourtFormData) => {
    if (!courtIdParam) {
      await handleCreateSubmit(data);
      return;
    }
    if (!isDetailsDirty) {
      goToStep("schedule");
      return;
    }
    await submitAsync(data);
  };

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    const redirectPath = courtIdParam
      ? appRoutes.owner.places.courts.setup(placeId, courtId, currentStep)
      : appRoutes.owner.places.courts.setupCreate(placeId);
    window.location.href = appRoutes.login.from(redirectPath);
  };

  const handleCancel = () => {
    router.push(appRoutes.owner.places.courts.base(placeId));
  };

  const isLoading =
    orgLoading ||
    placeLoading ||
    sportsLoading ||
    (courtIdParam ? courtLoading : false);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!placeData) {
    router.push(appRoutes.owner.places.base);
    return null;
  }

  if (courtIdParam && !courtData) {
    router.push(appRoutes.owner.places.courts.base(placeId));
    return null;
  }

  const headerTitle = courtIdParam
    ? `Court Setup · ${courtData?.court.label ?? "Court"}`
    : `Court Setup · ${placeData.place.name}`;

  return (
    <AppShell
      sidebar={
        <OwnerSidebar
          currentOrganization={
            organization ?? { id: "", name: "No Organization" }
          }
          organizations={organizations}
          user={{
            name: user?.email?.split("@")[0],
            email: user?.email,
          }}
        />
      }
      navbar={
        <OwnerNavbar
          organizationName={organization?.name ?? "No Organization"}
          user={{
            name: user?.email?.split("@")[0],
            email: user?.email,
          }}
          onLogout={handleLogout}
        />
      }
      floatingPanel={
        <ReservationAlertsPanel
          organizationId={organization?.id ?? null}
          syncToUrl={false}
        />
      }
    >
      <div className="space-y-6">
        <PageHeader
          title={headerTitle}
          description="Configure details, schedule, and publishing in one flow"
          breadcrumbs={[
            { label: "My Venues", href: appRoutes.owner.places.base },
            {
              label: placeData.place.name,
              href: appRoutes.owner.places.courts.base(placeId),
            },
            { label: "Setup" },
          ]}
          backHref={appRoutes.owner.places.courts.base(placeId)}
        />

        <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/40 p-4">
          <Button asChild variant="ghost" className="gap-2">
            <Link href={backHref}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {steps.map((stepItem, index) => {
              const state =
                index === stepIndex
                  ? "bg-primary text-primary-foreground"
                  : index < stepIndex
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground";
              return (
                <div key={stepItem.key} className="flex items-center gap-2">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${state}`}
                  >
                    {index + 1}
                  </div>
                  <span className="font-medium text-muted-foreground">
                    {stepItem.label}
                  </span>
                </div>
              );
            })}
          </div>
          <span className="ml-auto text-sm text-muted-foreground">
            Step {stepIndex + 1} of {steps.length} · {steps[stepIndex].label}
          </span>
        </div>

        {!courtIdParam ? (
          <CourtForm
            defaultValues={{ placeId }}
            placeOptions={placeOptions}
            sportOptions={sportOptions}
            onSubmit={handleCreateSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
            disablePlaceSelect
            primaryActionLabel="Create & Continue"
          />
        ) : (
          <>
            {currentStep === "details" && (
              <CourtForm
                defaultValues={defaultValues}
                placeOptions={placeOptions}
                sportOptions={sportOptions}
                onSubmit={handleDetailsSubmit}
                onCancel={handleCancel}
                isSubmitting={isSubmitting}
                isEditing
                allowPristineSubmit
                onStateChange={setDetailsDraft}
              />
            )}

            {currentStep === "schedule" && (
              <div className="space-y-4">
                <CourtScheduleEditor
                  courtId={courtId}
                  organizationId={organization?.id ?? null}
                  timeZone={placeData.place.timeZone}
                  primaryActionLabel="Save & Continue"
                  onSaved={() => goToStep("publish")}
                />
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => goToStep("details")}>
                    Back to Details
                  </Button>
                  <Button variant="ghost" onClick={() => goToStep("publish")}>
                    Skip for now
                  </Button>
                </div>
              </div>
            )}

            {currentStep === "publish" && (
              <div className="space-y-6">
                {isPrereqsLoading ? (
                  <div className="flex min-h-[120px] items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(!hasHours || !hasPricingRules) && (
                      <Alert variant="destructive">
                        <AlertTitle>Complete schedule</AlertTitle>
                        <AlertDescription>
                          <div className="flex flex-wrap items-center gap-2">
                            Add {missingScheduleLabel} to publish slots.
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => goToStep("schedule")}
                            >
                              Configure schedule
                            </Button>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                      <Card>
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold">
                              Schedule & pricing
                            </p>
                            <span className="text-xs text-muted-foreground">
                              {placeData.place.timeZone}
                            </span>
                          </div>
                          <div className="space-y-3">
                            {scheduleSummary.map((day) => (
                              <div
                                key={day.value}
                                className="rounded-md border px-3 py-2"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <span className="text-sm font-medium">
                                    {day.label}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {day.hoursRanges.length} hour blocks ·{" "}
                                    {day.pricingRanges.length} pricing blocks
                                  </span>
                                </div>
                                <div className="mt-2 space-y-2">
                                  <div>
                                    <p className="text-xs uppercase text-muted-foreground">
                                      Hours
                                    </p>
                                    {day.hoursRanges.length > 0 ? (
                                      <p className="text-sm">
                                        {day.hoursRanges.join(", ")}
                                      </p>
                                    ) : (
                                      <p className="text-xs text-muted-foreground">
                                        No hours set
                                      </p>
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-xs uppercase text-muted-foreground">
                                      Pricing
                                    </p>
                                    {day.pricingRanges.length > 0 ? (
                                      <ul className="space-y-1 text-sm">
                                        {day.pricingRanges.map(
                                          (range, index) => (
                                            <li
                                              key={`${day.value}-${index}`}
                                              className="text-muted-foreground"
                                            >
                                              {range}
                                            </li>
                                          ),
                                        )}
                                      </ul>
                                    ) : (
                                      <p className="text-xs text-muted-foreground">
                                        No pricing rules
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold">
                              Court details
                            </p>
                            <Badge
                              variant={
                                courtData?.court.isActive
                                  ? "success"
                                  : "secondary"
                              }
                            >
                              {courtData?.court.isActive
                                ? "Active"
                                : "Inactive"}
                            </Badge>
                          </div>
                          <div className="space-y-3 text-sm">
                            <div className="space-y-1">
                              <span className="text-xs uppercase text-muted-foreground">
                                Court
                              </span>
                              <p className="font-medium">
                                {courtData?.court.label ?? "—"}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <span className="text-xs uppercase text-muted-foreground">
                                Sport
                              </span>
                              <p className="font-medium">
                                {courtData?.sport.name ?? "—"}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <span className="text-xs uppercase text-muted-foreground">
                                Tier
                              </span>
                              <p className="font-medium">
                                {courtData?.court.tierLabel?.trim() || "—"}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <span className="text-xs uppercase text-muted-foreground">
                                Venue
                              </span>
                              <p className="font-medium">
                                {placeData.place.name}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <span className="text-xs uppercase text-muted-foreground">
                                Time zone
                              </span>
                              <p className="font-medium">
                                {placeData.place.timeZone}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Button variant="ghost" onClick={() => goToStep("schedule")}>
                    Back to Schedule
                  </Button>
                  <Button
                    asChild
                    className="w-full sm:w-auto"
                    disabled={isPrereqsLoading}
                  >
                    <Link href={appRoutes.owner.courts.slots(courtId)}>
                      Go to Manage Slots
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
