import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  toastSuccessSpy,
  toastErrorSpy,
  logoutMutateAsyncSpy,
  invalidateOwnerReservationsOverviewSpy,
  acceptMutateSpy,
  confirmMutateSpy,
  rejectMutateSpy,
  cancelMutateSpy,
  confirmPaidOfflineMutateSpy,
  historyRefetchSpy,
  reservationGroupRefetchSpy,
  reservationQueryState,
  historyQueryState,
  reservationGroupQueryState,
  paymentMethodsQueryState,
  ownerOrganizationState,
  authSessionState,
} = vi.hoisted(() => ({
  toastSuccessSpy: vi.fn(),
  toastErrorSpy: vi.fn(),
  logoutMutateAsyncSpy: vi.fn(async () => undefined),
  invalidateOwnerReservationsOverviewSpy: vi.fn(async () => undefined),
  acceptMutateSpy: vi.fn(),
  confirmMutateSpy: vi.fn(),
  rejectMutateSpy: vi.fn(),
  cancelMutateSpy: vi.fn(),
  confirmPaidOfflineMutateSpy: vi.fn(),
  historyRefetchSpy: vi.fn(async () => undefined),
  reservationGroupRefetchSpy: vi.fn(async () => undefined),
  reservationQueryState: {
    data: null as Record<string, unknown> | null,
    isLoading: false,
    refetch: vi.fn(async () => undefined),
  },
  historyQueryState: {
    data: [] as Array<Record<string, unknown>>,
    isLoading: false,
    refetch: vi.fn(async () => undefined),
  },
  reservationGroupQueryState: {
    data: { reservations: [] as Array<Record<string, unknown>> },
    isLoading: false,
    refetch: vi.fn(async () => undefined),
  },
  paymentMethodsQueryState: {
    data: {
      methods: [
        {
          id: "method-1",
          provider: "GCash",
          accountName: "Kudos Courts",
          isDefault: true,
          isActive: true,
        },
      ],
    } as { methods: Array<Record<string, unknown>> } | undefined,
  },
  ownerOrganizationState: {
    organization: { id: "org-1", name: "Kudos Courts" },
    organizations: [],
    isLoading: false,
  },
  authSessionState: {
    data: { email: "owner@example.com" },
  },
}));

vi.mock("@/common/toast", () => ({
  toast: {
    success: toastSuccessSpy,
    error: toastErrorSpy,
  },
}));

vi.mock("@/components/layout", () => ({
  AppShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/features/auth", () => ({
  useQueryAuthSession: () => authSessionState,
  useMutAuthLogout: () => ({
    mutateAsync: logoutMutateAsyncSpy,
  }),
}));

vi.mock("@/features/owner/components", () => ({
  OwnerNavbar: () => <div>Owner Navbar</div>,
  OwnerSidebar: () => <div>Owner Sidebar</div>,
  ReservationAlertsPanel: () => <div>Reservation Alerts</div>,
}));

vi.mock("@/features/owner/components/confirm-dialog", () => ({
  ConfirmDialog: ({
    open,
    onConfirm,
    confirmLabel = "Confirm",
  }: {
    open: boolean;
    onConfirm: () => void;
    confirmLabel?: string;
  }) =>
    open ? (
      <button onClick={onConfirm} type="button">
        {confirmLabel}
      </button>
    ) : null,
}));

vi.mock("@/features/owner/components/reject-modal", () => ({
  RejectModal: ({
    open,
    onReject,
    submitLabel = "Reject Reservation",
  }: {
    open: boolean;
    onReject: (reason: string) => void;
    submitLabel?: string;
  }) =>
    open ? (
      <button
        data-testid="reject-submit"
        onClick={() => onReject("Need to cancel")}
        type="button"
      >
        {submitLabel}
      </button>
    ) : null,
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ open, children }: { open: boolean; children: ReactNode }) =>
    open ? <div>{children}</div> : null,
  DialogContent: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  DialogDescription: ({ children }: { children: ReactNode }) => (
    <p>{children}</p>
  ),
  DialogFooter: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  DialogHeader: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  DialogTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
}));

vi.mock("@/components/form", async () => {
  const { FormProvider, useForm, useFormContext } = await import(
    "react-hook-form"
  );

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
    StandardFormInput: ({
      name,
      label,
      placeholder,
    }: {
      name: string;
      label: string;
      placeholder?: string;
    }) => {
      const { register } = useFormContext();
      return (
        <label>
          <span>{label}</span>
          <input
            aria-label={label}
            placeholder={placeholder}
            {...register(name)}
          />
        </label>
      );
    },
    StandardFormSelect: ({
      name,
      label,
      options,
    }: {
      name: string;
      label: string;
      options: Array<{ label: string; value: string }>;
    }) => {
      const { register } = useFormContext();
      return (
        <label>
          <span>{label}</span>
          <select aria-label={label} {...register(name)}>
            <option value="">Select</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      );
    },
  };
});

vi.mock("@/features/owner/hooks", () => ({
  useModOwnerInvalidation: () => ({
    invalidateOwnerReservationsOverview: invalidateOwnerReservationsOverviewSpy,
  }),
  useModOwnerReservationRealtimeStream: vi.fn(),
  useMutAcceptReservation: () => ({
    mutate: acceptMutateSpy,
    isPending: false,
  }),
  useMutCancelReservation: () => ({
    mutate: cancelMutateSpy,
    isPending: false,
  }),
  useMutConfirmReservation: () => ({
    mutate: confirmMutateSpy,
    isPending: false,
  }),
  useMutOwnerConfirmPaidOffline: () => ({
    mutate: confirmPaidOfflineMutateSpy,
    isPending: false,
  }),
  useMutRejectReservation: () => ({
    mutate: rejectMutateSpy,
    isPending: false,
  }),
  useQueryOrganizationPaymentMethods: () => paymentMethodsQueryState,
  useQueryOwnerOrganization: () => ownerOrganizationState,
  useQueryOwnerReservationEntity: () => reservationQueryState,
  useQueryOwnerReservationHistory: () => historyQueryState,
  useQueryReservationLinkedDetail: () => reservationGroupQueryState,
}));

import OwnerReservationDetailPage from "@/features/owner/pages/owner-reservation-detail-page";

const baseReservation = {
  id: "reservation-1",
  reservationGroupId: null,
  placeId: "place-1",
  placeName: "Kudos Courts",
  placeTimeZone: "Asia/Manila",
  courtId: "court-1",
  courtName: "Center Court",
  playerName: "Alex Player",
  playerEmail: "alex@example.com",
  playerPhone: "+63 900 000 0000",
  date: "2026-03-12",
  startTime: "9:00 AM",
  endTime: "10:00 AM",
  slotStartTime: "2026-03-12T01:00:00.000Z",
  slotEndTime: "2026-03-12T02:00:00.000Z",
  amountCents: 150000,
  currency: "PHP",
  status: "pending",
  reservationStatus: "CREATED",
  expiresAt: "2026-03-12T00:45:00.000Z",
  createdAt: "2026-03-10T01:00:00.000Z",
  paymentProof: null,
  notes: undefined,
};

function renderPage() {
  return render(<OwnerReservationDetailPage reservationId="reservation-1" />);
}

describe("OwnerReservationDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    historyQueryState.refetch = historyRefetchSpy;
    reservationGroupQueryState.refetch = reservationGroupRefetchSpy;
    reservationQueryState.data = { ...baseReservation };
    reservationQueryState.isLoading = false;
    historyQueryState.data = [];
    historyQueryState.isLoading = false;
    reservationGroupQueryState.data = { reservations: [] };
    reservationGroupQueryState.isLoading = false;
    paymentMethodsQueryState.data = {
      methods: [
        {
          id: "method-1",
          provider: "GCash",
          accountName: "Kudos Courts",
          isDefault: true,
          isActive: true,
        },
      ],
    };
  });

  it("shows Paid & Confirmed for created paid reservations", () => {
    renderPage();

    expect(
      screen.getByRole("button", { name: "Paid & Confirmed" }),
    ).toBeTruthy();
  });

  it("hides Paid & Confirmed for zero-amount reservations", () => {
    reservationQueryState.data = {
      ...baseReservation,
      amountCents: 0,
    };

    renderPage();

    expect(
      screen.queryByRole("button", { name: "Paid & Confirmed" }),
    ).toBeNull();
  });

  it("hides Paid & Confirmed when payment is already marked", () => {
    reservationQueryState.data = {
      ...baseReservation,
      reservationStatus: "PAYMENT_MARKED_BY_USER",
    };

    renderPage();

    expect(
      screen.queryByRole("button", { name: "Paid & Confirmed" }),
    ).toBeNull();
    expect(
      screen.getByRole("button", { name: "Confirm Payment" }),
    ).toBeTruthy();
  });

  it("submits paid offline details with the selected reservation payload", async () => {
    confirmPaidOfflineMutateSpy.mockImplementation(
      (_input: unknown, options?: { onSuccess?: () => void }) => {
        options?.onSuccess?.();
      },
    );

    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Paid & Confirmed" }));

    fireEvent.change(screen.getByLabelText("Payment reference"), {
      target: { value: "GCASH-12345" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Mark Paid & Confirmed" }),
    );

    await waitFor(() => {
      expect(confirmPaidOfflineMutateSpy).toHaveBeenCalledWith(
        {
          reservationId: "reservation-1",
          paymentMethodId: "method-1",
          paymentReference: "GCASH-12345",
        },
        expect.objectContaining({
          onError: expect.any(Function),
          onSuccess: expect.any(Function),
        }),
      );
    });
    expect(toastSuccessSpy).toHaveBeenCalledWith(
      "Reservation marked as paid and confirmed",
    );
  });

  it("shows payment method setup CTA when no active payment methods exist", () => {
    paymentMethodsQueryState.data = { methods: [] };

    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Paid & Confirmed" }));

    expect(
      screen.getByText(
        "You need at least one active payment method to mark reservations as paid and confirmed.",
      ),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Set up payment methods" })
        .getAttribute("href"),
    ).toContain("#payment-methods");
  });

  it("refreshes the reservation detail data through shared invalidation and local refetches", async () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));

    await waitFor(() => {
      expect(invalidateOwnerReservationsOverviewSpy).toHaveBeenCalledWith({
        reservationId: "reservation-1",
      });
    });
    expect(historyRefetchSpy).toHaveBeenCalled();
    expect(reservationGroupRefetchSpy).toHaveBeenCalled();
  });

  it("uses the cancel mutation for awaiting payment reservations", async () => {
    reservationQueryState.data = {
      ...baseReservation,
      reservationStatus: "AWAITING_PAYMENT",
    };

    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Cancel Reservation" }));
    fireEvent.click(screen.getByTestId("reject-submit"));

    await waitFor(() => {
      expect(cancelMutateSpy).toHaveBeenCalledWith(
        {
          reservationId: "reservation-1",
          reason: "Need to cancel",
        },
        expect.objectContaining({
          onError: expect.any(Function),
          onSuccess: expect.any(Function),
        }),
      );
    });
    expect(rejectMutateSpy).not.toHaveBeenCalled();
  });
});
