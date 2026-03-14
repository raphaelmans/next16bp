import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const detailState = vi.hoisted(() => ({
  data: null as Record<string, unknown> | null,
  isLoading: false,
  error: null as Error | null,
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ open, children }: { open?: boolean; children: ReactNode }) =>
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

vi.mock("@/features/coach/hooks", () => ({
  useQueryCoachReservationDetail: () => detailState,
  useMutCoachAcceptReservation: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useMutCoachRejectReservation: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useMutCoachConfirmPayment: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useMutCoachCancelReservation: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("@/features/coach/components/coach-reservation-chat-sheet", () => ({
  CoachReservationChatSheet: ({ playerName }: { playerName: string }) => (
    <div>{`Chat sheet for ${playerName}`}</div>
  ),
}));

vi.mock("@/features/reservation/components/payment-proof-display", () => ({
  PaymentProofDisplay: ({
    paymentProof,
  }: {
    paymentProof: {
      referenceNumber?: string | null;
      notes?: string | null;
      fileUrl?: string | null;
    };
  }) => (
    <div>
      <div>Rendered payment proof</div>
      {paymentProof.referenceNumber ? (
        <div>{`Reference Number: ${paymentProof.referenceNumber}`}</div>
      ) : null}
      {paymentProof.notes ? <div>{paymentProof.notes}</div> : null}
      {paymentProof.fileUrl ? <div>View Receipt Image</div> : null}
    </div>
  ),
}));

import { CoachReservationDetailPage } from "@/features/coach/pages/coach-reservation-detail-page";

const baseReservation = {
  id: "reservation-1",
  status: "AWAITING_PAYMENT",
  startTime: "2026-03-16T01:00:00.000Z",
  endTime: "2026-03-16T02:00:00.000Z",
  totalPriceCents: 250000,
  currency: "PHP",
  createdAt: "2026-03-15T01:00:00.000Z",
  expiresAt: "2026-03-15T04:00:00.000Z",
  cancellationReason: null,
  playerNameSnapshot: "Player One",
  playerEmailSnapshot: "player@example.com",
  playerPhoneSnapshot: "+63 900 000 0000",
};

describe("CoachReservationDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    detailState.isLoading = false;
    detailState.error = null;
    detailState.data = {
      reservation: baseReservation,
      events: [],
      coach: {
        id: "coach-1",
        name: "Coach Carla",
      },
      paymentProof: null,
    };
  });

  it("renders proof-submitted payment state and proof metadata", () => {
    detailState.data = {
      reservation: {
        ...baseReservation,
        status: "PAYMENT_MARKED_BY_USER",
      },
      events: [],
      coach: {
        id: "coach-1",
        name: "Coach Carla",
      },
      paymentProof: {
        id: "proof-1",
        referenceNumber: "GCASH-123",
        notes: "Sent via GCash",
        fileUrl: "https://signed.example/proof.jpg",
        createdAt: "2026-03-15T02:00:00.000Z",
      },
    };

    render(<CoachReservationDetailPage reservationId="reservation-1" />);

    expect(screen.getByText("Payment Status")).toBeTruthy();
    expect(
      screen.getByText(
        "Payment proof has been submitted. Review the details below before confirming.",
      ),
    ).toBeTruthy();
    expect(screen.getByText("Proof submitted")).toBeTruthy();
    expect(screen.getByText("Rendered payment proof")).toBeTruthy();
    expect(screen.getByText("Reference Number: GCASH-123")).toBeTruthy();
    expect(screen.getByText("Sent via GCash")).toBeTruthy();
    expect(screen.getByText("View Receipt Image")).toBeTruthy();
    expect(screen.queryByText("No payment proof submitted yet.")).toBeNull();
  });

  it("renders awaiting-payment state when proof is still missing", () => {
    render(<CoachReservationDetailPage reservationId="reservation-1" />);

    expect(screen.getByText("Payment Status")).toBeTruthy();
    expect(screen.getByText("Chat")).toBeTruthy();
    expect(screen.getByText("Chat sheet for Player One")).toBeTruthy();
    expect(
      screen.getByText("Waiting for the player to submit payment proof."),
    ).toBeTruthy();
    expect(screen.getByText("Awaiting payment proof")).toBeTruthy();
    expect(screen.getByText("No payment proof submitted yet.")).toBeTruthy();
    expect(screen.queryByText("Rendered payment proof")).toBeNull();
    expect(screen.queryByText("View Receipt Image")).toBeNull();
  });
});
