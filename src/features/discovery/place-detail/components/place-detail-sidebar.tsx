"use client";

import type * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PhotoCarousel } from "@/features/discovery/components";
import { VerificationStatusBanner } from "@/features/discovery/components/verification-status-banner";
import type { BookingCartItem } from "@/features/discovery/place-detail/stores/booking-cart-store";
import { PlaceDetailBookingSummaryCard } from "./place-detail-booking-summary-card";
import { PlaceDetailLocationCard } from "./place-detail-location-card";
import { PlaceDetailNextStepsCard } from "./place-detail-next-steps-card";

type CourtOption = {
  id: string;
  label: string;
};

type SelectionSummary = {
  startTime: string;
  endTime: string;
  totalCents?: number;
  currency: string;
};

type PlaceDetailSidebarProps = {
  placeName: string;
  placePhotos: { id: string; url: string; alt?: string }[];
  showBooking: boolean;
  showBookingVerificationUi: boolean;
  verificationMessage: string;
  verificationDescription: string;
  verificationStatusVariant: "warning" | "destructive" | "muted" | "success";
  placeLatitude?: number;
  placeLongitude?: number;
  placeExtGPlaceId?: string;
  mapQuery: string;
  directionsUrl: string;
  openInMapsUrl: string;
  selectionMode: "any" | "court";
  courtsForSport: CourtOption[];
  selectedCourtId?: string;
  selectedAddonCount: number;
  durationMinutes: number;
  hasSelection: boolean;
  selectionSummary: SelectionSummary | null;
  placeTimeZone: string;
  summaryCtaVariant: "default" | "outline";
  summaryCtaLabel: string;
  onSummaryAction: () => void;
  isAuthenticated: boolean;
  cartItems: BookingCartItem[];
  canAddToCart: boolean;
  onAddToCartAction: () => void;
  onRemoveFromCartAction: (key: string) => void;
  listingHelpContent?: React.ReactNode;
};

export function PlaceDetailSidebar({
  placeName,
  placePhotos,
  showBooking,
  showBookingVerificationUi,
  verificationMessage,
  verificationDescription,
  verificationStatusVariant,
  placeLatitude,
  placeLongitude,
  placeExtGPlaceId,
  mapQuery,
  directionsUrl,
  openInMapsUrl,
  selectionMode,
  courtsForSport,
  selectedCourtId,
  selectedAddonCount,
  durationMinutes,
  hasSelection,
  selectionSummary,
  placeTimeZone,
  summaryCtaVariant,
  summaryCtaLabel,
  onSummaryAction,
  isAuthenticated,
  cartItems,
  canAddToCart,
  onAddToCartAction,
  onRemoveFromCartAction,
  listingHelpContent,
}: PlaceDetailSidebarProps) {
  return (
    <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
      <div className="hidden lg:block">
        <Card className="overflow-hidden p-0">
          <PhotoCarousel photos={placePhotos} courtName={placeName} />
        </Card>
      </div>

      {showBooking ? (
        <>
          <PlaceDetailBookingSummaryCard
            selectionMode={selectionMode}
            courtsForSport={courtsForSport}
            selectedCourtId={selectedCourtId}
            selectedAddonCount={selectedAddonCount}
            durationMinutes={durationMinutes}
            hasSelection={hasSelection}
            selectionSummary={selectionSummary}
            placeTimeZone={placeTimeZone}
            summaryCtaVariant={summaryCtaVariant}
            summaryCtaLabel={summaryCtaLabel}
            onSummaryAction={onSummaryAction}
            isAuthenticated={isAuthenticated}
            cartItems={cartItems}
            canAddToCart={canAddToCart}
            onAddToCartAction={onAddToCartAction}
            onRemoveFromCartAction={onRemoveFromCartAction}
          />

          <PlaceDetailLocationCard
            placeName={placeName}
            lat={placeLatitude}
            lng={placeLongitude}
            placeId={placeExtGPlaceId}
            mapQuery={mapQuery}
            directionsUrl={directionsUrl}
            openInMapsUrl={openInMapsUrl}
          />

          <PlaceDetailNextStepsCard />
        </>
      ) : (
        <>
          {showBookingVerificationUi && (
            <Card>
              <CardHeader>
                <CardTitle>Booking status</CardTitle>
              </CardHeader>
              <CardContent>
                <VerificationStatusBanner
                  message={verificationMessage}
                  description={verificationDescription}
                  variant={verificationStatusVariant}
                />
              </CardContent>
            </Card>
          )}
          <PlaceDetailLocationCard
            placeName={placeName}
            lat={placeLatitude}
            lng={placeLongitude}
            placeId={placeExtGPlaceId}
            mapQuery={mapQuery}
            directionsUrl={directionsUrl}
            openInMapsUrl={openInMapsUrl}
          />
          {listingHelpContent}
        </>
      )}
    </div>
  );
}
