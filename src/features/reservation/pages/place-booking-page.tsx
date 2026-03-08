"use client";

import { addMinutes } from "date-fns";
import { CalendarCheck, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";
import * as React from "react";
import { appRoutes } from "@/common/app-routes";
import { normalizeDurationMinutes } from "@/common/duration";
import {
  createFeatureQueryOptions,
  useFeatureQueries,
} from "@/common/feature-api-hooks";
import {
  formatCurrency,
  formatDateShortInTimeZone,
  formatDuration,
  formatTimeRangeInTimeZone,
} from "@/common/format";
import { getPlayerReservationPaymentPath } from "@/common/reservation-links";
import { getZonedDate, getZonedStartOfDayIso } from "@/common/time-zone";
import { toast } from "@/common/toast";
import { Container } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  getAutoAddonIds,
  PlayerAddonSelector,
  sanitizeSelectedAddons,
  useCombinedAddons,
} from "@/features/court-addons";
import type { SelectedAddon } from "@/features/court-addons/schemas";
import { getDiscoveryApi } from "@/features/discovery/api.runtime";
import { getPlaceVerificationDisplay } from "@/features/discovery/helpers";
import {
  useModPlaceAvailability,
  useModPlaceDetail,
} from "@/features/discovery/hooks";
import {
  useMutCreateOpenPlayFromReservation,
  useMutCreateOpenPlayFromReservationGroup,
} from "@/features/open-play/hooks";
import { BookingSummaryCard } from "@/features/reservation/components/booking-summary-card";
import { OrderSummary } from "@/features/reservation/components/order-summary";
import { ProfilePreviewCard } from "@/features/reservation/components/profile-preview-card";
import { ProfileSetupModal } from "@/features/reservation/components/profile-setup-modal";
import {
  useModReservationPageWarmup,
  useMutCreateReservationForAnyCourt,
  useMutCreateReservationForCourt,
  useMutCreateReservationGroup,
  useQueryProfile,
} from "@/features/reservation/hooks";
import {
  clearPendingBooking,
  usePendingBooking,
} from "@/features/reservation/hooks/use-pending-booking";
import { isProfileComplete } from "@/lib/modules/profile/shared/domain";
import { computeReservationGroupTotals } from "@/lib/modules/reservation/shared/domain";

const DEFAULT_DURATION_MINUTES = 60;
const selectionModeSchema = ["any", "court"] as const;
const discoveryApi = getDiscoveryApi();

type MultiCourtBookingItem = {
  courtId: string;
  startTime: string;
  durationMinutes: number;
};

type MultiCourtBookingSummaryItem = {
  courtId: string;
  courtLabel: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  totalPriceCents: number | null;
  currency: string | null;
  isAvailable: boolean;
};

const encodeMultiCourtBookingItem = (item: MultiCourtBookingItem) =>
  `${item.courtId}|${item.startTime}|${item.durationMinutes}`;

const decodeMultiCourtBookingItem = (
  raw: string,
): MultiCourtBookingItem | null => {
  const [courtId, startTime, durationRaw] = raw.split("|");
  if (!courtId || !startTime || !durationRaw) {
    return null;
  }

  const durationMinutes = Number.parseInt(durationRaw, 10);
  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    return null;
  }
  const parsedStartTime = new Date(startTime);
  if (Number.isNaN(parsedStartTime.getTime())) {
    return null;
  }

  return {
    courtId,
    startTime: parsedStartTime.toISOString(),
    durationMinutes,
  };
};

type PlaceBookingPageProps = {
  placeIdOrSlug: string;
  initialOpenPlayEnabled: boolean;
};

export default function PlaceBookingPage({
  placeIdOrSlug,
  initialOpenPlayEnabled,
}: PlaceBookingPageProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [bookingParams, setBookingParams] = useQueryStates({
    startTime: parseAsString,
    duration: parseAsInteger,
    sportId: parseAsString,
    mode: parseAsStringLiteral(selectionModeSchema),
    courtId: parseAsString,
    addonIds: parseAsArrayOf(parseAsString),
    items: parseAsArrayOf(parseAsString),
  });

  const rawMultiCourtItems = bookingParams.items ?? [];
  const sportId = bookingParams.sportId ?? undefined;
  const modeParam = bookingParams.mode ?? undefined;
  const multiCourtItems = React.useMemo(
    () =>
      rawMultiCourtItems
        .map((raw) => decodeMultiCourtBookingItem(raw))
        .filter((item): item is MultiCourtBookingItem => item !== null),
    [rawMultiCourtItems],
  );
  const hasInvalidMultiCourtItems =
    rawMultiCourtItems.length !== multiCourtItems.length;
  const fallbackSingleItem =
    multiCourtItems.length === 1 ? multiCourtItems[0] : null;
  const startTime =
    bookingParams.startTime ?? fallbackSingleItem?.startTime ?? undefined;
  const durationParam =
    bookingParams.duration ?? fallbackSingleItem?.durationMinutes ?? undefined;
  const courtId =
    bookingParams.courtId ?? fallbackSingleItem?.courtId ?? undefined;
  const mode = modeParam ?? (courtId ? "court" : "any");
  const isMultiCourtBooking = multiCourtItems.length > 1;
  const selectedAddons: SelectedAddon[] = React.useMemo(
    () =>
      (bookingParams.addonIds ?? []).map((item) => {
        const colonIdx = item.lastIndexOf(":");
        if (colonIdx === -1) return { addonId: item, quantity: 1 };
        const qty = Number.parseInt(item.slice(colonIdx + 1), 10);
        return {
          addonId: item.slice(0, colonIdx),
          quantity: Number.isFinite(qty) && qty >= 1 ? qty : 1,
        };
      }),
    [bookingParams.addonIds],
  );

  const durationMinutes = normalizeDurationMinutes(
    durationParam ?? DEFAULT_DURATION_MINUTES,
    DEFAULT_DURATION_MINUTES,
  );

  const { data: place, isLoading } = useModPlaceDetail({
    placeIdOrSlug,
  });
  const resolvedPlaceId = place?.id;
  const placeSlugOrId = place?.slug ?? place?.id ?? placeIdOrSlug;
  const placeTimeZone = place?.timeZone ?? "Asia/Manila";
  const verificationDisplay = getPlaceVerificationDisplay({
    placeType: place?.placeType,
    verificationStatus: place?.verification?.status,
    reservationsEnabled: place?.verification?.reservationsEnabled,
    hasPaymentMethods: place?.hasPaymentMethods,
  });
  const showBooking = verificationDisplay.showBooking;
  const bookingDate = React.useMemo(
    () => (startTime ? getZonedDate(startTime, placeTimeZone) : undefined),
    [startTime, placeTimeZone],
  );

  const bookingRedirect = React.useMemo(() => {
    const params = new URLSearchParams();

    if (startTime) {
      params.set("startTime", startTime);
    }
    if (durationParam != null) {
      params.set("duration", String(durationParam));
    }
    if (sportId) {
      params.set("sportId", sportId);
    }
    if (modeParam) {
      params.set("mode", modeParam);
    }
    if (courtId) {
      params.set("courtId", courtId);
    }
    if (selectedAddons.length > 0) {
      params.set(
        "addonIds",
        selectedAddons
          .map((a) =>
            a.quantity === 1 ? a.addonId : `${a.addonId}:${a.quantity}`,
          )
          .join(","),
      );
    }
    if (multiCourtItems.length > 0) {
      params.set(
        "items",
        multiCourtItems
          .map((item) => encodeMultiCourtBookingItem(item))
          .join(","),
      );
    }

    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [
    selectedAddons,
    courtId,
    durationParam,
    modeParam,
    multiCourtItems,
    pathname,
    sportId,
    startTime,
  ]);

  React.useEffect(() => {
    if (!place?.slug) return;
    if (placeIdOrSlug === place.slug) return;
    const params = new URLSearchParams();

    if (startTime) {
      params.set("startTime", startTime);
    }
    if (durationParam != null) {
      params.set("duration", String(durationParam));
    }
    if (sportId) {
      params.set("sportId", sportId);
    }
    if (modeParam) {
      params.set("mode", modeParam);
    }
    if (courtId) {
      params.set("courtId", courtId);
    }
    if (selectedAddons.length > 0) {
      params.set(
        "addonIds",
        selectedAddons
          .map((a) =>
            a.quantity === 1 ? a.addonId : `${a.addonId}:${a.quantity}`,
          )
          .join(","),
      );
    }
    if (multiCourtItems.length > 0) {
      params.set(
        "items",
        multiCourtItems
          .map((item) => encodeMultiCourtBookingItem(item))
          .join(","),
      );
    }

    const query = params.toString();
    const nextPath = query
      ? `${appRoutes.places.book(place.slug)}?${query}`
      : appRoutes.places.book(place.slug);
    router.replace(nextPath);
  }, [
    courtId,
    durationParam,
    modeParam,
    place?.slug,
    placeIdOrSlug,
    router,
    multiCourtItems,
    selectedAddons,
    sportId,
    startTime,
  ]);
  const { data: profile, isLoading: isLoadingProfile } = useQueryProfile();
  const pendingBooking = usePendingBooking(placeIdOrSlug);
  const { warmupReservationPage } = useModReservationPageWarmup();

  React.useEffect(() => {
    if (!startTime && pendingBooking.data?.startTime) {
      void setBookingParams({ startTime: pendingBooking.data.startTime });
    }
  }, [startTime, pendingBooking.data, setBookingParams]);

  const createForCourt = useMutCreateReservationForCourt();
  const createForAnyCourt = useMutCreateReservationForAnyCourt();
  const createGroup = useMutCreateReservationGroup();
  const createOpenPlay = useMutCreateOpenPlayFromReservation();
  const createOpenPlayFromGroup = useMutCreateOpenPlayFromReservationGroup();

  const availabilityQuery = useModPlaceAvailability({
    place: place ?? undefined,
    sportId,
    courtId,
    selectedAddons,
    date: bookingDate,
    durationMinutes,
    mode,
  });

  const availabilityWithoutAddonsQuery = useModPlaceAvailability({
    place: place ?? undefined,
    sportId,
    courtId,
    date: bookingDate,
    durationMinutes,
    mode,
  });

  const availability = availabilityQuery.data ?? [];
  const multiCourtAvailabilityQueries = useFeatureQueries(
    multiCourtItems.map((item) =>
      createFeatureQueryOptions(
        ["availability", "getForCourt"],
        discoveryApi.queryAvailabilityGetForCourt,
        {
          courtId: item.courtId,
          date: getZonedStartOfDayIso(item.startTime, placeTimeZone),
          durationMinutes: item.durationMinutes,
          includeUnavailable: true,
        },
        {
          enabled: isMultiCourtBooking,
        },
      ),
    ),
  );
  const multiCourtSummaryItems = React.useMemo<
    MultiCourtBookingSummaryItem[]
  >(() => {
    const courtLabelById = new Map(
      (place?.courts ?? []).map((court) => [court.id, court.label]),
    );

    return multiCourtItems.map((item, index) => {
      const query = multiCourtAvailabilityQueries[index];
      const options =
        (
          query?.data as
            | {
                options?: Array<{
                  courtId: string;
                  courtLabel: string;
                  startTime: string;
                  endTime: string;
                  totalPriceCents: number;
                  currency?: string | null;
                  status: string;
                }>;
              }
            | undefined
        )?.options ?? [];
      const matchedOption = options.find(
        (option) =>
          option.courtId === item.courtId &&
          option.startTime === item.startTime,
      );
      const isAvailable = matchedOption?.status === "AVAILABLE";

      return {
        courtId: item.courtId,
        courtLabel:
          matchedOption?.courtLabel ??
          courtLabelById.get(item.courtId) ??
          "Assigned venue",
        startTime: item.startTime,
        endTime:
          matchedOption?.endTime ??
          addMinutes(
            new Date(item.startTime),
            item.durationMinutes,
          ).toISOString(),
        durationMinutes: item.durationMinutes,
        totalPriceCents: isAvailable
          ? (matchedOption?.totalPriceCents ?? null)
          : null,
        currency: isAvailable ? (matchedOption?.currency ?? "PHP") : null,
        isAvailable,
      };
    });
  }, [multiCourtAvailabilityQueries, multiCourtItems, place?.courts]);
  const multiCourtTotals = React.useMemo(
    () =>
      computeReservationGroupTotals(
        multiCourtSummaryItems.flatMap((item) =>
          item.totalPriceCents !== null && item.currency
            ? [
                {
                  totalPriceCents: item.totalPriceCents,
                  currency: item.currency,
                },
              ]
            : [],
        ),
      ),
    [multiCourtSummaryItems],
  );
  const hasMixedMultiCourtCurrencies = multiCourtTotals.hasMixedCurrencies;
  const hasUnavailableMultiCourtItems = multiCourtSummaryItems.some(
    (item) => !item.isAvailable,
  );
  const hasIncompleteMultiCourtPricing = multiCourtSummaryItems.some(
    (item) => item.totalPriceCents === null || !item.currency,
  );
  const isResolvingMultiCourtAvailability =
    isMultiCourtBooking &&
    multiCourtAvailabilityQueries.some(
      (query) => query.isLoading || query.isFetching,
    );
  const multiCourtTotalPriceCents =
    !hasMixedMultiCourtCurrencies && !hasIncompleteMultiCourtPricing
      ? multiCourtTotals.totalPriceCents
      : 0;
  const multiCourtCurrency = multiCourtTotals.currency ?? "PHP";

  const selectedSlot = availability.find(
    (slot) => slot.startTime === startTime,
  );
  const hasResolvableInputs =
    !isMultiCourtBooking &&
    !!resolvedPlaceId &&
    !!startTime &&
    !!bookingDate &&
    durationMinutes > 0 &&
    (mode === "court" ? !!courtId : !!sportId);
  const isResolvingAvailability =
    hasResolvableInputs &&
    !selectedSlot &&
    (availabilityQuery.isLoading || availabilityQuery.isFetching);

  const assignedCourt = React.useMemo(() => {
    if (!place || isMultiCourtBooking) return undefined;
    const targetCourtId =
      mode === "court" ? courtId : (selectedSlot?.courtId ?? undefined);
    return place.courts.find((court) => court.id === targetCourtId);
  }, [courtId, isMultiCourtBooking, mode, place, selectedSlot?.courtId]);

  const assignedCourtLabel =
    assignedCourt?.label ?? selectedSlot?.courtLabel ?? "Assigned at checkout";

  const addonCourtId = isMultiCourtBooking
    ? undefined
    : (assignedCourt?.id ?? selectedSlot?.courtId);
  const { addons: availableCourtAddons, globalAddonIds } = useCombinedAddons(
    resolvedPlaceId,
    addonCourtId,
  );

  React.useEffect(() => {
    if (isMultiCourtBooking) return;
    if (!addonCourtId) return;
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
      const encoded = next.map((a) =>
        a.quantity === 1 ? a.addonId : `${a.addonId}:${a.quantity}`,
      );
      void setBookingParams({
        addonIds: encoded.length > 0 ? encoded : null,
      });
    }
  }, [
    addonCourtId,
    availableCourtAddons,
    isMultiCourtBooking,
    selectedAddons,
    setBookingParams,
  ]);

  const handleSelectedAddonsChange = React.useCallback(
    (nextAddons: SelectedAddon[]) => {
      const encoded = nextAddons.map((a) =>
        a.quantity === 1 ? a.addonId : `${a.addonId}:${a.quantity}`,
      );
      void setBookingParams({
        addonIds: encoded.length > 0 ? encoded : null,
      });
    },
    [setBookingParams],
  );

  const endTime = startTime
    ? addMinutes(new Date(startTime), durationMinutes).toISOString()
    : undefined;

  const totalPrice = isMultiCourtBooking
    ? multiCourtTotalPriceCents
    : (selectedSlot?.totalPriceCents ?? 0);
  const currency = isMultiCourtBooking
    ? multiCourtCurrency
    : (selectedSlot?.currency ?? "PHP");
  const baseSelectedSlot = (availabilityWithoutAddonsQuery.data ?? []).find(
    (slot) => slot.startTime === startTime,
  );
  const pricingBreakdown = selectedSlot?.pricingBreakdown;
  const basePriceCents = isMultiCourtBooking
    ? totalPrice
    : (pricingBreakdown?.basePriceCents ??
      (selectedAddons.length > 0
        ? (baseSelectedSlot?.totalPriceCents ?? undefined)
        : totalPrice));
  const addonPriceCents =
    pricingBreakdown?.addonPriceCents ??
    (basePriceCents !== undefined
      ? Math.max(0, totalPrice - basePriceCents)
      : 0);
  const pricingWarnings = selectedSlot?.pricingWarnings ?? [];

  const [showProfileModal, setShowProfileModal] = React.useState(false);
  const [termsAccepted, setTermsAccepted] = React.useState(false);
  const [hostAsOpenPlay, setHostAsOpenPlay] = React.useState(false);
  const [openPlayMaxPlayers, setOpenPlayMaxPlayers] = React.useState(4);
  const [openPlayJoinPolicy, setOpenPlayJoinPolicy] = React.useState<
    "REQUEST" | "AUTO"
  >("REQUEST");
  const [openPlayVisibility, setOpenPlayVisibility] = React.useState<
    "PUBLIC" | "UNLISTED"
  >("PUBLIC");
  const [openPlayNote, setOpenPlayNote] = React.useState("");
  const [openPlayPaymentInstructions, setOpenPlayPaymentInstructions] =
    React.useState("");
  const [openPlayPaymentLinkUrl, setOpenPlayPaymentLinkUrl] =
    React.useState("");
  const detailsSectionRef = React.useRef<HTMLDivElement | null>(null);
  const isSubmitting =
    createForCourt.isPending ||
    createForAnyCourt.isPending ||
    createGroup.isPending ||
    createOpenPlay.isPending ||
    createOpenPlayFromGroup.isPending;

  const suggestedSplitPerPlayerCents =
    totalPrice > 0
      ? Math.ceil(totalPrice / Math.max(1, openPlayMaxPlayers))
      : 0;

  React.useEffect(() => {
    if (initialOpenPlayEnabled) {
      setHostAsOpenPlay(true);
    }
  }, [initialOpenPlayEnabled]);

  React.useEffect(() => {
    if (totalPrice > 0 && openPlayJoinPolicy !== "REQUEST") {
      setOpenPlayJoinPolicy("REQUEST");
    }
  }, [openPlayJoinPolicy, totalPrice]);

  const profileComplete = isProfileComplete(profile);

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

  const handleConfirm = async () => {
    if (isSubmitting) return;

    if (isMultiCourtBooking) {
      if (!resolvedPlaceId) {
        toast.error("Venue details unavailable.");
        return;
      }
      if (hasInvalidMultiCourtItems || multiCourtItems.length < 2) {
        toast.error(
          "Multi-venue selection is incomplete. Please reselect slots.",
        );
        return;
      }
      if (isResolvingMultiCourtAvailability) {
        toast.error(
          "Checking latest availability. Please try again in a moment.",
        );
        return;
      }
      if (
        hasUnavailableMultiCourtItems ||
        hasIncompleteMultiCourtPricing ||
        hasMixedMultiCourtCurrencies
      ) {
        toast.error(
          "One or more selected slots are unavailable. Please adjust your selections.",
        );
        return;
      }

      try {
        const groupResult = await createGroup.mutateAsync({
          placeId: resolvedPlaceId,
          items: multiCourtItems.map((item) => ({
            courtId: item.courtId,
            startTime: item.startTime,
            durationMinutes: item.durationMinutes,
          })),
        });

        if (hostAsOpenPlay && groupResult.reservationGroupId) {
          try {
            await createOpenPlayFromGroup.mutateAsync({
              reservationGroupId: groupResult.reservationGroupId,
              maxPlayers: Math.max(2, Math.min(32, openPlayMaxPlayers)),
              joinPolicy: openPlayJoinPolicy,
              visibility: openPlayVisibility,
              note:
                openPlayNote.trim().length > 0
                  ? openPlayNote.trim()
                  : undefined,
              paymentInstructions:
                openPlayPaymentInstructions.trim().length > 0
                  ? openPlayPaymentInstructions.trim()
                  : undefined,
              paymentLinkUrl:
                openPlayPaymentLinkUrl.trim().length > 0
                  ? openPlayPaymentLinkUrl.trim()
                  : undefined,
            });
          } catch (_openPlayError) {
            toast.error(
              "Reservation group created. Open Play wasn't created — you can create it later.",
            );
          }
        }

        const groupReservationId = groupResult.items[0]?.id;
        if (!groupReservationId) {
          toast.error(
            "Reservation group created without a primary reservation.",
          );
          return;
        }
        const payableItem = groupResult.items.find(
          (item) =>
            item.totalPriceCents > 0 && item.status === "AWAITING_PAYMENT",
        );

        try {
          await warmupReservationPage({
            reservationId: groupReservationId,
            paymentInfoReservationId: payableItem?.id,
          });
        } catch {
          // Best-effort warmup; navigation should continue.
        }

        router.push(
          payableItem
            ? getPlayerReservationPaymentPath(groupReservationId)
            : appRoutes.reservations.detail(groupReservationId),
        );
      } catch (_error) {
        // toast handled by mutation hooks
      }
      return;
    }

    if (!selectedSlot) return;
    if (mode === "court" && !courtId) {
      toast.error("Select a venue to continue.");
      return;
    }
    if (mode === "any" && !sportId) {
      toast.error("Select a sport to continue.");
      return;
    }
    if (mode === "any" && !resolvedPlaceId) {
      toast.error("Venue details unavailable.");
      return;
    }

    try {
      const payload = {
        startTime: selectedSlot.startTime,
        durationMinutes,
        selectedAddons: selectedAddons.length > 0 ? selectedAddons : undefined,
      };
      let result: { status: string; id: string };
      if (mode === "court" && courtId) {
        result = await createForCourt.mutateAsync({
          courtId,
          ...payload,
        });
      } else {
        if (!resolvedPlaceId) {
          toast.error("Venue details unavailable.");
          return;
        }
        result = await createForAnyCourt.mutateAsync({
          placeId: resolvedPlaceId,
          sportId: sportId ?? "",
          ...payload,
        });
      }

      let _openPlayId: string | null = null;
      if (hostAsOpenPlay) {
        try {
          const created = await createOpenPlay.mutateAsync({
            reservationId: result.id,
            maxPlayers: Math.max(2, Math.min(32, openPlayMaxPlayers)),
            joinPolicy: openPlayJoinPolicy,
            visibility: openPlayVisibility,
            note:
              openPlayNote.trim().length > 0 ? openPlayNote.trim() : undefined,
            paymentInstructions:
              openPlayPaymentInstructions.trim().length > 0
                ? openPlayPaymentInstructions.trim()
                : undefined,
            paymentLinkUrl:
              openPlayPaymentLinkUrl.trim().length > 0
                ? openPlayPaymentLinkUrl.trim()
                : undefined,
          });
          _openPlayId = created.openPlayId;
        } catch (_error) {
          toast.error(
            "Reservation created. Open Play wasn't created - you can create it from Reservation Details.",
          );
        }
      }

      clearPendingBooking();
      const requiresPayment = result.status === "AWAITING_PAYMENT";
      try {
        await warmupReservationPage({
          reservationId: result.id,
          paymentInfoReservationId: requiresPayment ? result.id : undefined,
        });
      } catch {
        // Best-effort warmup; navigation should continue.
      }
      router.push(
        requiresPayment
          ? getPlayerReservationPaymentPath(result.id)
          : appRoutes.reservations.detail(result.id),
      );
    } catch (_error) {
      // toast handled by mutation hooks
    }
  };

  if (isLoading || isLoadingProfile) {
    return <PlaceBookingSkeleton />;
  }

  if (!place || !showBooking) {
    return (
      <Container className="py-12">
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-bold">Bookings not available</h1>
          <p className="text-muted-foreground">
            This venue is not accepting online reservations right now.
          </p>
          <Link
            href={appRoutes.places.detail(placeSlugOrId)}
            className="text-primary hover:underline inline-block"
          >
            Back to venue
          </Link>
        </div>
      </Container>
    );
  }

  if (isResolvingAvailability || isResolvingMultiCourtAvailability) {
    return <PlaceBookingSkeleton />;
  }

  if (isMultiCourtBooking) {
    if (hasInvalidMultiCourtItems || multiCourtItems.length < 2) {
      return (
        <Container className="py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Booking details missing</h1>
            <p className="text-muted-foreground mt-2">
              Please return to the venue page and reselect your multi-venue
              slots.
            </p>
            <Link
              href={appRoutes.places.detail(placeSlugOrId)}
              className="text-primary hover:underline mt-4 inline-block"
            >
              Back to venue
            </Link>
          </div>
        </Container>
      );
    }
  } else if (!selectedSlot || !endTime) {
    return (
      <Container className="py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Booking details missing</h1>
          <p className="text-muted-foreground mt-2">
            Please return to the venue page and select a valid time slot.
          </p>
          <Link
            href={appRoutes.places.detail(placeSlugOrId)}
            className="text-primary hover:underline mt-4 inline-block"
          >
            Back to venue
          </Link>
        </div>
      </Container>
    );
  }

  const courtSummaryName = assignedCourt?.label ?? selectedSlot?.courtLabel;
  const courtSummary = isMultiCourtBooking
    ? null
    : {
        name: courtSummaryName
          ? `${place.name} · ${courtSummaryName}`
          : place.name,
        address: place.address,
        coverImageUrl: place.coverImageUrl,
      };

  const timeSlot = isMultiCourtBooking
    ? {
        startTime:
          multiCourtSummaryItems[0]?.startTime ?? new Date().toISOString(),
        endTime:
          multiCourtSummaryItems[multiCourtSummaryItems.length - 1]?.endTime ??
          new Date().toISOString(),
        priceCents: totalPrice,
        currency,
      }
    : {
        startTime: selectedSlot?.startTime ?? new Date().toISOString(),
        endTime: endTime ?? selectedSlot?.endTime ?? new Date().toISOString(),
        priceCents: totalPrice,
        currency,
      };

  return (
    <Container className="py-6">
      <div className="space-y-6">
        <div className="space-y-2">
          <Progress value={100} className="h-2" />
          <p className="text-xs text-muted-foreground">
            Step 2 of 2 · Review and confirm
          </p>
        </div>
      </div>

      {verificationDisplay.showBookingVerificationUi && (
        <div className="mt-4 rounded-lg border border-dashed px-4 py-3 text-sm">
          <div className="flex items-center gap-2 font-medium text-foreground">
            <ShieldCheck className="h-4 w-4 text-warning" />
            {verificationDisplay.verificationMessage}
          </div>
          {verificationDisplay.verificationDescription ? (
            <p className="mt-2 text-xs text-muted-foreground">
              {verificationDisplay.verificationDescription}
            </p>
          ) : null}
        </div>
      )}

      {!profileComplete && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
          <div>
            <p className="font-medium">Almost there!</p>
            <p className="text-muted-foreground text-xs mt-0.5">
              Add your name and contact so the venue owner can reach you.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowProfileModal(true)}
            className="shrink-0 text-xs font-medium text-primary hover:underline"
          >
            Complete Profile
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3 mt-8">
        <div className="lg:col-span-2 space-y-6">
          <div ref={detailsSectionRef} className="scroll-mt-24">
            {isMultiCourtBooking ? (
              <Card>
                <CardHeader>
                  <CardTitle>Booking Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    You are booking {multiCourtSummaryItems.length} venues in
                    one request.
                  </p>
                  <div className="space-y-3">
                    {multiCourtSummaryItems.map((item) => (
                      <div
                        key={encodeMultiCourtBookingItem({
                          courtId: item.courtId,
                          startTime: item.startTime,
                          durationMinutes: item.durationMinutes,
                        })}
                        className="rounded-lg border p-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-medium">
                            {place.name} · {item.courtLabel}
                          </p>
                          <Badge
                            variant={
                              item.isAvailable ? "secondary" : "destructive"
                            }
                          >
                            {item.isAvailable ? "Available" : "Unavailable"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatDateShortInTimeZone(
                            item.startTime,
                            placeTimeZone,
                          )}{" "}
                          ·{" "}
                          {formatTimeRangeInTimeZone(
                            item.startTime,
                            item.endTime,
                            placeTimeZone,
                          )}{" "}
                          ({formatDuration(item.durationMinutes)})
                        </p>
                        <p className="text-sm mt-1">
                          {item.totalPriceCents !== null && item.currency
                            ? formatCurrency(
                                item.totalPriceCents,
                                item.currency,
                              )
                            : "Pricing unavailable"}
                        </p>
                      </div>
                    ))}
                  </div>
                  {hasUnavailableMultiCourtItems ||
                  hasIncompleteMultiCourtPricing ||
                  hasMixedMultiCourtCurrencies ? (
                    <p className="text-sm text-destructive">
                      One or more selected slots are no longer available. Return
                      to the venue page to adjust your selections.
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            ) : (
              <BookingSummaryCard
                court={
                  courtSummary ?? {
                    name: place.name,
                    address: place.address,
                    coverImageUrl: place.coverImageUrl,
                  }
                }
                timeSlot={timeSlot}
                timeZone={placeTimeZone}
              />
            )}
          </div>

          {!isMultiCourtBooking ? (
            <Card>
              <CardHeader>
                <CardTitle>Assigned venue</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-2 text-sm">
                {assignedCourt?.sportName && (
                  <Badge variant="outline">{assignedCourt.sportName}</Badge>
                )}
                <span className="font-medium">{assignedCourtLabel}</span>
                {assignedCourt?.tierLabel && (
                  <Badge variant="secondary" className="ml-2">
                    {assignedCourt.tierLabel}
                  </Badge>
                )}
              </CardContent>
            </Card>
          ) : null}

          {!isMultiCourtBooking && addonCourtId ? (
            <Card>
              <CardHeader>
                <CardTitle>Optional extras</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Extras adjust your final booking total instantly.
                </p>
                <PlayerAddonSelector
                  addons={availableCourtAddons}
                  selectedAddons={selectedAddons}
                  onSelectedAddonsChange={handleSelectedAddonsChange}
                  globalAddonIds={globalAddonIds}
                />
              </CardContent>
            </Card>
          ) : null}

          <ProfilePreviewCard
            profile={{
              displayName: profile?.displayName ?? undefined,
              email: profile?.email ?? undefined,
              phone: profile?.phoneNumber ?? undefined,
              avatarUrl: profile?.avatarUrl ?? undefined,
            }}
            isComplete={profileComplete}
            redirectTo={bookingRedirect}
            onEditClick={() => setShowProfileModal(true)}
          />

          <Card>
            <CardHeader>
              <CardTitle>Reservation contract</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span>
                  After you confirm, your request is held while the owner
                  reviews availability.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-primary" />
                <span>
                  {isMultiCourtBooking
                    ? `${multiCourtSummaryItems.length} venues · ${formatCurrency(
                        totalPrice,
                        currency,
                      )}`
                    : `Duration: ${formatDuration(durationMinutes)} ·${formatCurrency(
                        totalPrice,
                        currency,
                      )}`}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Open Play</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium">Host as Open Play</div>
                  <div className="text-xs text-muted-foreground">
                    Create a joinable session for other players after your
                    reservation is confirmed.
                  </div>
                </div>
                <Switch
                  checked={hostAsOpenPlay}
                  onCheckedChange={setHostAsOpenPlay}
                />
              </div>

              {isMultiCourtBooking && hostAsOpenPlay ? (
                <p className="text-xs text-muted-foreground">
                  Open Play will be created across all venues in your booking.
                </p>
              ) : null}

              {hostAsOpenPlay ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="openPlayMaxPlayers">Max players</Label>
                    <Input
                      id="openPlayMaxPlayers"
                      type="number"
                      min={2}
                      max={32}
                      value={openPlayMaxPlayers}
                      onChange={(e) => {
                        const next = Number.parseInt(e.target.value, 10);
                        setOpenPlayMaxPlayers(Number.isFinite(next) ? next : 4);
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Includes you as the host.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Join policy</Label>
                    <Select
                      value={openPlayJoinPolicy}
                      onValueChange={(value) =>
                        setOpenPlayJoinPolicy(value as "REQUEST" | "AUTO")
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="REQUEST">
                          Request (Host approves)
                        </SelectItem>
                        <SelectItem value="AUTO" disabled={totalPrice > 0}>
                          Auto-join (If spots)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {totalPrice > 0 ? (
                      <p className="text-xs text-muted-foreground">
                        Paid sessions require host approval.
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label>Visibility</Label>
                    <Select
                      value={openPlayVisibility}
                      onValueChange={(value) =>
                        setOpenPlayVisibility(value as "PUBLIC" | "UNLISTED")
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PUBLIC">Public</SelectItem>
                        <SelectItem value="UNLISTED">
                          Unlisted (Link only)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="openPlayNote">Note (optional)</Label>
                    <Input
                      id="openPlayNote"
                      value={openPlayNote}
                      onChange={(e) => setOpenPlayNote(e.target.value)}
                      placeholder="e.g. Beginner-friendly, bring extra balls"
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label>Reservation total</Label>
                    <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm">
                      {formatCurrency(totalPrice, currency)}
                    </div>
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label>Suggested split</Label>
                    <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm">
                      Est.{" "}
                      {formatCurrency(suggestedSplitPerPlayerCents, currency)}
                      /player (based on {openPlayMaxPlayers} players)
                    </div>
                    {totalPrice > 0 ? (
                      <p className="text-xs text-muted-foreground">
                        For paid sessions, use Request so you can confirm
                        players after payment.
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="openPlayPaymentInstructions">
                      Payment instructions (optional)
                    </Label>
                    <Input
                      id="openPlayPaymentInstructions"
                      value={openPlayPaymentInstructions}
                      onChange={(e) =>
                        setOpenPlayPaymentInstructions(e.target.value)
                      }
                      placeholder="e.g. GCash 09xx..., send screenshot in chat"
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="openPlayPaymentLinkUrl">
                      Payment link (optional)
                    </Label>
                    <Input
                      id="openPlayPaymentLinkUrl"
                      type="url"
                      value={openPlayPaymentLinkUrl}
                      onChange={(e) =>
                        setOpenPlayPaymentLinkUrl(e.target.value)
                      }
                      placeholder="https://..."
                    />
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div>
          {isMultiCourtBooking ? (
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-primary hover:text-primary"
                  onClick={() => scrollToSection(detailsSectionRef)}
                >
                  Review booking details
                </Button>

                <div className="space-y-2">
                  {multiCourtSummaryItems.map((item) => (
                    <div
                      key={`summary-${encodeMultiCourtBookingItem({
                        courtId: item.courtId,
                        startTime: item.startTime,
                        durationMinutes: item.durationMinutes,
                      })}`}
                      className="flex items-start justify-between gap-3 text-sm"
                    >
                      <span className="text-muted-foreground">
                        {item.courtLabel} ·{" "}
                        {formatTimeRangeInTimeZone(
                          item.startTime,
                          item.endTime,
                          placeTimeZone,
                        )}
                      </span>
                      <span>
                        {item.totalPriceCents !== null && item.currency
                          ? formatCurrency(item.totalPriceCents, item.currency)
                          : "N/A"}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between font-medium text-lg pt-4 border-t">
                  <span>Total</span>
                  <span>{formatCurrency(totalPrice, currency)}</span>
                </div>

                <div className="flex items-start gap-2 pt-4">
                  <Checkbox
                    id="terms"
                    checked={termsAccepted}
                    onCheckedChange={(checked) =>
                      setTermsAccepted(checked === true)
                    }
                  />
                  <Label
                    htmlFor="terms"
                    className="text-sm leading-snug cursor-pointer"
                  >
                    I agree to the{" "}
                    <a
                      href={appRoutes.terms.base}
                      className="text-primary hover:underline"
                    >
                      Terms and Conditions
                    </a>{" "}
                    and{" "}
                    <a
                      href={appRoutes.privacy.base}
                      className="text-primary hover:underline"
                    >
                      Privacy Policy
                    </a>
                  </Label>
                </div>

                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleConfirm}
                  disabled={
                    !profileComplete ||
                    !termsAccepted ||
                    isSubmitting ||
                    hasInvalidMultiCourtItems ||
                    hasUnavailableMultiCourtItems ||
                    hasIncompleteMultiCourtPricing ||
                    hasMixedMultiCourtCurrencies ||
                    isResolvingMultiCourtAvailability
                  }
                >
                  {isSubmitting ? "Confirming..." : "Confirm Booking"}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="relative">
              <OrderSummary
                timeSlot={timeSlot}
                basePriceCents={basePriceCents}
                addonPriceCents={addonPriceCents}
                addons={pricingBreakdown?.addons}
                pricingWarnings={pricingWarnings}
                timeZone={placeTimeZone}
                termsAccepted={termsAccepted}
                onTermsChange={setTermsAccepted}
                onConfirm={handleConfirm}
                onReviewDetails={() => scrollToSection(detailsSectionRef)}
                reviewLabel="Review booking details"
                isSubmitting={isSubmitting}
                disabled={!profileComplete}
                className="sticky top-24"
              />
              {!profileComplete && (
                <div className="absolute inset-0 top-32 flex flex-col items-center justify-start rounded-xl bg-background/80 backdrop-blur-sm pt-8 px-4 text-center">
                  <p className="text-sm font-medium text-foreground">
                    Set up your profile to confirm
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowProfileModal(true)}
                    className="mt-3 text-sm font-semibold text-primary hover:underline"
                  >
                    Complete Profile →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <ProfileSetupModal
        open={showProfileModal}
        onOpenChange={setShowProfileModal}
      />
    </Container>
  );
}

function PlaceBookingSkeleton() {
  return (
    <Container className="py-6">
      <div className="h-6 w-48 bg-muted rounded animate-pulse mb-6" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-64 bg-muted rounded-xl animate-pulse" />
          <div className="h-48 bg-muted rounded-xl animate-pulse" />
        </div>
        <div>
          <div className="h-80 bg-muted rounded-xl animate-pulse" />
        </div>
      </div>
    </Container>
  );
}
