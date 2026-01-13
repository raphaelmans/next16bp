"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { useLogout, useSession } from "@/features/auth";
import { OwnerNavbar, OwnerSidebar } from "@/features/owner";
import {
  BulkSlotModal,
  CourtForm,
  CourtHoursEditor,
  CourtPricingEditor,
  ReservationAlertsPanel,
} from "@/features/owner/components";
import {
  useCourtForm,
  useCourtHours,
  useCourtRateRules,
  useCreateBulkSlots,
  useOwnerOrganization,
} from "@/features/owner/hooks";
import type { CourtFormData } from "@/features/owner/schemas/court-form.schema";
import { AppShell } from "@/shared/components/layout";
import { appRoutes } from "@/shared/lib/app-routes";
import { useTRPC } from "@/trpc/client";

const steps = [
  { key: "details", label: "Details" },
  { key: "hours", label: "Hours" },
  { key: "pricing", label: "Pricing" },
  { key: "publish", label: "Publish" },
] as const;

type StepKey = (typeof steps)[number]["key"];

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
  const courtId = params.courtId as string;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const trpc = useTRPC();

  const { data: user } = useSession();
  const logoutMutation = useLogout();
  const {
    organization,
    organizations,
    isLoading: orgLoading,
  } = useOwnerOrganization();

  const { data: courtData, isLoading: courtLoading } = useQuery({
    ...trpc.courtManagement.getById.queryOptions({ courtId }),
    enabled: !!courtId,
  });

  const { data: placeData, isLoading: placeLoading } = useQuery({
    ...trpc.placeManagement.getById.queryOptions({ placeId }),
    enabled: !!placeId,
  });

  const { data: sports = [], isLoading: sportsLoading } = useQuery(
    trpc.sport.list.queryOptions({}),
  );

  const { data: hours = [], isLoading: hoursLoading } = useCourtHours(courtId);
  const { data: pricingRules = [], isLoading: pricingLoading } =
    useCourtRateRules(courtId);
  const createBulkSlots = useCreateBulkSlots(courtId);

  const [bulkModalOpen, setBulkModalOpen] = React.useState(false);
  const [detailsDraft, setDetailsDraft] = React.useState<
    Partial<CourtFormData>
  >({});

  const stepParam = searchParams.get("step") as StepKey | null;

  const goToStep = (step: StepKey) => {
    router.push(`${pathname}?step=${step}`);
  };

  const { submit, isSubmitting } = useCourtForm({
    courtId,
    onSuccess: () => {
      toast.success("Court details saved");
      goToStep("hours");
    },
  });

  const defaultValues = React.useMemo<Partial<CourtFormData>>(() => {
    if (!courtData) return {};
    return {
      placeId: courtData.court.placeId,
      sportId: courtData.sport.id,
      label: courtData.court.label,
      tierLabel: courtData.court.tierLabel ?? "",
      isActive: courtData.court.isActive,
    };
  }, [courtData]);

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
  const hoursHref = appRoutes.owner.places.courts.hours(placeId, courtId);
  const pricingHref = appRoutes.owner.places.courts.pricing(placeId, courtId);

  const hasExplicitStep = steps.some((step) => step.key === stepParam);
  const defaultStep: StepKey = isPrereqsLoading
    ? "details"
    : !hasHours
      ? "hours"
      : !hasPricingRules
        ? "pricing"
        : "publish";
  const currentStep = hasExplicitStep ? (stepParam as StepKey) : defaultStep;
  const stepIndex = steps.findIndex((step) => step.key === currentStep);

  const backHref =
    currentStep === "details"
      ? appRoutes.owner.places.courts.base(placeId)
      : `${pathname}?step=${steps[Math.max(stepIndex - 1, 0)].key}`;

  React.useEffect(() => {
    if (hasExplicitStep || isPrereqsLoading) return;
    router.replace(`${pathname}?step=${defaultStep}`);
  }, [defaultStep, hasExplicitStep, isPrereqsLoading, pathname, router]);

  const handleDetailsSubmit = (data: CourtFormData) => {
    if (!isDetailsDirty) {
      goToStep("hours");
      return;
    }
    submit(data);
  };

  const handleBulkCreate = (
    data: Parameters<typeof createBulkSlots.mutate>[0],
  ) => {
    createBulkSlots.mutate(data, {
      onSuccess: (result) => {
        const message = result.wasTrimmed
          ? `Created ${result.slotsCreated} slots (trimmed from ${result.totalGenerated})`
          : `Created ${result.slotsCreated} slots successfully`;
        toast.success(message);
        setBulkModalOpen(false);
      },
      onError: (error) => {
        const appCode = (error as { data?: { code?: string } } | null)?.data
          ?.code;

        if (appCode === "SLOT_PRICING_UNAVAILABLE") {
          toast.error(
            "Pricing rules don’t cover the selected time range. Update Pricing Rules and try again.",
          );
          return;
        }

        toast.error(error?.message ?? "Failed to create slots");
      },
    });
  };

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = appRoutes.login.from(
      appRoutes.owner.places.courts.setup(placeId, courtId),
    );
  };

  if (orgLoading || courtLoading || placeLoading || sportsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!courtData || !placeData) {
    router.push(appRoutes.owner.places.courts.base(placeId));
    return null;
  }

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
        <ReservationAlertsPanel organizationId={organization?.id ?? null} />
      }
    >
      <div className="space-y-6">
        <PageHeader
          title={`Court Setup · ${courtData.court.label}`}
          description="Configure details, hours, pricing, and publishing in one flow"
          breadcrumbs={[
            { label: "My Places", href: appRoutes.owner.places.base },
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
            {steps.map((step, index) => {
              const state =
                index === stepIndex
                  ? "bg-primary text-primary-foreground"
                  : index < stepIndex
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground";
              return (
                <div key={step.key} className="flex items-center gap-2">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${state}`}
                  >
                    {index + 1}
                  </div>
                  <span className="font-medium text-muted-foreground">
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
          <span className="ml-auto text-sm text-muted-foreground">
            Step {stepIndex + 1} of {steps.length} · {steps[stepIndex].label}
          </span>
        </div>

        {currentStep === "details" && (
          <CourtForm
            defaultValues={defaultValues}
            placeOptions={placeOptions}
            sportOptions={sportOptions}
            onSubmit={handleDetailsSubmit}
            onCancel={() =>
              router.push(appRoutes.owner.places.courts.base(placeId))
            }
            isSubmitting={isSubmitting}
            isEditing
            disablePlaceSelect
            primaryActionLabel="Save & Continue"
            showCancel={false}
            onStateChange={setDetailsDraft}
          />
        )}

        {currentStep === "hours" && (
          <div className="space-y-4">
            <CourtHoursEditor
              courtId={courtId}
              organizationId={organization?.id ?? null}
              primaryActionLabel="Save & Continue"
              onSaved={() => goToStep("pricing")}
            />
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => goToStep("details")}>
                Back to Details
              </Button>
              <Button variant="ghost" onClick={() => goToStep("pricing")}>
                Skip for now
              </Button>
            </div>
          </div>
        )}

        {currentStep === "pricing" && (
          <div className="space-y-4">
            <CourtPricingEditor
              courtId={courtId}
              organizationId={organization?.id ?? null}
              primaryActionLabel="Save & Continue"
              onSaved={() => goToStep("publish")}
            />
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => goToStep("hours")}>
                Back to Hours
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
              <div className="space-y-3">
                {!hasHours && (
                  <Alert variant="destructive">
                    <AlertTitle>Set court hours</AlertTitle>
                    <AlertDescription>
                      <div className="flex flex-wrap items-center gap-2">
                        Hours are required before publishing slots.
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => goToStep("hours")}
                        >
                          Configure hours
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
                {!hasPricingRules && (
                  <Alert variant="destructive">
                    <AlertTitle>Set pricing rules</AlertTitle>
                    <AlertDescription>
                      <div className="flex flex-wrap items-center gap-2">
                        Pricing rules are required before publishing slots.
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => goToStep("pricing")}
                        >
                          Configure pricing
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
                {hasHours && hasPricingRules && (
                  <Alert>
                    <AlertTitle>Ready to publish</AlertTitle>
                    <AlertDescription>
                      Slot prices are derived from pricing rules. Set hourly
                      rate to 0 for free slots.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => setBulkModalOpen(true)}
                disabled={!hasHours || !hasPricingRules || isPrereqsLoading}
              >
                Publish slots now
              </Button>
              <Button asChild variant="outline">
                <Link href={appRoutes.owner.courts.slots(courtId)}>
                  Manage slots page
                </Link>
              </Button>
              <Button variant="ghost" onClick={() => goToStep("pricing")}>
                Back to Pricing
              </Button>
            </div>
          </div>
        )}
      </div>

      <BulkSlotModal
        open={bulkModalOpen}
        onOpenChange={setBulkModalOpen}
        onSubmit={handleBulkCreate}
        isLoading={createBulkSlots.isPending}
        isPrereqsLoading={isPrereqsLoading}
        hasHours={hasHours}
        hasPricingRules={hasPricingRules}
        hoursWindows={hours}
        hoursHref={hoursHref}
        pricingHref={pricingHref}
        initialDate={new Date()}
      />
    </AppShell>
  );
}
