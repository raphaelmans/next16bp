"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { differenceInMinutes, format } from "date-fns";
import { CheckCircle, MessageSquare, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { appRoutes } from "@/common/app-routes";
import {
  formatCurrency,
  formatDateShort,
  formatTime,
  formatTimeRange,
} from "@/common/format";
import {
  getPlayerReservationDetailPath,
  PLAYER_RESERVATION_STEP_QUERY_PARAM,
  type PlayerReservationStep,
  playerReservationSteps,
} from "@/common/reservation-links";
import { toast } from "@/common/toast";
import { StandardFormProvider } from "@/components/form";
import { KudosStatusBadge, type ReservationStatus } from "@/components/kudos";
import { Container } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

import { BookingDetailsCard } from "@/features/reservation/components/booking-details-card";
import { CancelDialog } from "@/features/reservation/components/cancel-dialog";
import { CoachSessionDetailsCard } from "@/features/reservation/components/coach-session-details-card";
import { CountdownTimer } from "@/features/reservation/components/countdown-timer";
import { PaymentInfoCard } from "@/features/reservation/components/payment-info-card";
import {
  PaymentProofForm,
  type PaymentProofFormValues,
  paymentProofFormSchema,
} from "@/features/reservation/components/payment-proof-form";
import { ReservationActionsCard } from "@/features/reservation/components/reservation-actions-card";
import { ReservationExpired } from "@/features/reservation/components/reservation-expired";
import {
  ActivityTimelineSkeleton,
  BookingDetailsCardSkeleton,
  CourtOwnerCardSkeleton,
  GroupItemsCardSkeleton,
  GroupSummaryCardSkeleton,
  ReservationActionsCardSkeleton,
  StatusBannerSkeleton,
} from "@/features/reservation/components/skeletons";
import { StatusBanner } from "@/features/reservation/components/status-banner";
import { TermsCheckbox } from "@/features/reservation/components/terms-checkbox";
import {
  canShowReservationPaymentStep,
  getReservationPageDisplayStep,
} from "@/features/reservation/helpers";
import {
  useModReservationInvalidation,
  useModReservationPageWarmup,
  useModReservationRealtimePlayerStream,
  useMutAddPaymentProof,
  useMutMarkPayment,
  useMutMarkPaymentLinked,
  useMutUploadPaymentProof,
  useQueryReservationDetail,
  useQueryReservationLinkedDetail,
  useQueryReservationPaymentInfo,
} from "@/features/reservation/hooks";

interface ReservationEvent {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  triggeredByRole: "PLAYER" | "OWNER" | "SYSTEM";
  notes: string | null;
  createdAt: Date | string;
}

const RESERVATION_DETAIL_REFETCH_INTERVAL_MS = 15_000;

type ReservationDetailPageProps = {
  reservationId: string;
  initialStep?: PlayerReservationStep;
};

export default function ReservationDetailPage({
  reservationId,
  initialStep,
}: ReservationDetailPageProps) {
  const router = useRouter();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const paymentInfoSectionRef = useRef<HTMLDivElement | null>(null);
  const shouldFocusPaymentInfoRef = useRef(false);
  const { invalidateReservationPage } = useModReservationInvalidation();
  const { warmupReservationPage } = useModReservationPageWarmup();
  const [stepParam, setStepParam] = useQueryState(
    PLAYER_RESERVATION_STEP_QUERY_PARAM,
    parseAsStringLiteral(playerReservationSteps).withOptions({
      history: "push",
    }),
  );
  const requestedStep = stepParam ?? initialStep ?? null;

  const form = useForm<PaymentProofFormValues>({
    resolver: zodResolver(paymentProofFormSchema),
    mode: "onChange",
    defaultValues: {
      referenceNumber: "",
      notes: "",
      proofFile: null,
    },
  });

  const {
    reset,
    formState: { isSubmitting: formSubmitting },
  } = form;

  const { data: reservationDetail, isLoading: isLoadingReservation } =
    useQueryReservationDetail(
      reservationId,
      RESERVATION_DETAIL_REFETCH_INTERVAL_MS,
    );

  const { data: groupData, isLoading: isLoadingLinkedDetail } =
    useQueryReservationLinkedDetail(
      reservationId,
      RESERVATION_DETAIL_REFETCH_INTERVAL_MS,
    );
  const realtimeReservationIds = [
    reservationId,
    ...(groupData?.items.map((item) => item.reservationId) ?? []),
  ];

  useModReservationRealtimePlayerStream({
    enabled: realtimeReservationIds.length > 0,
    reservationIds: realtimeReservationIds,
  });

  const reservation = reservationDetail?.reservation;
  const events: ReservationEvent[] = reservationDetail?.events ?? [];
  const targetType = reservationDetail?.targetType ?? "VENUE";
  const coachRecord = reservationDetail?.coach ?? null;
  const courtRecord = reservationDetail?.court;
  const placeRecord = reservationDetail?.place;
  const placePhotos = reservationDetail?.placePhotos ?? [];
  const reservationPolicy = reservationDetail?.reservationPolicy ?? null;
  const organizationRecord = reservationDetail?.organization ?? null;
  const organizationProfile = reservationDetail?.organizationProfile ?? null;
  const isCoachReservation = targetType === "COACH";
  const reviewerLabel = isCoachReservation ? "coach" : "owner";
  const paymentRecipientLabel = isCoachReservation ? "coach" : "court owner";

  const isGroupReservation = Boolean(groupData && groupData.items.length > 1);
  const payableAwaitingItems = useMemo(() => {
    if (!groupData) return [];
    return groupData.items.filter(
      (item) => item.totalPriceCents > 0 && item.status === "AWAITING_PAYMENT",
    );
  }, [groupData]);

  const paymentInfoReservationId = useMemo(() => {
    if (!reservation) return undefined;
    if (isGroupReservation) {
      return payableAwaitingItems[0]?.reservationId;
    }
    return reservation.status === "AWAITING_PAYMENT"
      ? reservationId
      : undefined;
  }, [isGroupReservation, payableAwaitingItems, reservation, reservationId]);

  const groupExpiresInMinutes = useMemo(() => {
    const expiries = payableAwaitingItems
      .map((item) =>
        item.expiresAtIso ? new Date(item.expiresAtIso).getTime() : null,
      )
      .filter((value): value is number => value !== null && value > Date.now());
    if (expiries.length === 0) return 15;
    const nextExpiry = Math.min(...expiries);
    return Math.max(1, Math.round((nextExpiry - Date.now()) / 60_000));
  }, [payableAwaitingItems]);

  const canShowPaymentStep = canShowReservationPaymentStep({
    status: reservation?.status,
    isGroupReservation,
    hasPayableAwaitingItems: payableAwaitingItems.length > 0,
  });
  const activeStep = getReservationPageDisplayStep({
    requestedStep,
    status: reservation?.status,
    isGroupReservation,
    hasPayableAwaitingItems: payableAwaitingItems.length > 0,
  });

  const { data: paymentInfo, isLoading: isLoadingPaymentInfo } =
    useQueryReservationPaymentInfo(
      paymentInfoReservationId ?? "",
      activeStep === "payment" && Boolean(paymentInfoReservationId),
    );

  const addPaymentProof = useMutAddPaymentProof();
  const uploadPaymentProof = useMutUploadPaymentProof();
  const markPayment = useMutMarkPayment();
  const markPaymentLinked = useMutMarkPaymentLinked();

  useEffect(() => {
    if (reservation?.expiresAt) {
      setIsExpired(new Date(reservation.expiresAt) < new Date());
    }
  }, [reservation?.expiresAt]);

  useEffect(() => {
    if (!reservation || requestedStep !== "payment" || canShowPaymentStep) {
      return;
    }

    router.replace(getPlayerReservationDetailPath({ reservationId }));
  }, [canShowPaymentStep, requestedStep, reservation, reservationId, router]);

  useEffect(() => {
    if (activeStep !== "payment" || !shouldFocusPaymentInfoRef.current) {
      return;
    }

    const paymentInfoNode = paymentInfoSectionRef.current;
    if (!paymentInfoNode) {
      return;
    }

    shouldFocusPaymentInfoRef.current = false;
    window.requestAnimationFrame(() => {
      paymentInfoNode.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, [activeStep]);

  const handleRefresh = async () => {
    if (!reservationId) return;
    setIsRefreshing(true);
    try {
      await invalidateReservationPage({
        reservationId,
        paymentInfoReservationId,
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleOpenChat = (source: string) => {
    window.dispatchEvent(
      new CustomEvent("reservation-chat:open", {
        detail: {
          kind: "player",
          reservationId,
          source,
        },
      }),
    );
  };

  const handleOpenChatFromBanner = () => {
    handleOpenChat("reservation-status-banner");
  };

  const handleGoToOverview = async () => {
    await setStepParam(null);
  };

  const scrollPaymentInfoIntoView = () => {
    paymentInfoSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleGoToPaymentInfo = async () => {
    if (!canShowPaymentStep) {
      return;
    }

    if (activeStep === "payment") {
      scrollPaymentInfoIntoView();
      return;
    }

    shouldFocusPaymentInfoRef.current = true;
    await setStepParam("payment");
  };

  const handleMarkPaid = async (values: PaymentProofFormValues) => {
    try {
      const referenceNumber = values.referenceNumber?.trim() ?? "";
      const notes = values.notes?.trim() ?? "";
      const proofFile =
        values.proofFile instanceof File ? values.proofFile : null;

      if (!proofFile && notes && !referenceNumber) {
        toast.error("Reference number required when adding notes");
        return;
      }

      if (proofFile) {
        const formData = new FormData();
        formData.append("reservationId", reservationId);
        formData.append("image", proofFile, proofFile.name);
        if (referenceNumber) {
          formData.append("referenceNumber", referenceNumber);
        }
        if (notes) {
          formData.append("notes", notes);
        }

        await uploadPaymentProof.mutateAsync(formData);
      } else if (referenceNumber) {
        await addPaymentProof.mutateAsync({
          reservationId,
          referenceNumber: referenceNumber || undefined,
          notes: notes || undefined,
        });
      }

      await markPayment.mutateAsync({ reservationId, termsAccepted: true });

      try {
        await warmupReservationPage({ reservationId });
      } catch {
        // Best-effort warmup; navigation should continue.
      }

      reset({
        referenceNumber: values.referenceNumber ?? "",
        notes: values.notes ?? "",
        proofFile: null,
      });
      setTermsAccepted(false);
      router.replace(getPlayerReservationDetailPath({ reservationId }));
    } catch {
      toast.error("Failed to submit payment");
    }
  };

  const handleGroupPaymentSubmit = async () => {
    if (!termsAccepted) {
      toast.error("Please accept the terms to continue");
      return;
    }

    try {
      await markPaymentLinked.mutateAsync({
        reservationId,
        termsAccepted: true,
      });

      try {
        await warmupReservationPage({ reservationId });
      } catch {
        // Best-effort warmup; navigation should continue.
      }

      setTermsAccepted(false);
      router.replace(getPlayerReservationDetailPath({ reservationId }));
    } catch {
      // handled in mutation hook
    }
  };

  if (isLoadingReservation) {
    return (
      <Container className="py-6">
        <PageHeader
          title="Reservation"
          description="Track status, payment, and booking details without leaving this page."
          breadcrumbs={[
            { label: "My Reservations", href: appRoutes.reservations.base },
            { label: "Reservation" },
          ]}
          backHref={appRoutes.reservations.base}
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          }
        />

        <StatusBannerSkeleton />

        <div className="grid gap-6 lg:grid-cols-3 mt-6 overflow-hidden">
          <div className="lg:col-span-2 space-y-6">
            <BookingDetailsCardSkeleton />
            <CourtOwnerCardSkeleton />
            <ActivityTimelineSkeleton />
          </div>
          <div className="space-y-4">
            {isLoadingLinkedDetail ? <GroupSummaryCardSkeleton /> : null}
            <ReservationActionsCardSkeleton />
          </div>
        </div>
      </Container>
    );
  }

  if (
    !reservation ||
    (isCoachReservation ? !coachRecord : !courtRecord || !placeRecord)
  ) {
    return (
      <Container className="py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Reservation not found</h1>
          <Link
            href={appRoutes.reservations.base}
            className="text-primary hover:underline mt-4 inline-block"
          >
            View all reservations
          </Link>
        </div>
      </Container>
    );
  }

  const court = !isCoachReservation
    ? {
        id: courtRecord.id,
        name: `${placeRecord.name} - ${courtRecord.label}`,
        address: placeRecord.address,
        city: placeRecord.city,
        coverImageUrl: placePhotos[0]?.url,
        latitude: placeRecord.latitude
          ? Number.parseFloat(placeRecord.latitude)
          : undefined,
        longitude: placeRecord.longitude
          ? Number.parseFloat(placeRecord.longitude)
          : undefined,
      }
    : null;
  const venueHref =
    !isCoachReservation && placeRecord
      ? appRoutes.places.detail(placeRecord.slug ?? placeRecord.id)
      : undefined;

  const organizationForDisplay = organizationRecord
    ? {
        id: organizationRecord.id,
        name: organizationRecord.name,
      }
    : undefined;

  const effectiveReservationPolicy =
    !isCoachReservation && placeRecord.placeType === "RESERVABLE"
      ? reservationPolicy
      : null;

  const organization = {
    contactEmail: organizationProfile?.contactEmail ?? undefined,
    contactPhone: organizationProfile?.contactPhone ?? undefined,
  };

  const transformedTimeSlot = {
    id: reservation.id,
    startTime: reservation.startTime,
    endTime: reservation.endTime,
    priceCents: reservation.totalPriceCents,
    currency: reservation.currency,
    createdAt: reservation.createdAt,
  };
  const reservationPricingBreakdown = reservation.pricingBreakdown ?? null;
  const coachAddonLines =
    isCoachReservation && reservationPricingBreakdown
      ? reservationPricingBreakdown.addons
      : [];

  const isFreeSlot = transformedTimeSlot.priceCents === 0;
  const cancellationCutoffMinutes =
    effectiveReservationPolicy?.cancellationCutoffMinutes ?? 0;
  const cancellationCutoffTime = new Date(transformedTimeSlot.startTime);
  cancellationCutoffTime.setMinutes(
    cancellationCutoffTime.getMinutes() - cancellationCutoffMinutes,
  );
  const isCutoffPassed = Date.now() > cancellationCutoffTime.getTime();
  const isTerminalStatus =
    reservation.status === "EXPIRED" || reservation.status === "CANCELLED";
  const canCancel = !isCoachReservation && !isTerminalStatus && !isCutoffPassed;
  const cancelDisabledReason = isTerminalStatus
    ? "This reservation is already closed."
    : isCutoffPassed
      ? `Cancellation window closed at ${formatTime(
          cancellationCutoffTime,
        )} on ${formatDateShort(cancellationCutoffTime)}.`
      : undefined;

  const slotDate = formatDateShort(transformedTimeSlot.startTime);
  const slotTime = formatTimeRange(
    transformedTimeSlot.startTime,
    transformedTimeSlot.endTime,
  );
  const amount = isFreeSlot
    ? "Free"
    : formatCurrency(
        transformedTimeSlot.priceCents,
        transformedTimeSlot.currency,
      );

  const activityLabels: Record<string, string> = {
    CREATED: isCoachReservation
      ? "Coach session requested"
      : "Reservation requested",
    AWAITING_PAYMENT: isCoachReservation
      ? "Coach accepted (awaiting payment)"
      : "Owner accepted (awaiting payment)",
    PAYMENT_MARKED_BY_USER: "Payment marked",
    CONFIRMED: "Confirmed",
    CANCELLED: "Cancelled",
    EXPIRED: "Expired",
  };

  const activityNotes: Record<string, string> = {
    CREATED: isCoachReservation
      ? "Coach review in progress."
      : "Owner review in progress.",
    AWAITING_PAYMENT: "Complete payment before the deadline.",
    PAYMENT_MARKED_BY_USER: isCoachReservation
      ? "Awaiting coach confirmation."
      : "Awaiting owner confirmation.",
  };

  const formatEventTimestamp = (timestamp: Date | string) =>
    `${formatDateShort(timestamp)} · ${formatTime(timestamp)}`;

  const isChatEnabledForReservationStatus =
    reservation.status === "CREATED" ||
    reservation.status === "AWAITING_PAYMENT" ||
    reservation.status === "PAYMENT_MARKED_BY_USER" ||
    reservation.status === "CONFIRMED";

  const isPaymentExpired =
    reservation.status === "EXPIRED" || (reservation ? isExpired : false);

  if (reservation.status === "EXPIRED" || isPaymentExpired) {
    return (
      <Container className="py-6">
        <ReservationExpired
          placeId={!isCoachReservation ? placeRecord.id : undefined}
          courtName={
            isCoachReservation ? `Coach: ${coachRecord.name}` : court.name
          }
          slotDate={slotDate}
          slotTime={slotTime}
          amount={amount}
        />
      </Container>
    );
  }

  const isPaymentSubmitting =
    markPayment.isPending ||
    uploadPaymentProof.isPending ||
    addPaymentProof.isPending ||
    formSubmitting;
  const isPaymentPanelBusy =
    activeStep === "payment" &&
    Boolean(paymentInfoReservationId) &&
    isLoadingPaymentInfo &&
    !paymentInfo;
  const isSubmitDisabled =
    isPaymentSubmitting ||
    isPaymentPanelBusy ||
    !termsAccepted ||
    isExpired ||
    !canShowPaymentStep;
  const expiresInMinutes = reservation.expiresAt
    ? Math.max(
        1,
        differenceInMinutes(new Date(reservation.expiresAt), new Date()),
      )
    : 15;

  return (
    <Container className="py-6">
      <PageHeader
        title="Reservation"
        description="Track status, payment, and booking details without leaving this page."
        breadcrumbs={[
          { label: "My Reservations", href: appRoutes.reservations.base },
          { label: "Reservation" },
        ]}
        backHref={appRoutes.reservations.base}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        }
      />

      <StatusBanner
        status={reservation.status}
        reservationId={reservation.id}
        expiresAt={reservation.expiresAt ?? undefined}
        cancellationReason={reservation.cancellationReason ?? undefined}
        onMessageOwner={
          isChatEnabledForReservationStatus
            ? handleOpenChatFromBanner
            : undefined
        }
        onPayNow={
          canShowPaymentStep ? () => void handleGoToPaymentInfo() : undefined
        }
        counterpartyLabel={isCoachReservation ? "coach" : "owner"}
      />

      <div className="grid gap-6 lg:grid-cols-3 mt-6 overflow-hidden">
        <div className="lg:col-span-2 space-y-6">
          {activeStep === "payment" ? (
            <>
              {isCoachReservation ? (
                <CoachSessionDetailsCard
                  coach={{
                    name: coachRecord.name,
                    city: coachRecord.city,
                    province: coachRecord.province,
                    tagline: coachRecord.tagline,
                  }}
                  timeSlot={transformedTimeSlot}
                />
              ) : (
                <BookingDetailsCard
                  court={court}
                  timeSlot={transformedTimeSlot}
                  venueHref={venueHref}
                />
              )}

              {reservation.expiresAt ? (
                <CountdownTimer
                  expiresAt={reservation.expiresAt}
                  onExpire={() => setIsExpired(true)}
                />
              ) : null}

              {isLoadingLinkedDetail ? (
                <>
                  <BookingDetailsCardSkeleton />
                  <ReservationActionsCardSkeleton />
                </>
              ) : isGroupReservation ? (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>Payable Items</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {payableAwaitingItems.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          This reservation group does not have payable items
                          awaiting payment.
                        </p>
                      ) : (
                        payableAwaitingItems.map((item) => (
                          <div
                            key={item.reservationId}
                            className="rounded-lg border p-3 flex flex-wrap items-start justify-between gap-3"
                          >
                            <div>
                              <p className="font-medium">
                                {item.place.name} - {item.court.label}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {formatDateShort(item.startTimeIso)} ·{" "}
                                {formatTimeRange(
                                  item.startTimeIso,
                                  item.endTimeIso,
                                )}
                              </p>
                            </div>
                            <p className="font-medium">
                              {formatCurrency(
                                item.totalPriceCents,
                                item.currency,
                              )}
                            </p>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>

                  <div ref={paymentInfoSectionRef}>
                    <PaymentInfoCard
                      paymentMethods={paymentInfo?.methods}
                      expiresInMinutes={groupExpiresInMinutes}
                      isLoading={isPaymentPanelBusy}
                      recipientLabel={paymentRecipientLabel}
                    />
                  </div>

                  {isChatEnabledForReservationStatus ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleOpenChat("reservation-payment")}
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      {isCoachReservation ? "Message Coach" : "Message Owner"}
                    </Button>
                  ) : null}

                  <TermsCheckbox
                    checked={termsAccepted}
                    onCheckedChange={setTermsAccepted}
                  />

                  <Button
                    className="w-full"
                    size="lg"
                    disabled={!termsAccepted || isPaymentPanelBusy}
                    loading={markPaymentLinked.isPending}
                    onClick={handleGroupPaymentSubmit}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Submit Group Payment
                  </Button>
                </>
              ) : (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>Amount Due</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {format(
                            new Date(reservation.startTime),
                            "EEEE, MMMM d, yyyy",
                          )}
                        </p>
                        <p className="font-medium">
                          {formatTimeRange(
                            reservation.startTime,
                            reservation.endTime,
                          )}
                        </p>
                      </div>
                      <p className="text-2xl font-heading font-bold text-primary">
                        {amount}
                      </p>
                    </CardContent>
                  </Card>

                  <div ref={paymentInfoSectionRef}>
                    <PaymentInfoCard
                      paymentMethods={paymentInfo?.methods}
                      expiresInMinutes={expiresInMinutes}
                      isLoading={isPaymentPanelBusy}
                      recipientLabel={paymentRecipientLabel}
                    />
                  </div>

                  {isChatEnabledForReservationStatus ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => handleOpenChat("reservation-payment")}
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      {isCoachReservation ? "Message Coach" : "Message Owner"}
                    </Button>
                  ) : null}

                  <StandardFormProvider
                    form={form}
                    onSubmit={handleMarkPaid}
                    className="space-y-6"
                  >
                    <PaymentProofForm reviewerLabel={reviewerLabel} />

                    <TermsCheckbox
                      checked={termsAccepted}
                      onCheckedChange={setTermsAccepted}
                    />

                    <Button
                      type="submit"
                      disabled={isSubmitDisabled}
                      loading={isPaymentSubmitting}
                      className="w-full"
                      size="lg"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />I Have Paid
                    </Button>

                    <p className="text-xs text-muted-foreground text-center">
                      By clicking &quot;I Have Paid&quot;, you confirm that you
                      have completed the payment to the {paymentRecipientLabel}.
                      The {reviewerLabel} will verify your payment and confirm
                      your reservation.
                    </p>

                    <div className="text-center">
                      <Button
                        type="button"
                        variant="link"
                        className="text-muted-foreground"
                        onClick={() => {
                          void handleGoToOverview();
                        }}
                      >
                        Cancel and view reservation
                      </Button>
                    </div>
                  </StandardFormProvider>
                </>
              )}
            </>
          ) : (
            <>
              {isCoachReservation ? (
                <>
                  <CoachSessionDetailsCard
                    coach={{
                      name: coachRecord.name,
                      city: coachRecord.city,
                      province: coachRecord.province,
                      tagline: coachRecord.tagline,
                    }}
                    timeSlot={transformedTimeSlot}
                  />

                  <Card>
                    <CardHeader>
                      <CardTitle>Coach</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="font-medium">{coachRecord.name}</p>
                      {coachRecord.tagline ? (
                        <p className="text-sm text-muted-foreground">
                          {coachRecord.tagline}
                        </p>
                      ) : null}
                      <p className="text-sm text-muted-foreground">
                        {[coachRecord.city, coachRecord.province]
                          .filter(Boolean)
                          .join(", ") ||
                          "Coach session details will be shared directly."}
                      </p>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <>
                  <BookingDetailsCard
                    court={court}
                    timeSlot={transformedTimeSlot}
                    venueHref={venueHref}
                  />

                  {organizationForDisplay ? (
                    <Card>
                      <CardHeader>
                        <CardTitle>Court Owner</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="font-medium">
                          {organizationForDisplay.name}
                        </p>
                      </CardContent>
                    </Card>
                  ) : null}
                </>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  {events.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No activity yet.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {events.map((event, index) => {
                        const isLast = index === events.length - 1;
                        const label =
                          activityLabels[event.toStatus] ??
                          `Status updated to ${event.toStatus}`;
                        const note =
                          event.notes ?? activityNotes[event.toStatus];
                        const dotClassName =
                          event.toStatus === "CONFIRMED"
                            ? "bg-success"
                            : event.toStatus === "CANCELLED" ||
                                event.toStatus === "EXPIRED"
                              ? "bg-destructive"
                              : "bg-primary";

                        return (
                          <div key={event.id} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div
                                className={`h-2 w-2 rounded-full ${dotClassName}`}
                              />
                              {!isLast ? (
                                <div className="w-px flex-1 bg-border" />
                              ) : null}
                            </div>
                            <div className={isLast ? "" : "pb-4"}>
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-medium">{label}</p>
                                <span className="text-xs uppercase text-muted-foreground">
                                  {event.triggeredByRole}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {formatEventTimestamp(event.createdAt)}
                              </p>
                              {note ? (
                                <p className="text-sm text-muted-foreground">
                                  {note}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {isLoadingLinkedDetail ? (
                <GroupItemsCardSkeleton />
              ) : groupData ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Group Items</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {groupData.items.map((item) => (
                      <div
                        key={item.reservationId}
                        className="rounded-lg border p-3 flex flex-wrap items-start justify-between gap-3"
                      >
                        <div>
                          <p className="font-medium">
                            <Link
                              href={appRoutes.places.detail(
                                item.place.slug ?? item.place.id,
                              )}
                              className="hover:underline"
                            >
                              {item.place.name} - {item.court.label}
                            </Link>
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatDateShort(item.startTimeIso)} ·{" "}
                            {formatTimeRange(
                              item.startTimeIso,
                              item.endTimeIso,
                            )}
                          </p>
                        </div>
                        <div className="text-right space-y-1">
                          <KudosStatusBadge
                            status={item.status as ReservationStatus}
                            size="sm"
                          />
                          <p className="font-medium">
                            {formatCurrency(
                              item.totalPriceCents,
                              item.currency,
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ) : null}
            </>
          )}
        </div>

        <div className="space-y-4">
          {isLoadingLinkedDetail ? (
            <GroupSummaryCardSkeleton />
          ) : groupData ? (
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Items</span>
                  <span>{groupData.statusSummary.totalItems}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Payable Items</span>
                  <span>{groupData.statusSummary.payableItems}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Amount</span>
                  <span className="font-medium">
                    {formatCurrency(
                      groupData.reservationGroup.totalPriceCents,
                      groupData.reservationGroup.currency,
                    )}
                  </span>
                </div>
                {payableAwaitingItems.length > 0 && activeStep !== "payment" ? (
                  <div className="pt-2">
                    <Button
                      type="button"
                      className="w-full"
                      onClick={() => void handleGoToPaymentInfo()}
                    >
                      Complete Payment
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {isCoachReservation ? (
            <Card>
              <CardHeader>
                <CardTitle>Reservation Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-muted-foreground">Booking ID</span>
                  <code className="rounded bg-muted px-2 py-1 text-xs">
                    {reservation.id.slice(0, 8)}
                  </code>
                </div>
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-muted-foreground">Coach</span>
                  <span className="font-medium">{coachRecord.name}</span>
                </div>
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <KudosStatusBadge
                    status={reservation.status as ReservationStatus}
                    size="sm"
                  />
                </div>
                <div className="border-t pt-3 space-y-2">
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-muted-foreground">Session fee</span>
                    <span>
                      {formatCurrency(
                        reservationPricingBreakdown?.basePriceCents ??
                          reservation.totalPriceCents,
                        reservation.currency,
                      )}
                    </span>
                  </div>
                  {coachAddonLines.map((addon) => (
                    <div
                      key={addon.addonId}
                      className="flex items-center justify-between gap-4 text-sm"
                    >
                      <span className="text-muted-foreground">
                        {addon.addonLabel}
                        {addon.quantity > 1 ? ` x${addon.quantity}` : ""}
                      </span>
                      <span>
                        {formatCurrency(
                          addon.subtotalCents,
                          reservation.currency,
                        )}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between gap-4 pt-1 font-medium">
                    <span>Total</span>
                    <span>
                      {formatCurrency(
                        reservationPricingBreakdown?.totalPriceCents ??
                          reservation.totalPriceCents,
                        reservation.currency,
                      )}
                    </span>
                  </div>
                </div>
                {canShowPaymentStep && activeStep !== "payment" ? (
                  <Button
                    type="button"
                    className="w-full"
                    onClick={() => void handleGoToPaymentInfo()}
                  >
                    Complete Payment
                  </Button>
                ) : null}
                {isChatEnabledForReservationStatus ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => handleOpenChat("reservation-summary")}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Message Coach
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ) : (
            <ReservationActionsCard
              reservationId={reservation.id}
              status={reservation.status}
              reservationTotalPriceCents={reservation.totalPriceCents}
              reservationCurrency={reservation.currency}
              court={court}
              organization={organization}
              onCancel={() => setShowCancelDialog(true)}
              canCancel={canCancel}
              cancelDisabledReason={cancelDisabledReason}
              pingOwnerCount={reservation.pingOwnerCount ?? 0}
            />
          )}
        </div>
      </div>

      {!isCoachReservation ? (
        <CancelDialog
          reservationId={reservation.id}
          open={showCancelDialog}
          onOpenChange={setShowCancelDialog}
        />
      ) : null}
    </Container>
  );
}
