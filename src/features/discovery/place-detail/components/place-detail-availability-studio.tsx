"use client";

import * as React from "react";
import { useQueryAuthSession } from "@/features/auth/hooks";
import type { PlaceVerificationStatusVariant } from "@/features/discovery/helpers";
import type { PlaceDetail } from "@/features/discovery/hooks/place-detail";
import { PlaceDetailBookingSection } from "@/features/discovery/place-detail/components/sections/place-detail-booking-section";

type PlaceDetailAvailabilityStudioProps = {
  place: PlaceDetail;
  isBookable: boolean;
  analyticsPlaceId: string;
  placeSlugOrId: string;
  mapQuery: string;
  directionsUrl: string;
  openInMapsUrl: string;
  showBookingVerificationUi: boolean;
  verificationMessage: string;
  verificationDescription: string;
  verificationStatusVariant: PlaceVerificationStatusVariant;
};

export function PlaceDetailAvailabilityStudio({
  place,
  isBookable,
  analyticsPlaceId,
  placeSlugOrId,
  mapQuery,
  directionsUrl,
  openInMapsUrl,
  showBookingVerificationUi,
  verificationMessage,
  verificationDescription,
  verificationStatusVariant,
}: PlaceDetailAvailabilityStudioProps) {
  const { data: session } = useQueryAuthSession();
  const isAuthenticated = !!session;
  const availabilitySectionRef = React.useRef<HTMLDivElement | null>(null);

  return (
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
      showVenueDetailsCards={false}
    />
  );
}

export type { PlaceDetailAvailabilityStudioProps };
