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
import { toast } from "@/common/toast";
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
import {
  buildBookingSummaryCtaState,
  canCheckoutBookingCart,
} from "@/features/discovery/place-detail/helpers/booking-cart-cta";
import {
  getBookingCartDayKeys,
  getBookingCartViolationMessage,
  isBookingCartKeyDuplicate,
  validateBookingCartAdd,
} from "@/features/discovery/place-detail/helpers/booking-cart-rules";
import { isSelectionEstimateReady } from "@/features/discovery/place-detail/helpers/selection-estimate";
import { useBookingMachines } from "@/features/discovery/place-detail/hooks/use-booking-machines";
import { buildMemoryKey } from "@/features/discovery/place-detail/machines";
import { usePlaceDetailUiStore } from "@/features/discovery/place-detail/stores/place-detail-ui-store";
import { ExternalBookingInfoCard } from "@/features/open-play/components/external-booking-info-card";
import { ExternalOpenPlayCreateDialog } from "@/features/open-play/components/external-open-play-create-dialog";
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

  // --- XState machines via unified hook ---
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
    courtsForSport,
    clearSelection,
    cartItems,
    addCartItem,
    removeCartItem,
    clearCart,
    clearCartForSportChange,
    saveSnapshot,
    restoreSnapshot,
    notifyCartItemAdded,
    sendTimeSlot,
  } = useBookingMachines({
    place,
    isBookable,
    defaultDurationMinutes: DEFAULT_DURATION_MINUTES,
  });

  const placeTimeZone = place.timeZone ?? "Asia/Manila";
  const sameDayAnchorDayKeys = React.useMemo(() => {
    const firstItem = cartItems[0];
    if (!firstItem) return undefined;
    return getBookingCartDayKeys(firstItem, placeTimeZone);
  }, [cartItems, placeTimeZone]);
  const sameDayAnchorDayKey = React.useMemo(() => {
    if (!sameDayAnchorDayKeys) return undefined;
    return Array.from(sameDayAnchorDayKeys)[0];
  }, [sameDayAnchorDayKeys]);
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
      sendTimeSlot({ type: "SLOT_EXPIRED" });
      return;
    }

    const timeoutId = window.setTimeout(
      () => {
        sendTimeSlot({ type: "SLOT_EXPIRED" });
      },
      selectedStartMs - nowMs + 250,
    );

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [selectedStartTime, sendTimeSlot]);

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

  const handleAddToCart = React.useCallback(() => {
    if (
      selectionMode !== "court" ||
      !selectedCourtId ||
      !selectedStartTime ||
      !selectedSportId
    )
      return;
    const hasReadyEstimate = isSelectionEstimateReady({
      selectedStartTime,
      durationMinutes,
      selectionSummary,
    });
    if (!hasReadyEstimate) {
      toast.info("Please wait for pricing to update, then add this slot.");
      return;
    }

    const courtLabel =
      courtsForSport.find((c) => c.id === selectedCourtId)?.label ??
      selectedCourtId;
    const key = `${selectedCourtId}|${selectedStartTime}|${durationMinutes}`;
    const candidate = {
      courtId: selectedCourtId,
      startTime: selectedStartTime,
      durationMinutes,
    };
    if (isBookingCartKeyDuplicate({ cartItems, key })) {
      toast.info("This slot is already in your booking.");
      return;
    }

    const validation = validateBookingCartAdd({
      cartItems,
      candidate,
      placeTimeZone,
    });
    if (!validation.ok) {
      toast.error(getBookingCartViolationMessage(validation.reason));
      return;
    }
    if (!selectionSummary || typeof selectionSummary.totalCents !== "number") {
      toast.info("Please wait for pricing to update, then add this slot.");
      return;
    }

    addCartItem({
      key,
      courtId: candidate.courtId,
      courtLabel,
      sportId: selectedSportId,
      startTime: candidate.startTime,
      durationMinutes,
      estimatedPriceCents: selectionSummary.totalCents ?? null,
      currency: selectionSummary.currency,
    });

    // Build the memory key and notify the time slot machine
    const memoryKey = buildMemoryKey(
      place.id,
      selectedSportId,
      getZonedDayKey(
        selectedDate ?? getZonedToday(placeTimeZone),
        placeTimeZone,
      ),
      selectedCourtId,
    );
    notifyCartItemAdded(memoryKey);
  }, [
    addCartItem,
    cartItems,
    courtsForSport,
    durationMinutes,
    notifyCartItemAdded,
    place.id,
    placeTimeZone,
    selectedCourtId,
    selectedDate,
    selectedSportId,
    selectedStartTime,
    selectionMode,
    selectionSummary,
  ]);

  const handleReserve = React.useCallback(
    (options?: { preferCartCheckout?: boolean }) => {
      const shouldCheckoutCart =
        cartItems.length > 0 &&
        (options?.preferCartCheckout === true || !selectedStartTime);

      // Multi-court checkout: encode cart items into `items` param
      if (shouldCheckoutCart) {
        const params = new URLSearchParams();
        if (selectedSportId) {
          params.set("sportId", selectedSportId);
        }
        const itemsEncoded = cartItems
          .map(
            (item) =>
              `${item.courtId}|${item.startTime}|${item.durationMinutes}`,
          )
          .join(",");
        params.set("items", itemsEncoded);

        const destination = `${appRoutes.places.book(placeSlugOrId)}?${params.toString()}`;

        trackEvent({
          event: "funnel.reserve_clicked",
          properties: {
            placeId: analyticsPlaceId,
            mode: "court",
            itemCount: cartItems.length,
          },
        });

        if (isAuthenticated) {
          router.push(destination);
          return;
        }

        trackEvent({
          event: "funnel.login_started",
          properties: {
            placeId: analyticsPlaceId,
            redirect: destination,
          },
        });
        router.push(appRoutes.login.from(destination));
        return;
      }

      // Single-court flow (unchanged)
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

      const returnTo = destination;
      trackEvent({
        event: "funnel.login_started",
        properties: {
          placeId: analyticsPlaceId,
          redirect: returnTo,
        },
      });
      router.push(appRoutes.login.from(returnTo));
    },
    [
      analyticsPlaceId,
      cartItems,
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
    ],
  );

  const handleContinueFromCart = React.useCallback(() => {
    handleReserve({ preferCartCheckout: true });
  }, [handleReserve]);

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

  // Clear cart on sport change
  const prevSportIdRef = React.useRef(selectedSportId);
  React.useEffect(() => {
    if (selectedSportId && selectedSportId !== prevSportIdRef.current) {
      clearCartForSportChange(selectedSportId);
    }
    prevSportIdRef.current = selectedSportId;
  }, [clearCartForSportChange, selectedSportId]);

  // Clear cart on unmount
  React.useEffect(() => {
    return () => {
      clearCart();
    };
  }, [clearCart]);

  const hasSelection = !!selectedStartTime;
  const hasPricedSelection = isSelectionEstimateReady({
    selectedStartTime,
    durationMinutes,
    selectionSummary,
  });
  const canAddToCart =
    selectionMode === "court" &&
    hasSelection &&
    !!selectedCourtId &&
    !!selectedSportId &&
    hasPricedSelection;

  const summaryCta = buildBookingSummaryCtaState({
    cartItemCount: cartItems.length,
    hasSelection,
  });

  const handleSummaryAction = React.useCallback(() => {
    if (
      canCheckoutBookingCart({
        cartItemCount: cartItems.length,
        hasSelection,
      })
    ) {
      handleReserve();
      return;
    }

    if (summaryCta.shouldProceed) {
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
    cartItems.length,
    handleReserve,
    hasSelection,
    summaryCta.shouldProceed,
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
                Book in KudosCourts
              </Button>
            }
            externalHostCta={
              <ExternalOpenPlayCreateDialog
                place={{
                  id: place.id,
                  sports: place.sports.map((sport) => ({
                    id: sport.id,
                    name: sport.name,
                  })),
                }}
              />
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
              courtsForSport={courtsForSport}
              clearSelection={clearSelection}
              today={today}
              todayRangeStart={todayRangeStart}
              maxBookingDate={maxBookingDate}
              todayDayKey={todayDayKey}
              maxDayKey={maxDayKey}
              sameDayAnchorDayKey={sameDayAnchorDayKey}
              availabilitySectionRef={availabilitySectionRef}
              onSelectionSummaryChange={handleSelectionSummaryChange}
              cartItems={cartItems}
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
          summaryCtaVariant={summaryCta.variant}
          summaryCtaLabel={summaryCta.label}
          onSummaryAction={handleSummaryAction}
          isAuthenticated={isAuthenticated}
          cartItems={cartItems}
          canAddToCart={canAddToCart}
          onAddToCartAction={handleAddToCart}
          onRemoveFromCartAction={removeCartItem}
        />
      ) : (
        <ExternalBookingInfoCard
          className="h-fit"
          cta={
            <Button type="button" onClick={handleHostOpenPlay}>
              Book in KudosCourts
            </Button>
          }
        />
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
          onContinueFromCart={handleContinueFromCart}
          onSelectionSummaryChange={handleSelectionSummaryChange}
          cartItems={cartItems}
          canAddToCart={canAddToCart}
          onAddToCartAction={handleAddToCart}
          onRemoveFromCartAction={removeCartItem}
          onSaveSnapshot={saveSnapshot}
          onRestoreSnapshot={restoreSnapshot}
        />
      ) : null}
    </>
  );
}
