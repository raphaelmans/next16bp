import { render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { PlaceDetailBookingSummaryCard } from "@/features/discovery/place-detail/components/place-detail-booking-summary-card";

type SummaryCardProps = ComponentProps<typeof PlaceDetailBookingSummaryCard>;

function makeProps(overrides?: Partial<SummaryCardProps>): SummaryCardProps {
  return {
    selectionMode: "court",
    courtsForSport: [
      { id: "court-1", label: "Court One" },
      { id: "court-2", label: "Court Two" },
    ],
    selectedCourtId: "court-1",
    selectedAddonCount: 0,
    durationMinutes: 180,
    hasSelection: false,
    selectionSummary: null,
    placeTimeZone: "Asia/Manila",
    summaryCtaVariant: "default",
    summaryCtaLabel: "Continue",
    onSummaryAction: vi.fn(),
    isAuthenticated: true,
    cartItems: [
      {
        key: "court-1|2026-03-06T15:00:00.000Z|180",
        courtId: "court-1",
        courtLabel: "Court One",
        sportId: "sport-1",
        startTime: "2026-03-06T15:00:00.000Z",
        durationMinutes: 180,
        estimatedPriceCents: 150000,
        currency: "PHP",
      },
      {
        key: "court-2|2026-03-06T15:00:00.000Z|180",
        courtId: "court-2",
        courtLabel: "Court Two",
        sportId: "sport-1",
        startTime: "2026-03-06T15:00:00.000Z",
        durationMinutes: 180,
        estimatedPriceCents: null,
        currency: "PHP",
      },
    ],
    canAddToCart: false,
    onAddToCartAction: vi.fn(),
    onRemoveFromCartAction: vi.fn(),
    ...overrides,
  };
}

describe("PlaceDetailBookingSummaryCard", () => {
  it("shows partial estimate state when some cart lines are unpriced", () => {
    render(<PlaceDetailBookingSummaryCard {...makeProps()} />);

    expect(screen.getByText("Partial estimate")).toBeTruthy();
    expect(screen.getByText(/Price unavailable/)).toBeTruthy();
    expect(screen.getByText("1 court pending price estimate.")).toBeTruthy();
  });
});
