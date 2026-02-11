"use client";

import {
  ArrowRight,
  Building2,
  Calendar,
  Check,
  CheckCircle,
  ClipboardList,
  FileSpreadsheet,
  HelpCircle,
  Loader2,
  MapPin,
  PartyPopper,
  Search,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { appRoutes } from "@/common/app-routes";
import { trackEvent } from "@/common/clients/telemetry-client";
import { getClientErrorMessage } from "@/common/hooks/toast-errors";
import { Container } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { OrganizationForm } from "@/features/organization/components/organization-form";
import { useOwnerSetupStatus } from "@/features/owner/hooks";
import { SupportChatSheet } from "@/features/support-chat/components/support-chat-sheet";
import { trpc } from "@/trpc/client";

export default function OwnerGetStartedPage() {
  const router = useRouter();
  const [showOrgForm, setShowOrgForm] = useState(false);
  const [showClaimSearch, setShowClaimSearch] = useState(false);
  const [claimSearchQuery, setClaimSearchQuery] = useState("");

  const utils = trpc.useUtils();
  const { data: setupStatus, isLoading: setupLoading } = useOwnerSetupStatus();

  const organization = setupStatus?.organization ?? null;
  const organizationId = organization?.id;
  const primaryPlaceId = setupStatus?.primaryPlace?.id;
  const primaryPlaceName = setupStatus?.primaryPlace?.name ?? "your venue";
  const verificationStatus = setupStatus?.verificationStatus ?? null;
  const isVenueVerified = verificationStatus === "VERIFIED";
  const hasOrganization = setupStatus?.hasOrganization ?? false;
  const hasPendingClaim = setupStatus?.hasPendingClaim ?? false;
  const hasVenue = setupStatus?.hasVenue ?? false;
  const hasVerification = setupStatus?.hasVerification ?? false;
  const hasActiveCourt = setupStatus?.hasActiveCourt ?? false;
  const hasReadyCourt = setupStatus?.hasReadyCourt ?? false;
  const hasCourtSchedule = setupStatus?.hasCourtSchedule ?? false;
  const hasCourtPricing = setupStatus?.hasCourtPricing ?? false;
  const primaryCourtId = setupStatus?.primaryCourtId ?? undefined;
  const readyCourtId = setupStatus?.readyCourtId ?? undefined;
  const isSetupComplete = setupStatus?.isSetupComplete ?? false;

  useEffect(() => {
    trackEvent({ event: "funnel.owner_setup_hub_viewed" });
  }, []);

  const handleOrgCreated = () => {
    setShowOrgForm(false);
    trackEvent({ event: "funnel.owner_org_created" });
    utils.ownerSetup.getStatus.invalidate();
  };

  const handleAddVenue = () => {
    trackEvent({ event: "funnel.owner_add_venue_clicked" });
    router.push(`${appRoutes.owner.places.new}?from=setup`);
  };

  const handleVerifyVenue = () => {
    if (!primaryPlaceId) return;
    router.push(
      `${appRoutes.owner.verification.place(primaryPlaceId)}?from=setup`,
    );
  };

  const handleConfigureCourts = () => {
    if (!primaryPlaceId) return;
    router.push(
      `${appRoutes.owner.places.courts.setupCreate(primaryPlaceId)}?from=setup`,
    );
  };

  const handleStartImport = () => {
    trackEvent({ event: "funnel.owner_import_started" });
    router.push(`${appRoutes.owner.imports.bookings}?from=setup`);
  };

  return (
    <div className="py-8">
      <Container size="xl">
        <div className="space-y-8">
          <div className="space-y-2">
            <h1 className="text-2xl font-heading font-bold tracking-tight sm:text-3xl">
              Owner Setup
            </h1>
            <p className="text-muted-foreground">
              Complete these steps to start accepting bookings on KudosCourts.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant={hasOrganization ? "default" : "secondary"}>
              {hasOrganization ? (
                <Check className="mr-1 h-3 w-3" />
              ) : (
                <span className="mr-1">1.</span>
              )}
              Organization
            </Badge>
            <Badge
              variant={hasVenue || hasPendingClaim ? "default" : "secondary"}
            >
              {hasVenue || hasPendingClaim ? (
                <Check className="mr-1 h-3 w-3" />
              ) : (
                <span className="mr-1">2.</span>
              )}
              Venue
            </Badge>
            <Badge variant={hasVerification ? "default" : "secondary"}>
              {hasVerification ? (
                <Check className="mr-1 h-3 w-3" />
              ) : (
                <span className="mr-1">3.</span>
              )}
              Verify
            </Badge>
            <Badge variant={hasReadyCourt ? "default" : "secondary"}>
              {hasReadyCourt ? (
                <Check className="mr-1 h-3 w-3" />
              ) : (
                <span className="mr-1">4.</span>
              )}
              Go Live
            </Badge>
          </div>

          {isSetupComplete && isVenueVerified && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <PartyPopper className="h-6 w-6" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="font-heading font-semibold">
                      You&apos;re all set!
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Your venue is verified and confirmed to accept bookings on
                      KudosCourts.
                    </p>
                  </div>
                  <Button asChild>
                    <Link href={appRoutes.owner.places.base}>
                      Go to your venues
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <CreateOrgCard
                hasOrganization={hasOrganization}
                isLoading={setupLoading}
                organization={organization ?? undefined}
                onCreateClick={() => setShowOrgForm(true)}
              />

              <AddVenueCard
                hasOrganization={hasOrganization}
                hasVenue={hasVenue}
                onAddClick={handleAddVenue}
              />

              <ClaimListingCard
                hasOrganization={hasOrganization}
                hasPendingClaim={hasPendingClaim}
                onSearchClick={() => setShowClaimSearch(true)}
              />

              <ConfigureVenueCourtsCard
                hasVenue={hasVenue}
                hasActiveCourt={hasActiveCourt}
                hasReadyCourt={hasReadyCourt}
                hasCourtSchedule={hasCourtSchedule}
                hasCourtPricing={hasCourtPricing}
                placeId={primaryPlaceId}
                courtId={readyCourtId ?? primaryCourtId}
                onConfigureClick={handleConfigureCourts}
              />

              <VerifyVenueCard
                hasVenue={hasVenue}
                placeName={primaryPlaceName}
                verificationStatus={verificationStatus}
                onVerifyClick={handleVerifyVenue}
              />

              <ImportBookingsCard
                hasVenue={hasVenue}
                onImportClick={handleStartImport}
              />

              {hasVenue && (
                <div className="flex">
                  <Button variant="outline" asChild>
                    <Link href={appRoutes.owner.bookings}>
                      <Calendar className="mr-2 h-4 w-4" />
                      View bookings
                    </Link>
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <HelpCircle className="h-4 w-4" />
                    Help
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <p className="font-medium">What is verification?</p>
                    <p className="text-muted-foreground">
                      Upload proof of ownership to get a verified badge and
                      unlock online reservations.
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <p className="font-medium">Import limitations</p>
                    <p className="text-muted-foreground">
                      Import supports ICS, CSV, and XLSX files. Screenshots are
                      not currently supported.
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <p className="font-medium">Need help?</p>
                    <Link
                      href={appRoutes.contactUs.base}
                      className="text-primary hover:underline"
                    >
                      Contact support
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </Container>

      <Dialog open={showOrgForm} onOpenChange={setShowOrgForm}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="sr-only">
            <DialogTitle>Create Organization</DialogTitle>
            <DialogDescription>
              Set up your organization to start listing courts.
            </DialogDescription>
          </DialogHeader>
          <OrganizationForm
            onSuccess={handleOrgCreated}
            onCancel={() => setShowOrgForm(false)}
          />
        </DialogContent>
      </Dialog>

      <ClaimSearchDialog
        open={showClaimSearch}
        onOpenChange={setShowClaimSearch}
        organizationId={organizationId}
        searchQuery={claimSearchQuery}
        onSearchQueryChange={setClaimSearchQuery}
      />
    </div>
  );
}

function CreateOrgCard({
  hasOrganization,
  isLoading,
  organization,
  onCreateClick,
}: {
  hasOrganization: boolean;
  isLoading: boolean;
  organization?: { id: string; name: string };
  onCreateClick: () => void;
}) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-muted animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-5 w-32 bg-muted rounded animate-pulse" />
              <div className="h-4 w-48 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (hasOrganization) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <p className="font-heading font-semibold">
                  Organization created
                </p>
                <Badge variant="outline" className="text-xs">
                  Complete
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {organization?.name}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Building2 className="h-6 w-6" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-heading font-semibold">
                  Create organization
                </p>
                <Badge>Required</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Set up your club, sports center, or facility profile.
              </p>
            </div>
            <Button onClick={onCreateClick}>
              Create organization
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AddVenueCard({
  hasOrganization,
  hasVenue,
  onAddClick,
}: {
  hasOrganization: boolean;
  hasVenue: boolean;
  onAddClick: () => void;
}) {
  if (hasVenue) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <p className="font-heading font-semibold">Venue added</p>
                <Badge variant="outline" className="text-xs">
                  Complete
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Next, submit verification to unlock bookings. You can add more
                venues from your dashboard.
              </p>
              <div className="pt-2">
                <Button variant="outline" asChild>
                  <Link href={appRoutes.owner.places.base}>View venues</Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={!hasOrganization ? "opacity-60" : ""}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <MapPin className="h-6 w-6" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-heading font-semibold">Add new venue</p>
                <Badge>Required</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Create a new venue listing with name, address, and contact info.
              </p>
            </div>
            <Button
              onClick={onAddClick}
              disabled={!hasOrganization}
              variant="outline"
            >
              Add venue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ClaimListingCard({
  hasOrganization,
  hasPendingClaim,
  onSearchClick,
}: {
  hasOrganization: boolean;
  hasPendingClaim: boolean;
  onSearchClick: () => void;
}) {
  const { data: myClaims } = trpc.claimRequest.getMy.useQuery(undefined, {
    enabled: hasPendingClaim,
  });

  const pendingClaimId =
    myClaims?.find((c) => c.status === "PENDING" && c.requestType === "CLAIM")
      ?.id ?? null;

  if (hasPendingClaim) {
    return (
      <Card className="border-yellow-500/20 bg-yellow-50/50 dark:bg-yellow-950/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-yellow-500/10 text-yellow-600">
              <Search className="h-6 w-6" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <p className="font-heading font-semibold">Claim pending</p>
                <Badge variant="outline" className="text-xs text-yellow-600">
                  Under review
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Your claim request is being reviewed. We will notify you once it
                is approved.
              </p>
              {pendingClaimId ? (
                <div className="pt-2">
                  <SupportChatSheet
                    kind="claim"
                    requestId={pendingClaimId}
                    triggerLabel="Message admin"
                    triggerVariant="outline"
                    triggerSize="sm"
                  />
                </div>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={!hasOrganization ? "opacity-60" : ""}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
            <Search className="h-6 w-6" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-heading font-semibold">
                  Claim existing listing
                </p>
                <Badge variant="secondary">Optional</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                If your venue is already on KudosCourts, claim it to manage
                courts and enable bookings.
              </p>
            </div>
            <Button
              onClick={onSearchClick}
              disabled={!hasOrganization}
              variant="outline"
            >
              Find my venue
              <Search className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function VerifyVenueCard({
  hasVenue,
  placeName,
  verificationStatus,
  onVerifyClick,
}: {
  hasVenue: boolean;
  placeName: string;
  verificationStatus?: string | null;
  onVerifyClick: () => void;
}) {
  const isPending = verificationStatus === "PENDING";
  const isVerified = verificationStatus === "VERIFIED";
  const isRejected = verificationStatus === "REJECTED";

  if (isVerified) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <p className="font-heading font-semibold">Venue verified</p>
                <Badge variant="outline" className="text-xs">
                  Complete
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {placeName} is verified and confirmed for reservations.
              </p>
              <div className="pt-2">
                <Button variant="outline" onClick={onVerifyClick}>
                  View verification
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isPending) {
    return (
      <Card className="border-yellow-500/20 bg-yellow-50/50 dark:bg-yellow-950/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-yellow-500/10 text-yellow-600">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <p className="font-heading font-semibold">
                  Verification pending
                </p>
                <Badge variant="outline" className="text-xs text-yellow-600">
                  Under review
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                We are reviewing your documents for {placeName}.
              </p>
              <div className="pt-2">
                <Button variant="outline" onClick={onVerifyClick}>
                  View submission
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isRejected) {
    return (
      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <p className="font-heading font-semibold">
                  Verification needs updates
                </p>
                <Badge variant="outline" className="text-xs text-destructive">
                  Action needed
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Update your documents to verify {placeName}.
              </p>
              <div className="pt-2">
                <Button onClick={onVerifyClick}>Resubmit docs</Button>
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
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-heading font-semibold">
                  Get your venue verified
                </p>
                <Badge>Required</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Upload proof of ownership to unlock online reservations.
              </p>
            </div>
            <Button onClick={onVerifyClick} disabled={!hasVenue}>
              Submit verification
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ConfigureVenueCourtsCard({
  hasVenue,
  hasActiveCourt,
  hasReadyCourt,
  hasCourtSchedule,
  hasCourtPricing,
  placeId,
  courtId,
  onConfigureClick,
}: {
  hasVenue: boolean;
  hasActiveCourt: boolean;
  hasReadyCourt: boolean;
  hasCourtSchedule: boolean;
  hasCourtPricing: boolean;
  placeId?: string;
  courtId?: string;
  onConfigureClick: () => void;
}) {
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
                    <Button variant="outline" asChild>
                      <Link
                        href={`${appRoutes.owner.places.courts.base(placeId)}?from=setup`}
                        prefetch={false}
                      >
                        Manage courts
                      </Link>
                    </Button>
                    {courtId && (
                      <Button variant="outline" asChild>
                        <Link
                          href={`${appRoutes.owner.places.courts.availability(placeId, courtId)}?from=setup`}
                          prefetch={false}
                        >
                          Manage availability
                        </Link>
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
                    <Button variant="outline" asChild>
                      <Link href={appRoutes.owner.places.courts.base(placeId)}>
                        Manage courts
                      </Link>
                    </Button>
                    {courtId && (
                      <Button variant="outline" asChild>
                        <Link
                          href={appRoutes.owner.places.courts.schedule(
                            placeId,
                            courtId,
                          )}
                        >
                          Edit schedule & pricing
                        </Link>
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

function ImportBookingsCard({
  hasVenue,
  onImportClick,
}: {
  hasVenue: boolean;
  onImportClick: () => void;
}) {
  return (
    <Card className={!hasVenue ? "opacity-60" : ""}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
            <FileSpreadsheet className="h-6 w-6" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-heading font-semibold">Import bookings</p>
                <Badge variant="secondary">Optional</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Import existing bookings from ICS, CSV, or XLSX files to block
                availability. Bookings are only committed after review.
              </p>
            </div>
            <Button
              onClick={onImportClick}
              disabled={!hasVenue}
              variant="outline"
            >
              Start import
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ClaimSearchDialog({
  open,
  onOpenChange,
  organizationId,
  searchQuery,
  onSearchQueryChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId?: string;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
}) {
  const utils = trpc.useUtils();

  const { data: searchResults, isLoading: searching } =
    trpc.place.list.useQuery(
      {
        q: searchQuery,
        verificationTier: "curated",
        limit: 10,
      },
      {
        enabled: open && searchQuery.length >= 2,
      },
    );

  const submitClaimMutation = trpc.claimRequest.submitClaim.useMutation({
    onSuccess: () => {
      toast.success("Claim submitted", {
        description: "We will review your request and notify you.",
      });
      utils.claimRequest.getMy.invalidate();
      utils.ownerSetup.getStatus.invalidate();
      onOpenChange(false);
      trackEvent({ event: "funnel.owner_claim_submitted" });
    },
    onError: (error) => {
      toast.error("Unable to submit claim", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    },
  });

  const handleSubmitClaim = (placeId: string) => {
    if (!organizationId) return;
    submitClaimMutation.mutate({
      placeId,
      organizationId,
    });
  };

  const unclaimedResults =
    searchResults?.items?.filter((p) => !p.place.organizationId) ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] overflow-hidden sm:max-w-2xl lg:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Find your venue</DialogTitle>
          <DialogDescription>
            Search for your venue to claim ownership.
          </DialogDescription>
        </DialogHeader>
        <div className="flex min-h-0 flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by venue name..."
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              className="pl-10"
            />
          </div>

          {searchQuery.length >= 2 && (
            <ScrollArea className="h-[min(50dvh,24rem)] w-full rounded-md border">
              {searching ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : unclaimedResults.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">
                  No unclaimed venues found. Try a different search or add a new
                  venue instead.
                </p>
              ) : (
                <div className="space-y-2 p-2">
                  {unclaimedResults.map((item) => (
                    <div
                      key={item.place.id}
                      className="flex items-start justify-between gap-3 rounded-lg border p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium break-words">
                          {item.place.name}
                        </p>
                        <p className="text-sm text-muted-foreground break-words">
                          {item.place.city}, {item.place.province}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        className="shrink-0"
                        onClick={() => handleSubmitClaim(item.place.id)}
                        disabled={submitClaimMutation.isPending}
                      >
                        {submitClaimMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Claim"
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          )}

          {searchQuery.length < 2 && (
            <p className="text-center text-sm text-muted-foreground py-4">
              Enter at least 2 characters to search.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
