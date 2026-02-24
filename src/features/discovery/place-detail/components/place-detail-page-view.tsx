"use client";

import Link from "next/link";
import * as React from "react";
import { appRoutes } from "@/common/app-routes";
import { buildViberDeepLink, toDialablePhone } from "@/common/phone";
import { copyToClipboard } from "@/common/utils/clipboard";
import { Container } from "@/components/layout";
import { useQueryAuthSession } from "@/features/auth/hooks";
import { getPlaceVerificationDisplay } from "@/features/discovery/helpers";
import { useModPlaceDetail } from "@/features/discovery/hooks";
import { PlaceDetail } from "@/features/discovery/place-detail/components/place-detail";
import { PlaceDetailAmenitiesCard } from "@/features/discovery/place-detail/components/place-detail-amenities-card";
import { PlaceDetailContactCard } from "@/features/discovery/place-detail/components/place-detail-contact-card";
import { PlaceDetailCourtsCard } from "@/features/discovery/place-detail/components/place-detail-courts-card";
import { PlaceDetailBookingSection } from "@/features/discovery/place-detail/components/sections/place-detail-booking-section";
import { PlaceDetailListingHelpSection } from "@/features/discovery/place-detail/components/sections/place-detail-listing-help-section";
import { usePlaceDetailUiStore } from "@/features/discovery/place-detail/stores/place-detail-ui-store";

type PlaceDetailPageViewProps = {
  placeIdOrSlug: string;
};

export default function PlaceDetailPageView({
  placeIdOrSlug,
}: PlaceDetailPageViewProps) {
  const { data: session } = useQueryAuthSession();
  const isAuthenticated = !!session;

  const availabilitySectionRef = React.useRef<HTMLDivElement | null>(null);
  const setMobileSheetExpanded = usePlaceDetailUiStore(
    (s) => s.setMobileSheetExpanded,
  );
  const resetTransientUi = usePlaceDetailUiStore((s) => s.resetTransientUi);

  React.useEffect(() => {
    void placeIdOrSlug;
    resetTransientUi();
  }, [placeIdOrSlug, resetTransientUi]);

  const { data: place, isLoading } = useModPlaceDetail({ placeIdOrSlug });

  if (isLoading) {
    return <PlaceDetail.Skeleton />;
  }

  if (!place) {
    return (
      <Container className="py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Venue not found</h1>
          <p className="mt-2 text-muted-foreground">
            The venue you&apos;re looking for doesn&apos;t exist or has been
            removed.
          </p>
          <Link
            href={appRoutes.places.base}
            className="text-primary mt-4 inline-block hover:underline"
          >
            Browse all courts
          </Link>
        </div>
      </Container>
    );
  }

  const placeSlugOrId = place.slug ?? place.id ?? placeIdOrSlug;
  const analyticsPlaceId = place.id ?? placeIdOrSlug;

  const {
    isBookable,
    isCurated,
    showBooking,
    showVerificationBadge,
    showBookingVerificationUi,
    verificationMessage,
    verificationDescription,
    verificationStatusVariant,
  } = getPlaceVerificationDisplay({
    placeType: place.placeType,
    verificationStatus: place.verification?.status,
    reservationsEnabled: place.verification?.reservationsEnabled,
  });

  const hasCoordinates =
    typeof place.latitude === "number" &&
    Number.isFinite(place.latitude) &&
    typeof place.longitude === "number" &&
    Number.isFinite(place.longitude);
  const placeIdParam = place.extGPlaceId?.trim() ?? "";
  const mapQuery = `${place.name} ${place.address} ${place.city}`;
  const destinationParam = hasCoordinates
    ? `&destination=${place.latitude},${place.longitude}`
    : "";
  const directionsUrl = placeIdParam
    ? `https://www.google.com/maps/dir/?api=1${destinationParam}&destination_place_id=${encodeURIComponent(placeIdParam)}`
    : hasCoordinates
      ? `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;
  const openInMapsQuery = hasCoordinates
    ? `${place.latitude},${place.longitude}`
    : mapQuery;
  const openInMapsUrl = placeIdParam
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(openInMapsQuery)}&query_place_id=${encodeURIComponent(placeIdParam)}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(openInMapsQuery)}`;

  const contactDetail = place.contactDetail;
  const phoneNumber = contactDetail?.phoneNumber?.trim();
  const viberNumber = contactDetail?.viberInfo?.trim();
  const dialablePhone = phoneNumber ? toDialablePhone(phoneNumber) : "";
  const callHref = dialablePhone
    ? `tel:${dialablePhone}`
    : phoneNumber
      ? `tel:${phoneNumber}`
      : "";
  const hasCallCta = Boolean(callHref);
  const viberLink = viberNumber ? buildViberDeepLink(viberNumber) : "";
  const hasContactDetail = Boolean(
    contactDetail?.phoneNumber ||
      contactDetail?.websiteUrl ||
      contactDetail?.facebookUrl ||
      contactDetail?.instagramUrl ||
      contactDetail?.viberInfo ||
      contactDetail?.otherContactInfo,
  );

  const handleScrollToAvailability = (event?: React.MouseEvent) => {
    if (!isBookable) return;
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setMobileSheetExpanded(true);
      return;
    }
    const element = availabilitySectionRef.current;
    if (!element || typeof window === "undefined") return;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    element.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  return (
    <Container className="pt-4 sm:pt-6">
      <PlaceDetail.Hero
        place={place}
        showBooking={showBooking}
        showVerificationBadge={showVerificationBadge}
        isCurated={isCurated}
        directionsUrl={directionsUrl}
        hasCallCta={hasCallCta}
        callHref={callHref}
        onCheckAvailability={handleScrollToAvailability}
      />

      <div className="mt-4 grid gap-6 pb-[70vh] lg:mt-6 lg:grid-cols-3 lg:pb-24">
        {showBooking ? (
          <PlaceDetailBookingSection
            place={place}
            isAuthenticated={isAuthenticated}
            isBookable={isBookable}
            analyticsPlaceId={analyticsPlaceId}
            placeSlugOrId={placeSlugOrId}
            mapQuery={mapQuery}
            directionsUrl={directionsUrl}
            openInMapsUrl={openInMapsUrl}
            showBookingVerificationUi={showBookingVerificationUi}
            verificationMessage={verificationMessage}
            verificationDescription={verificationDescription}
            verificationStatusVariant={verificationStatusVariant}
            availabilitySectionRef={availabilitySectionRef}
          />
        ) : (
          <>
            <div className="space-y-6 lg:col-span-2">
              <PlaceDetailContactCard
                hasContactDetail={hasContactDetail}
                contactDetail={contactDetail}
                phoneNumber={phoneNumber}
                dialablePhone={dialablePhone}
                viberNumber={viberNumber}
                viberLink={viberLink}
                onCopyPhone={() => {
                  if (!phoneNumber) return;
                  copyToClipboard(phoneNumber, "Phone number");
                }}
                onCopyViber={() => {
                  if (!viberNumber) return;
                  copyToClipboard(viberNumber, "Viber number");
                }}
              />

              <PlaceDetailCourtsCard
                showBookingVerificationUi={showBookingVerificationUi}
                verificationMessage={verificationMessage}
                verificationDescription={verificationDescription}
                verificationStatusVariant={verificationStatusVariant}
                courts={place.courts}
              />

              <PlaceDetailAmenitiesCard amenities={place.amenities} />
            </div>

            <PlaceDetail.Sidebar
              placeName={place.name}
              placePhotos={place.photos}
              showBooking={false}
              selectedAddonCount={0}
              showBookingVerificationUi={showBookingVerificationUi}
              verificationMessage={verificationMessage}
              verificationDescription={verificationDescription}
              verificationStatusVariant={verificationStatusVariant}
              placeLatitude={place.latitude}
              placeLongitude={place.longitude}
              placeExtGPlaceId={place.extGPlaceId}
              mapQuery={mapQuery}
              directionsUrl={directionsUrl}
              openInMapsUrl={openInMapsUrl}
              selectionMode="any"
              courtsForSport={[]}
              durationMinutes={60}
              hasSelection={false}
              selectionSummary={null}
              placeTimeZone={place.timeZone}
              summaryCtaVariant="outline"
              summaryCtaLabel="Select a time"
              onSummaryAction={() => {}}
              isAuthenticated={isAuthenticated}
              cartItems={[]}
              canAddToCart={false}
              onAddToCartAction={() => {}}
              onRemoveFromCartAction={() => {}}
              listingHelpContent={
                <PlaceDetailListingHelpSection
                  placeId={place.id}
                  placeIdOrSlug={placeIdOrSlug}
                  isCurated={isCurated}
                  claimStatus={place.claimStatus}
                />
              }
            />
          </>
        )}
      </div>
    </Container>
  );
}
