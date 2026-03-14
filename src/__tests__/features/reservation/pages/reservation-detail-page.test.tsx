import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

const {
  routerReplaceSpy,
  setQueryStateSpy,
  reservationDetailState,
  linkedDetailState,
  paymentInfoState,
} = vi.hoisted(() => ({
  routerReplaceSpy: vi.fn(),
  setQueryStateSpy: vi.fn(async () => undefined),
  reservationDetailState: {
    data: null as Record<string, unknown> | null,
    isLoading: false,
  },
  linkedDetailState: {
    data: null as Record<string, unknown> | null,
    isLoading: false,
  },
  paymentInfoState: {
    data: undefined as { methods: Array<Record<string, unknown>> } | undefined,
    isLoading: false,
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: routerReplaceSpy,
  }),
}));

vi.mock("nuqs", () => ({
  parseAsStringLiteral: () => ({
    withOptions: () => ({}),
  }),
  useQueryState: () => [null, setQueryStateSpy],
}));

vi.mock("@/common/toast", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("@/components/form", async () => {
  const { FormProvider, useForm } = await import("react-hook-form");

  return {
    StandardFormProvider: ({
      form,
      onSubmit,
      children,
    }: {
      form: ReturnType<typeof useForm<Record<string, string>>>;
      onSubmit: (values: Record<string, string>) => void;
      children: ReactNode;
    }) => (
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>{children}</form>
      </FormProvider>
    ),
  };
});

vi.mock("@/features/reservation/components/booking-details-card", () => ({
  BookingDetailsCard: ({ court }: { court: { name: string } }) => (
    <div>{`Venue booking: ${court.name}`}</div>
  ),
}));

vi.mock("@/features/reservation/components/coach-session-details-card", () => ({
  CoachSessionDetailsCard: ({ coach }: { coach: { name: string } }) => (
    <div>{`Coach session: ${coach.name}`}</div>
  ),
}));

vi.mock("@/features/reservation/components/countdown-timer", () => ({
  CountdownTimer: () => <div>Countdown</div>,
}));

vi.mock("@/features/reservation/components/payment-info-card", () => ({
  PaymentInfoCard: ({ recipientLabel }: { recipientLabel?: string }) => (
    <div>{`Payment info for ${recipientLabel ?? "court owner"}`}</div>
  ),
}));

vi.mock("@/features/reservation/components/payment-proof-form", () => ({
  paymentProofFormSchema: z.object({
    referenceNumber: z.string().optional(),
    notes: z.string().optional(),
    proofFile: z.unknown().optional().nullable(),
  }),
  PaymentProofForm: ({ reviewerLabel }: { reviewerLabel?: string }) => (
    <div>{`Payment proof for ${reviewerLabel ?? "owner"}`}</div>
  ),
}));

vi.mock("@/features/reservation/components/reservation-actions-card", () => ({
  ReservationActionsCard: () => <div>Venue reservation actions</div>,
}));

vi.mock("@/features/reservation/components/cancel-dialog", () => ({
  CancelDialog: () => null,
}));

vi.mock("@/features/reservation/components/reservation-expired", () => ({
  ReservationExpired: () => <div>Expired</div>,
}));

vi.mock("@/features/reservation/components/status-banner", () => ({
  StatusBanner: ({ counterpartyLabel }: { counterpartyLabel?: string }) => (
    <div>{`Status banner: ${counterpartyLabel ?? "owner"}`}</div>
  ),
}));

vi.mock("@/features/reservation/components/terms-checkbox", () => ({
  TermsCheckbox: () => <div>Terms Checkbox</div>,
}));

vi.mock("@/features/reservation/components/skeletons", () => ({
  ActivityTimelineSkeleton: () => <div>Activity Skeleton</div>,
  BookingDetailsCardSkeleton: () => <div>Booking Skeleton</div>,
  CourtOwnerCardSkeleton: () => <div>Court Owner Skeleton</div>,
  GroupItemsCardSkeleton: () => <div>Group Items Skeleton</div>,
  GroupSummaryCardSkeleton: () => <div>Group Summary Skeleton</div>,
  ReservationActionsCardSkeleton: () => <div>Actions Skeleton</div>,
  StatusBannerSkeleton: () => <div>Status Skeleton</div>,
}));

vi.mock("@/features/reservation/hooks", () => ({
  useModReservationInvalidation: () => ({
    invalidateReservationPage: vi.fn(async () => undefined),
  }),
  useModReservationPageWarmup: () => ({
    warmupReservationPage: vi.fn(async () => undefined),
  }),
  useModReservationRealtimePlayerStream: vi.fn(),
  useMutAddPaymentProof: () => ({
    isPending: false,
    mutateAsync: vi.fn(async () => undefined),
  }),
  useMutMarkPayment: () => ({
    isPending: false,
    mutateAsync: vi.fn(async () => undefined),
  }),
  useMutMarkPaymentLinked: () => ({
    isPending: false,
    mutateAsync: vi.fn(async () => undefined),
  }),
  useMutUploadPaymentProof: () => ({
    isPending: false,
    mutateAsync: vi.fn(async () => undefined),
  }),
  useQueryReservationDetail: () => reservationDetailState,
  useQueryReservationLinkedDetail: () => linkedDetailState,
  useQueryReservationPaymentInfo: () => paymentInfoState,
}));

import ReservationDetailPage from "@/features/reservation/pages/reservation-detail-page";

const baseReservation = {
  id: "reservation-1",
  playerId: "profile-1",
  status: "CREATED",
  startTime: "2026-03-16T01:00:00.000Z",
  endTime: "2026-03-16T02:00:00.000Z",
  totalPriceCents: 250000,
  currency: "PHP",
  createdAt: "2026-03-15T01:00:00.000Z",
  expiresAt: "2026-03-15T04:00:00.000Z",
  cancellationReason: null,
  pingOwnerCount: 0,
};

function renderPage() {
  return render(<ReservationDetailPage reservationId="reservation-1" />);
}

describe("ReservationDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    linkedDetailState.data = null;
    linkedDetailState.isLoading = false;
    paymentInfoState.data = undefined;
    paymentInfoState.isLoading = false;
  });

  it("renders the coach reservation branch without venue records", () => {
    reservationDetailState.data = {
      reservation: {
        ...baseReservation,
        courtId: null,
        coachId: "coach-1",
        pricingBreakdown: {
          basePriceCents: 250000,
          addonPriceCents: 4000,
          totalPriceCents: 254000,
          addons: [
            {
              addonId: "addon-1",
              addonLabel: "Warm-up drills",
              pricingType: "FLAT",
              quantity: 2,
              subtotalCents: 4000,
            },
          ],
        },
      },
      events: [],
      targetType: "COACH",
      coach: {
        id: "coach-1",
        name: "Coach Carla",
        city: "Pasig",
        province: "Metro Manila",
        tagline: "Private lessons for match prep",
      },
      court: null,
      place: null,
      placePhotos: [],
      reservationPolicy: null,
      organization: null,
      organizationProfile: null,
    };

    renderPage();

    expect(screen.getByText("Coach session: Coach Carla")).toBeTruthy();
    expect(screen.getByText("Private lessons for match prep")).toBeTruthy();
    expect(screen.getByText("Reservation Summary")).toBeTruthy();
    expect(screen.getByText("Warm-up drills x2")).toBeTruthy();
    expect(screen.getByText("₱40.00")).toBeTruthy();
    expect(screen.getByText("₱2,540.00")).toBeTruthy();
    expect(screen.getByText("Status banner: coach")).toBeTruthy();
    expect(screen.getAllByText("Message Coach").length).toBeGreaterThan(0);
    expect(screen.queryByText("Venue reservation actions")).toBeNull();
    expect(screen.queryByText("Reservation not found")).toBeNull();
  });

  it("keeps the venue reservation path rendering the venue action card", () => {
    reservationDetailState.data = {
      reservation: {
        ...baseReservation,
        courtId: "court-1",
        coachId: null,
      },
      events: [],
      targetType: "VENUE",
      coach: null,
      court: {
        id: "court-1",
        label: "Center Court",
      },
      place: {
        id: "place-1",
        slug: "kudos-courts",
        name: "Kudos Courts",
        address: "123 Test St",
        city: "Pasig",
        latitude: null,
        longitude: null,
        placeType: "RESERVABLE",
      },
      placePhotos: [],
      reservationPolicy: null,
      organization: {
        id: "org-1",
        name: "Kudos Courts",
      },
      organizationProfile: {
        contactEmail: "owner@example.com",
        contactPhone: "+63 900 000 0000",
      },
    };

    renderPage();

    expect(
      screen.getByText("Venue booking: Kudos Courts - Center Court"),
    ).toBeTruthy();
    expect(screen.getByText("Venue reservation actions")).toBeTruthy();
    expect(screen.getByText("Court Owner")).toBeTruthy();
    expect(screen.getByText("Status banner: owner")).toBeTruthy();
  });
});
