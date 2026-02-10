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
import type { PlaceDetail } from "@/features/discovery/hooks";
import { PlaceDetail as PlaceDetailCompound } from "@/features/discovery/place-detail/components/place-detail";
import { PlaceDetailContactCard } from "@/features/discovery/place-detail/components/place-detail-contact-card";
import { PlaceDetailBookingDesktopSection } from "@/features/discovery/place-detail/components/sections/place-detail-booking-desktop-section";
import { PlaceDetailBookingMobileSection } from "@/features/discovery/place-detail/components/sections/place-detail-booking-mobile-section";
import { usePlaceDetailAvailabilitySelection } from "@/features/discovery/place-detail/hooks/use-place-detail-availability-selection";
import { usePlaceDetailUiStore } from "@/features/discovery/place-detail/state/place-detail-ui-store";

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
}: PlaceDetailBookingSectionProps) {
  const router = useRouter();
  const setMobileSheetExpanded = usePlaceDetailUiStore(
    (s) => s.setMobileSheetExpanded,
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
    selectedStartTime,
    setSelectedStartTime,
    courtViewMode,
    setCourtViewMode,
    anyViewMode,
    setAnyViewMode,
    courtsForSport,
    clearSelection,
  } = usePlaceDetailAvailabilitySelection({
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
      </div>

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
        durationMinutes={durationMinutes}
        hasSelection={hasSelection}
        selectionSummary={selectionSummary}
        placeTimeZone={placeTimeZone}
        summaryCtaVariant={summaryCtaVariant}
        summaryCtaLabel={summaryCtaLabel}
        onSummaryAction={handleSummaryAction}
        isAuthenticated={isAuthenticated}
      />

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
    </>
  );
}
