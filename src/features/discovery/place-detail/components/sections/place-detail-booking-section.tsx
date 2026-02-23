"use client";

import { addDays } from "date-fns";
import { useRouter } from "next/navigation";
import * as React from "react";
import { appRoutes } from "@/common/app-routes";
import { MAX_BOOKING_WINDOW_DAYS } from "@/common/booking-window";
import { trackEvent } from "@/common/clients/telemetry-client";
import { buildViberDeepLink, toDialablePhone } from "@/common/phone";
import {
  getZonedDayKey,
  getZonedDayRangeForInstant,
  getZonedToday,
} from "@/common/time-zone";
import { copyToClipboard } from "@/common/utils/clipboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  getAutoAddonIds,
  PlayerAddonSelector,
  sanitizeSelectedAddons,
  useCombinedAddons,
} from "@/features/court-addons";
import type { SelectedAddon } from "@/features/court-addons/schemas";
import type { PlaceDetail } from "@/features/discovery/hooks";
import { PlaceDetail as PlaceDetailCompound } from "@/features/discovery/place-detail/components/place-detail";
import { PlaceDetailAmenitiesCard } from "@/features/discovery/place-detail/components/place-detail-amenities-card";
import { PlaceDetailContactCard } from "@/features/discovery/place-detail/components/place-detail-contact-card";
import { PlaceDetailBookingDesktopSection } from "@/features/discovery/place-detail/components/sections/place-detail-booking-desktop-section";
import { PlaceDetailBookingMobileSection } from "@/features/discovery/place-detail/components/sections/place-detail-booking-mobile-section";
import { useModPlaceDetailAvailabilitySelection } from "@/features/discovery/place-detail/hooks/use-place-detail-availability-selection";
import { usePlaceDetailUiStore } from "@/features/discovery/place-detail/stores/place-detail-ui-store";
import { OpenPlayVenuePanel } from "@/features/open-play/components/open-play-venue-panel";

const DEFAULT_DURATION_MINUTES = 60;

type SelectionSummary = {
  startTime: string;
  endTime: string;
  totalCents?: number;
  currency: string;
};

type PlaceDetailBookingSectionProps = {
  place: PlaceDetail;
  isAuthenticated: boolean;
  isBookable: boolean;
  analyticsPlaceId: string;
  placeSlugOrId: string;
  mapQuery: string;
  directionsUrl: string;
  openInMapsUrl: string;
  showBookingVerificationUi: boolean;
  verificationMessage: string;
  verificationDescription: string;
  verificationStatusVariant: "warning" | "destructive" | "muted" | "success";
  availabilitySectionRef: React.RefObject<HTMLDivElement | null>;
  showVenueDetailsCards?: boolean;
};

export function PlaceDetailBookingSection({
  place,
  isAuthenticated,
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
  availabilitySectionRef,
  showVenueDetailsCards = true,
}: PlaceDetailBookingSectionProps) {
  const router = useRouter();
  const setMobileSheetExpanded = usePlaceDetailUiStore(
    (s) => s.setMobileSheetExpanded,
  );

  const [primaryView, setPrimaryView] = React.useState<"book" | "openPlay">(
    "book",
  );

  const {
    selectedDate,
    setSelectedDate,
    durationMinutes,
    setDurationMinutes,
    selectedSportId,
    setSelectedSportId,
    selectionMode,
    setSelectionMode,
    selectedCourtId,
    setSelectedCourtId,
    selectedAddons,
    setSelectedAddons,
    selectedStartTime,
    setSelectedStartTime,
    courtViewMode,
    setCourtViewMode,
    anyViewMode,
    setAnyViewMode,
    courtsForSport,
    clearSelection,
  } = useModPlaceDetailAvailabilitySelection({
    place,
    isBookable,
    defaultDurationMinutes: DEFAULT_DURATION_MINUTES,
  });

  const placeTimeZone = place.timeZone ?? "Asia/Manila";
  const today = React.useMemo(
    () => getZonedToday(placeTimeZone),
    [placeTimeZone],
  );
  const maxBookingDate = React.useMemo(
    () => addDays(today, MAX_BOOKING_WINDOW_DAYS),
    [today],
  );
  const todayDayKey = React.useMemo(
    () => getZonedDayKey(today, placeTimeZone),
    [placeTimeZone, today],
  );
  const maxDayKey = React.useMemo(
    () => getZonedDayKey(maxBookingDate, placeTimeZone),
    [maxBookingDate, placeTimeZone],
  );
  const todayRangeStart = React.useMemo(
    () => getZonedDayRangeForInstant(today, placeTimeZone).start,
    [placeTimeZone, today],
  );

  React.useEffect(() => {
    if (!selectedDate) {
      setSelectedDate(today);
      return;
    }
    const selectedRange = getZonedDayRangeForInstant(
      selectedDate,
      placeTimeZone,
    );
    if (selectedRange.start < todayRangeStart) {
      setSelectedDate(today);
    }
  }, [placeTimeZone, selectedDate, setSelectedDate, today, todayRangeStart]);

  React.useEffect(() => {
    if (!selectedStartTime) return;
    const selectedStartMs = Date.parse(selectedStartTime);
    const nowMs = Date.now();
    if (selectedStartMs <= nowMs) {
      clearSelection(true);
      return;
    }

    const timeoutId = window.setTimeout(
      () => {
        clearSelection(true);
      },
      selectedStartMs - nowMs + 250,
    );

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [clearSelection, selectedStartTime]);

  React.useEffect(() => {
    if (!selectedStartTime) return;
    trackEvent({
      event: "funnel.schedule_slot_selected",
      properties: {
        placeId: analyticsPlaceId,
        mode: selectionMode,
        durationMinutes,
        startTime: selectedStartTime,
        courtId: selectionMode === "court" ? selectedCourtId : undefined,
      },
    });
  }, [
    analyticsPlaceId,
    durationMinutes,
    selectedCourtId,
    selectedStartTime,
    selectionMode,
  ]);

  const [selectionSummary, setSelectionSummary] =
    React.useState<SelectionSummary | null>(null);

  const { addons: availableCourtAddons, globalAddonIds } = useCombinedAddons(
    isAuthenticated && selectionMode === "court" ? place.id : undefined,
    isAuthenticated && selectionMode === "court" ? selectedCourtId : undefined,
  );

  React.useEffect(() => {
    if (availableCourtAddons.length === 0 && selectedAddons.length === 0) {
      return;
    }

    const sanitized = sanitizeSelectedAddons(
      selectedAddons,
      availableCourtAddons,
    );
    const autoAddonIds = getAutoAddonIds(availableCourtAddons);
    const sanitizedIds = new Set(sanitized.map((a) => a.addonId));
    const autoEntries: SelectedAddon[] = autoAddonIds
      .filter((id) => !sanitizedIds.has(id))
      .map((id) => ({ addonId: id, quantity: 1 }));
    const next = [...sanitized, ...autoEntries];

    const hasChanged =
      next.length !== selectedAddons.length ||
      next.some(
        (a, i) =>
          a.addonId !== selectedAddons[i]?.addonId ||
          a.quantity !== selectedAddons[i]?.quantity,
      );
    if (hasChanged) {
      setSelectedAddons(next);
    }
  }, [availableCourtAddons, selectedAddons, setSelectedAddons]);
  const handleSelectionSummaryChange = React.useCallback(
    (next: SelectionSummary | null) => {
      setSelectionSummary((prev) => {
        const isSame =
          prev?.startTime === next?.startTime &&
          prev?.endTime === next?.endTime &&
          prev?.totalCents === next?.totalCents &&
          prev?.currency === next?.currency;
        return isSame ? prev : next;
      });
    },
    [],
  );

  const handleReserve = React.useCallback(() => {
    if (!selectedStartTime) return;

    const params = new URLSearchParams();
    params.set("duration", String(durationMinutes));
    params.set("mode", selectionMode);
    if (selectedSportId) {
      params.set("sportId", selectedSportId);
    }
    if (selectedDate) {
      params.set("date", getZonedDayKey(selectedDate, placeTimeZone));
    }
    if (selectionMode === "court" && selectedCourtId) {
      params.set("courtId", selectedCourtId);
    }
    if (selectedAddons.length > 0) {
      const encoded = selectedAddons
        .map((a) =>
          a.quantity === 1 ? a.addonId : `${a.addonId}:${a.quantity}`,
        )
        .join(",");
      params.set("addonIds", encoded);
    }
    params.set("startTime", selectedStartTime);

    const destination = `${appRoutes.places.book(placeSlugOrId)}?${params.toString()}`;

    trackEvent({
      event: "funnel.reserve_clicked",
      properties: {
        placeId: analyticsPlaceId,
        mode: selectionMode,
        durationMinutes,
        startTime: selectedStartTime,
        courtId: selectionMode === "court" ? selectedCourtId : undefined,
      },
    });

    if (isAuthenticated) {
      router.push(destination);
      return;
    }

    const returnTo = appRoutes.places.detail(placeSlugOrId);
    trackEvent({
      event: "funnel.login_started",
      properties: {
        placeId: analyticsPlaceId,
        redirect: returnTo,
      },
    });
    router.push(appRoutes.login.from(returnTo));
  }, [
    analyticsPlaceId,
    durationMinutes,
    isAuthenticated,
    placeSlugOrId,
    placeTimeZone,
    router,
    selectedCourtId,
    selectedDate,
    selectedAddons,
    selectedSportId,
    selectedStartTime,
    selectionMode,
  ]);

  const scrollToSection = React.useCallback(
    (ref: React.RefObject<HTMLElement | null>) => {
      const element = ref.current;
      if (!element || typeof window === "undefined") return;
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      element.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });
    },
    [],
  );

  const hasSelection = !!selectedStartTime;
  const summaryCtaVariant = hasSelection ? "default" : "outline";
  const summaryCtaLabel = hasSelection ? "Continue to review" : "Select a time";

  const handleSummaryAction = React.useCallback(() => {
    if (hasSelection) {
      handleReserve();
      return;
    }

    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setMobileSheetExpanded(true);
      return;
    }

    scrollToSection(availabilitySectionRef);
  }, [
    availabilitySectionRef,
    handleReserve,
    hasSelection,
    scrollToSection,
    setMobileSheetExpanded,
  ]);

  const handleHostOpenPlay = React.useCallback(() => {
    setPrimaryView("book");
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setMobileSheetExpanded(true);
      return;
    }
    scrollToSection(availabilitySectionRef);
  }, [availabilitySectionRef, scrollToSection, setMobileSheetExpanded]);

  const contactDetail = place.contactDetail;
  const phoneNumber = contactDetail?.phoneNumber?.trim();
  const viberNumber = contactDetail?.viberInfo?.trim();
  const dialablePhone = phoneNumber ? toDialablePhone(phoneNumber) : "";
  const viberLink = viberNumber ? buildViberDeepLink(viberNumber) : "";
  const hasContactDetail = Boolean(
    contactDetail?.phoneNumber ||
      contactDetail?.websiteUrl ||
      contactDetail?.facebookUrl ||
      contactDetail?.instagramUrl ||
      contactDetail?.viberInfo ||
      contactDetail?.otherContactInfo,
  );

  return (
    <>
      <div className="space-y-6 lg:col-span-2">
        <div className="flex items-center justify-between gap-3">
          <ToggleGroup
            type="single"
            value={primaryView}
            onValueChange={(value) => {
              if (!value) return;
              setPrimaryView(value as "book" | "openPlay");
            }}
            className="justify-start"
          >
            <ToggleGroupItem value="book" aria-label="Book">
              Book
            </ToggleGroupItem>
            <ToggleGroupItem value="openPlay" aria-label="Open Play">
              Open Play
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {primaryView === "openPlay" ? (
          <OpenPlayVenuePanel
            place={{ id: place.id, timeZone: placeTimeZone }}
            hostCta={
              <Button type="button" onClick={handleHostOpenPlay}>
                Host an Open Play
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            <PlaceDetailBookingDesktopSection
              place={place}
              placeTimeZone={placeTimeZone}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              durationMinutes={durationMinutes}
              setDurationMinutes={setDurationMinutes}
              selectedSportId={selectedSportId}
              setSelectedSportId={setSelectedSportId}
              selectionMode={selectionMode}
              setSelectionMode={setSelectionMode}
              selectedCourtId={selectedCourtId}
              setSelectedCourtId={setSelectedCourtId}
              selectedAddons={selectedAddons}
              selectedStartTime={selectedStartTime}
              setSelectedStartTime={setSelectedStartTime}
              courtViewMode={courtViewMode}
              setCourtViewMode={setCourtViewMode}
              anyViewMode={anyViewMode}
              setAnyViewMode={setAnyViewMode}
              courtsForSport={courtsForSport}
              clearSelection={clearSelection}
              today={today}
              todayRangeStart={todayRangeStart}
              maxBookingDate={maxBookingDate}
              todayDayKey={todayDayKey}
              maxDayKey={maxDayKey}
              availabilitySectionRef={availabilitySectionRef}
              onContinue={handleReserve}
              onSelectionSummaryChange={handleSelectionSummaryChange}
            />

            {isAuthenticated &&
              selectionMode === "court" &&
              !!selectedCourtId && (
                <Card>
                  <CardContent className="space-y-3 p-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Optional extras</p>
                      <p className="text-xs text-muted-foreground">
                        Select extras now to preview add-on-aware totals before
                        checkout.
                      </p>
                    </div>
                    <PlayerAddonSelector
                      addons={availableCourtAddons}
                      selectedAddons={selectedAddons}
                      onSelectedAddonsChange={setSelectedAddons}
                      globalAddonIds={globalAddonIds}
                    />
                  </CardContent>
                </Card>
              )}
          </div>
        )}

        {showVenueDetailsCards ? (
          <>
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

            <PlaceDetailAmenitiesCard amenities={place.amenities} />
          </>
        ) : null}
      </div>

      {primaryView === "book" ? (
        <PlaceDetailCompound.Sidebar
          placeName={place.name}
          placePhotos={place.photos}
          showBooking
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
          selectionMode={selectionMode}
          courtsForSport={courtsForSport}
          selectedCourtId={selectedCourtId}
          selectedAddonCount={selectedAddons.length}
          durationMinutes={durationMinutes}
          hasSelection={hasSelection}
          selectionSummary={selectionSummary}
          placeTimeZone={placeTimeZone}
          summaryCtaVariant={summaryCtaVariant}
          summaryCtaLabel={summaryCtaLabel}
          onSummaryAction={handleSummaryAction}
          isAuthenticated={isAuthenticated}
        />
      ) : (
        <Card className="h-fit">
          <CardContent className="p-4 text-sm text-muted-foreground">
            Host an Open Play by booking a time slot, then mark it as Open Play
            at checkout.
          </CardContent>
        </Card>
      )}

      {primaryView === "book" ? (
        <PlaceDetailBookingMobileSection
          place={place}
          placeTimeZone={placeTimeZone}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          durationMinutes={durationMinutes}
          setDurationMinutes={setDurationMinutes}
          selectedSportId={selectedSportId}
          setSelectedSportId={setSelectedSportId}
          selectionMode={selectionMode}
          setSelectionMode={setSelectionMode}
          selectedCourtId={selectedCourtId}
          selectedAddons={selectedAddons}
          setSelectedCourtId={setSelectedCourtId}
          selectedStartTime={selectedStartTime}
          setSelectedStartTime={setSelectedStartTime}
          courtsForSport={courtsForSport}
          clearSelection={clearSelection}
          today={today}
          todayRangeStart={todayRangeStart}
          maxBookingDate={maxBookingDate}
          onContinue={handleReserve}
          onSelectionSummaryChange={handleSelectionSummaryChange}
        />
      ) : null}
    </>
  );
}
