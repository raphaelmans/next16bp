"use client";

import { Calendar } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect } from "react";
import { appRoutes } from "@/common/app-routes";
import { trackEvent } from "@/common/clients/telemetry-client";
import { SETTINGS_SECTION_HASHES } from "@/common/section-hashes";
import { Container } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { PaymentMethodReminderCard } from "@/features/owner/components/payment-method-reminder-card";
import { useModOwnerInvalidation } from "@/features/owner/hooks";
import {
  useModGetStartedOverlays,
  useModGetStartedSetup,
} from "./get-started-hooks";
import { AddVenueSheet } from "./overlays/add-venue-sheet";
import { ClaimSearchDialog } from "./overlays/claim-search-dialog";
import { ConfigureCourtsSheet } from "./overlays/configure-courts-sheet";
import { CreateOrgDialog } from "./overlays/create-org-dialog";
import { ImportBookingsSheet } from "./overlays/import-bookings-sheet";
import { VerifyVenueSheet } from "./overlays/verify-venue-sheet";
import { AddVenueCard } from "./sections/add-venue-card";
import { ClaimListingCard } from "./sections/claim-listing-card";
import { ConfigureCourtsCard } from "./sections/configure-courts-card";
import { CreateOrgCard } from "./sections/create-org-card";
import { ImportBookingsCard } from "./sections/import-bookings-card";
import { SetupCompleteBanner } from "./sections/setup-complete-banner";
import { SetupErrorBanner } from "./sections/setup-error-banner";
import { SetupHelpCard } from "./sections/setup-help-card";
import { SetupProgressBadges } from "./sections/setup-progress-badges";
import { SetupStaleBanner } from "./sections/setup-stale-banner";
import { VerifyVenueCard } from "./sections/verify-venue-card";

export function GetStartedView() {
  const { status, isLoading, isFetching, error, refetch, raw } =
    useModGetStartedSetup();
  const overlays = useModGetStartedOverlays();
  const { invalidateOwnerSetupStatus } = useModOwnerInvalidation();

  useEffect(() => {
    trackEvent({ event: "funnel.owner_setup_hub_viewed" });
  }, []);

  const handleOverlaySuccess = useCallback(() => {
    overlays.closeOverlay();
    void invalidateOwnerSetupStatus();
  }, [overlays, invalidateOwnerSetupStatus]);

  const handleOrgCreated = useCallback(() => {
    overlays.closeOverlay();
    trackEvent({ event: "funnel.owner_org_created" });
    void invalidateOwnerSetupStatus();
  }, [overlays, invalidateOwnerSetupStatus]);

  const handleOverlayOpenChange = useCallback(
    (open: boolean) => {
      if (!open) overlays.closeOverlay();
    },
    [overlays],
  );

  if (error && !raw) {
    return (
      <SetupErrorBanner
        error={error}
        isFetching={isFetching}
        onRetry={() => void refetch()}
      />
    );
  }

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

          {error && raw && (
            <SetupStaleBanner
              isFetching={isFetching}
              onRefresh={() => void refetch()}
            />
          )}

          <SetupProgressBadges
            hasOrganization={status.hasOrganization}
            hasVenue={status.hasVenue}
            hasPendingClaim={status.hasPendingClaim}
            hasVerification={status.hasVerification}
            hasReadyCourt={status.hasReadyCourt}
            hasPaymentMethod={status.hasPaymentMethod}
          />

          {status.isSetupComplete && status.isVenueVerified && (
            <SetupCompleteBanner />
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <CreateOrgCard
                hasOrganization={status.hasOrganization}
                isLoading={isLoading}
                organization={status.organization ?? undefined}
                onCreateClick={() => overlays.openOverlay("org")}
              />

              <AddVenueCard
                hasOrganization={status.hasOrganization}
                hasVenue={status.hasVenue}
                onAddClick={() => {
                  trackEvent({ event: "funnel.owner_add_venue_clicked" });
                  overlays.openOverlay("venue");
                }}
              />

              <ClaimListingCard
                hasOrganization={status.hasOrganization}
                hasPendingClaim={status.hasPendingClaim}
                onSearchClick={() => overlays.openOverlay("claim")}
              />

              <ConfigureCourtsCard
                hasVenue={status.hasVenue}
                hasActiveCourt={status.hasActiveCourt}
                hasReadyCourt={status.hasReadyCourt}
                hasCourtSchedule={status.hasCourtSchedule}
                hasCourtPricing={status.hasCourtPricing}
                placeId={status.primaryPlaceId}
                courtId={status.readyCourtId ?? status.primaryCourtId}
                onConfigureClick={() => overlays.openOverlay("courts")}
              />

              {status.hasVenue && !status.hasPaymentMethod ? (
                <PaymentMethodReminderCard
                  title="Add a payment method"
                  description="Add at least one payment method so reservations can be enabled for public booking."
                  actionLabel="Manage payment methods"
                  actionHref={`${appRoutes.owner.settings}?from=setup${SETTINGS_SECTION_HASHES.paymentMethods}`}
                />
              ) : null}

              <VerifyVenueCard
                hasVenue={status.hasVenue}
                placeName={status.primaryPlaceName}
                verificationStatus={status.verificationStatus}
                onVerifyClick={() => overlays.openOverlay("verify")}
              />

              <ImportBookingsCard
                hasVenue={status.hasVenue}
                onImportClick={() => {
                  trackEvent({ event: "funnel.owner_import_started" });
                  overlays.openOverlay("import");
                }}
              />

              {status.hasVenue && (
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
              <SetupHelpCard />
            </div>
          </div>
        </div>
      </Container>

      <CreateOrgDialog
        open={overlays.activeOverlay === "org"}
        onOpenChange={handleOverlayOpenChange}
        onSuccess={handleOrgCreated}
      />
      <ClaimSearchDialog
        open={overlays.activeOverlay === "claim"}
        onOpenChange={handleOverlayOpenChange}
        organizationId={status.organizationId}
      />
      <AddVenueSheet
        open={overlays.activeOverlay === "venue"}
        onOpenChange={handleOverlayOpenChange}
        organizationId={status.organizationId}
        onSuccess={handleOverlaySuccess}
      />
      <ConfigureCourtsSheet
        open={overlays.activeOverlay === "courts"}
        onOpenChange={handleOverlayOpenChange}
        organizationId={status.organizationId}
        placeId={status.primaryPlaceId}
        onSuccess={handleOverlaySuccess}
      />
      <VerifyVenueSheet
        open={overlays.activeOverlay === "verify"}
        onOpenChange={handleOverlayOpenChange}
        placeId={status.primaryPlaceId}
        placeName={status.primaryPlaceName}
        onSuccess={handleOverlaySuccess}
      />
      <ImportBookingsSheet
        open={overlays.activeOverlay === "import"}
        onOpenChange={handleOverlayOpenChange}
        organizationId={status.organizationId}
        onSuccess={handleOverlaySuccess}
      />
    </div>
  );
}
