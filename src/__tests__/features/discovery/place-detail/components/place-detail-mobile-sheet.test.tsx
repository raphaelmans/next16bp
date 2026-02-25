import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { PlaceDetailMobileSheet } from "@/features/discovery/place-detail/components/place-detail-mobile-sheet";
import type { BookingCartItem } from "@/features/discovery/place-detail/stores/booking-cart-store";

type MobileSheetProps = ComponentProps<typeof PlaceDetailMobileSheet>;

function makeCartItem(overrides?: Partial<BookingCartItem>): BookingCartItem {
  return {
    key: "court-1|2026-02-25T01:00:00.000Z|60",
    courtId: "court-1",
    courtLabel: "Court One",
    sportId: "sport-1",
    startTime: "2026-02-25T01:00:00.000Z",
    durationMinutes: 60,
    estimatedPriceCents: 50000,
    currency: "PHP",
    ...overrides,
  };
}

function makeProps(overrides?: Partial<MobileSheetProps>): MobileSheetProps {
  return {
    showBooking: true,
    mobileSheetExpanded: true,
    setMobileSheetExpanded: vi.fn(),
    sports: [{ id: "sport-1", name: "Pickleball" }],
    selectedSportId: "sport-1",
    onMobileSportChange: vi.fn(),
    courtsForSport: [{ id: "court-1", label: "Court One" }],
    selectionMode: "court",
    selectedCourtId: "court-1",
    onMobileCourtChange: vi.fn(),
    selectedDate: new Date("2026-02-25T00:00:00.000Z"),
    today: new Date("2026-02-24T00:00:00.000Z"),
    placeTimeZone: "Asia/Manila",
    onMobileDateSelect: vi.fn(),
    mobileCalendarOpen: false,
    setMobileCalendarOpen: vi.fn(),
    onMobileCalendarJump: vi.fn(),
    todayRangeStart: new Date("2026-02-24T00:00:00.000Z"),
    maxBookingDate: new Date("2026-04-25T00:00:00.000Z"),
    isMobileRefreshing: false,
    isMobileLoading: true,
    mobileDaySlots: [],
    selectedRange: {
      startTime: "2026-02-25T01:00:00.000Z",
      durationMinutes: 60,
    },
    onAnyRangeChange: vi.fn(),
    onCourtRangeChange: vi.fn(),
    onClearSelection: vi.fn(),
    onReserve: vi.fn(),
    onContinueFromCart: vi.fn(),
    hasSelection: true,
    selectionSummary: {
      startTime: "2026-02-25T01:00:00.000Z",
      endTime: "2026-02-25T02:00:00.000Z",
      totalCents: 50000,
      currency: "PHP",
    },
    selectionDateLabel: "Tue, Feb 25",
    selectionTimeLabel: "9:00 AM-10:00 AM",
    cartItems: [],
    canAddToCart: true,
    onAddToCartAction: vi.fn(),
    onRemoveFromCartAction: vi.fn(),
    ...overrides,
  };
}

describe("PlaceDetailMobileSheet", () => {
  it("moves to review step after adding to booking", () => {
    const onAddToCartAction = vi.fn();
    const onClearSelection = vi.fn();

    render(
      <PlaceDetailMobileSheet
        {...makeProps({
          onAddToCartAction,
          onClearSelection,
          cartItems: [makeCartItem()],
        })}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Add to booking" }));

    expect(onAddToCartAction).toHaveBeenCalledTimes(1);
    expect(onClearSelection).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Step 2 of 2 · Review booking")).toBeTruthy();
  });

  it("shows cart items in review step and allows removing an item", () => {
    const onRemoveFromCartAction = vi.fn();

    render(
      <PlaceDetailMobileSheet
        {...makeProps({
          hasSelection: false,
          canAddToCart: false,
          cartItems: [
            makeCartItem(),
            makeCartItem({
              key: "court-2|2026-02-25T02:00:00.000Z|60",
              courtId: "court-2",
              courtLabel: "Court Two",
              startTime: "2026-02-25T02:00:00.000Z",
              estimatedPriceCents: 70000,
            }),
          ],
          onRemoveFromCartAction,
        })}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Review booking (2)" }));

    expect(screen.getByText("Courts in booking (2)")).toBeTruthy();
    expect(screen.getByText("Court One")).toBeTruthy();
    expect(screen.getByText("Court Two")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Remove Court One" }));
    expect(onRemoveFromCartAction).toHaveBeenCalledWith(
      "court-1|2026-02-25T01:00:00.000Z|60",
    );
  });

  it("continues from review step via cart checkout action", () => {
    const onContinueFromCart = vi.fn();

    render(
      <PlaceDetailMobileSheet
        {...makeProps({
          hasSelection: false,
          canAddToCart: false,
          cartItems: [makeCartItem()],
          onContinueFromCart,
        })}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Review booking (1)" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Continue to review page" }),
    );

    expect(onContinueFromCart).toHaveBeenCalledTimes(1);
  });
});
